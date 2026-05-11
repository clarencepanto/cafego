import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../constants/config";

const memCache = {};

export function useExplore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const explore = useCallback(async (city) => {
    // 1 — check memory cache first (instant)
    if (memCache[city]) {
      setData(memCache[city]);
      return;
    }

    // 2 — check AsyncStorage cache (fast, persists between sessions)
    try {
      const stored = await AsyncStorage.getItem(`explore_${city}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only use cache if less than 24 hours old
        if (Date.now() - parsed.timestamp < 86400000) {
          memCache[city] = parsed.data;
          setData(parsed.data);
          return;
        }
      }
    } catch {}

    // 3 — fetch fresh data
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const [exploreRes, cafesRes] = await Promise.all([
        fetch(`${API_BASE}/api/explore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city }),
        }).catch(() => null),
        fetch(`${API_BASE}/api/cafes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city }),
        }).catch(() => null),
      ]);

      if (!exploreRes || !exploreRes.ok) {
        throw new Error(
          "Failed to load city guide — check your server is running",
        );
      }

      const exploreData = await exploreRes.json();
      const cafesData =
        cafesRes && cafesRes.ok ? await cafesRes.json() : { cafes: [] };

      const result = {
        tagline: exploreData.tagline || "",
        spots: Array.isArray(exploreData.spots) ? exploreData.spots : [],
        itinerary: Array.isArray(exploreData.itinerary)
          ? exploreData.itinerary
          : [],
        cafes: Array.isArray(cafesData.cafes) ? cafesData.cafes : [],
      };

      // Save to both caches
      memCache[city] = result;
      await AsyncStorage.setItem(
        `explore_${city}`,
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }),
      );

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, explore };
}

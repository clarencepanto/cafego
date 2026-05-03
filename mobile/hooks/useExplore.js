import { useState, useCallback } from "react";
import { API_BASE } from "../constants/config";

// Cache lives outside the hook so it persists across renders and navigation
const cache = {};

export function useExplore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const explore = useCallback(async (city) => {
    // If we already fetched this city, use the cache instantly
    if (cache[city]) {
      setData(cache[city]);
      return;
    }

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

      // Save to cache
      cache[city] = result;
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, explore };
}

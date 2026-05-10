import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { API_BASE } from "../constants/config";

export function useNearby() {
  const [cafes, setCafes] = useState([]);
  const [popularCafes, setPopularCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  useEffect(() => {
    fetchNearby();
  }, []);

  const fetchNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords);

      // Fetch both nearby and popular at the same time
      const [nearbyRes, popularRes] = await Promise.all([
        fetch(`${API_BASE}/api/cafes/nearby`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }),
        }),
        fetch(`${API_BASE}/api/cafes/popular`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }),
        }),
      ]);

      const nearbyData = nearbyRes.ok ? await nearbyRes.json() : { cafes: [] };
      const popularData = popularRes.ok
        ? await popularRes.json()
        : { cafes: [] };

      setCafes(nearbyData.cafes || []);
      setNextPageToken(nearbyData.nextPageToken || null);
      setPopularCafes(popularData.cafes || []);
    } catch (err) {
      setError("Could not fetch cafés");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || loadingMore || !location) return;
    setLoadingMore(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`${API_BASE}/api/cafes/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
          pagetoken: nextPageToken,
        }),
      });
      const data = await res.json();
      setCafes((prev) => [...prev, ...(data.cafes || [])]);
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      console.error("Load more error:", err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    cafes,
    popularCafes,
    loading,
    loadingMore,
    error,
    location,
    refresh: fetchNearby,
    loadMore,
    hasMore: !!nextPageToken,
  };
}

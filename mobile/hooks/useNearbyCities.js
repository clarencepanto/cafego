import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { API_BASE } from "../constants/config";

let cachedCities = null;

export function useNearbyCities() {
  const [cities, setCities] = useState(cachedCities || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cachedCities) return;
    fetchNearbyCities();
  }, []);

  const fetchNearbyCities = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const res = await fetch(`${API_BASE}/api/cities/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        }),
      });

      const data = await res.json();
      cachedCities = data.cities || [];
      setCities(cachedCities);
    } catch (err) {
      console.error("Nearby cities error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return { cities, loading };
}

import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { API_BASE } from "../constants/config";

export function useNearby() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

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

      const res = await fetch(`${API_BASE}/api/cafes/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        }),
      });

      const data = await res.json();
      setCafes(data.cafes || []);
    } catch (err) {
      setError("Could not fetch nearby cafés");
    } finally {
      setLoading(false);
    }
  };

  return { cafes, loading, error, location, refresh: fetchNearby };
}

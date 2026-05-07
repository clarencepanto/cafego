import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { API_BASE } from "../constants/config";

const cache = {};

export function useLocalTrips() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCity, setUserCity] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
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
      const { latitude: lat, longitude: lng } = loc.coords;

      // Reverse geocode
      const geoRes = await fetch(`${API_BASE}/api/location/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const { city, province } = await geoRes.json();
      setUserCity({ city, province });

      // Check cache
      if (cache[city]) {
        setData(cache[city]);
        setLoading(false);
        return;
      }

      // Fetch AI trips
      const tripsRes = await fetch(`${API_BASE}/api/trips/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, province, lat, lng }),
      });
      const trips = await tripsRes.json();
      cache[city] = trips;
      setData(trips);
    } catch (err) {
      setError("Could not load nearby trips");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, userCity, refresh: fetchTrips };
}

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CITIES_KEY = "cafego_saved_cities";
const ITINERARY_KEY = "cafego_saved_itinerary";

export function useSaved() {
  const [saved, setSaved] = useState([]);
  const [savedItinerary, setSavedItinerary] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [cities, itin] = await Promise.all([
        AsyncStorage.getItem(CITIES_KEY),
        AsyncStorage.getItem(ITINERARY_KEY),
      ]);
      if (cities) setSaved(JSON.parse(cities));
      if (itin) setSavedItinerary(JSON.parse(itin));
    } catch {}
  };

  const toggle = async (city) => {
    const next = saved.includes(city)
      ? saved.filter((c) => c !== city)
      : [...saved, city];
    setSaved(next);
    try {
      await AsyncStorage.setItem(CITIES_KEY, JSON.stringify(next));
    } catch {}
  };

  const toggleItinerary = async (item, city) => {
    const id = `${city}-${item.time}-${item.place}`;
    const exists = savedItinerary.find((i) => i.id === id);
    const next = exists
      ? savedItinerary.filter((i) => i.id !== id)
      : [...savedItinerary, { ...item, id, city }];
    setSavedItinerary(next);
    try {
      await AsyncStorage.setItem(ITINERARY_KEY, JSON.stringify(next));
    } catch {}
  };

  const isItinerarySaved = (item, city) => {
    const id = `${city}-${item.time}-${item.place}`;
    return savedItinerary.some((i) => i.id === id);
  };

  const isSaved = (city) => saved.includes(city);

  return {
    saved,
    savedItinerary,
    toggle,
    toggleItinerary,
    isItinerarySaved,
    isSaved,
  };
}

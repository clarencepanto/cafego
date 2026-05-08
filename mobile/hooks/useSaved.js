import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ITINERARY_KEY = "cafego_saved_itinerary";

export function useSaved() {
  const [savedItinerary, setSavedItinerary] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const itin = await AsyncStorage.getItem(ITINERARY_KEY);
      if (itin) setSavedItinerary(JSON.parse(itin));
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

  // kept for any remaining references
  const saved = [];
  const isSaved = () => false;
  const toggle = () => {};

  return {
    saved,
    savedItinerary,
    toggle,
    toggleItinerary,
    isItinerarySaved,
    isSaved,
  };
}

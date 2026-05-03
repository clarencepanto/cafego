import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./home";
import CityScreen from "./city";
import SpotScreen from "./spot";

export default function App() {
  const [mode, setMode] = useState("travel");
  const [city, setCity] = useState(null);
  const [coffeeOnly, setCoffeeOnly] = useState(false);
  const [spot, setSpot] = useState(null);

  const handleSelectCity = (selectedCity, isCoffeeOnly = false) => {
    setCity(selectedCity);
    setCoffeeOnly(isCoffeeOnly);
  };

  if (spot) {
    return (
      <SafeAreaProvider>
        <SpotScreen
          spot={spot}
          city={city}
          mode={mode}
          onBack={() => setSpot(null)}
        />
      </SafeAreaProvider>
    );
  }

  if (city) {
    return (
      <SafeAreaProvider>
        <CityScreen
          city={city}
          mode={mode}
          coffeeOnly={coffeeOnly}
          onBack={() => {
            setCity(null);
            setCoffeeOnly(false);
          }}
          onSelectSpot={setSpot}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <HomeScreen
        mode={mode}
        onModeChange={setMode}
        onSelectCity={handleSelectCity}
      />
    </SafeAreaProvider>
  );
}

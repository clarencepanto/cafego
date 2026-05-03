import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { TRAVEL, COFFEE, SHADOW } from "../constants/theme";
import { useCityPhoto } from "../hooks/useCityPhoto";
import { useSaved } from "../hooks/useSaved";
import { useNearby } from "../hooks/useNearby";

const CITIES = [
  { name: "Vancouver", province: "BC", emoji: "🌲" },
  { name: "Toronto", province: "ON", emoji: "🏙️" },
  { name: "Montreal", province: "QC", emoji: "🥐" },
  { name: "Calgary", province: "AB", emoji: "🏔️" },
  { name: "Victoria", province: "BC", emoji: "🌸" },
  { name: "Ottawa", province: "ON", emoji: "🍁" },
  { name: "Quebec City", province: "QC", emoji: "🏰" },
  { name: "Banff", province: "AB", emoji: "🦌" },
  { name: "Halifax", province: "NS", emoji: "⚓" },
];

const FILTERS = ["All", "BC", "ON", "QC", "AB", "NS"];

function CityCard({ city, onPress }) {
  const photo = useCityPhoto(city.name + " canada city");
  return (
    <TouchableOpacity
      style={[s.cityCard, SHADOW.md]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.cityCardPlaceholder]}>
          <Text style={{ fontSize: 32 }}>{city.emoji}</Text>
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, s.cityCardGradient]} />
      <View style={s.cityCardInfo}>
        <Text style={s.cityCardName}>{city.name}</Text>
        <Text style={s.cityCardSub}>{city.province}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CityGrid({ cities, onSelectCity }) {
  const rows = [];
  for (let i = 0; i < cities.length; i += 2) rows.push(cities.slice(i, i + 2));
  return (
    <View style={s.gridWrapper}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.gridRow}>
          {row.map((city) => (
            <CityCard
              key={city.name}
              city={city}
              onPress={() => onSelectCity(city.name)}
            />
          ))}
          {row.length === 1 && <View style={s.cityCard} />}
        </View>
      ))}
    </View>
  );
}

function NearbyCafeCard({ cafe, onPress }) {
  return (
    <TouchableOpacity
      style={[s.nearbyCafeCard, SHADOW.sm]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={s.nearbyCafeImg}>
        {cafe.photo ? (
          <Image
            source={{ uri: cafe.photo }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 32 }}>☕</Text>
        )}
      </View>
      <View style={s.nearbyCafeBody}>
        <Text style={s.nearbyCafeName} numberOfLines={1}>
          {cafe.name}
        </Text>
        <View style={s.nearbyCafeMeta}>
          {cafe.rating && (
            <Text style={s.nearbyCafeRating}>⭐ {cafe.rating}</Text>
          )}
          {cafe.openNow !== null && (
            <Text
              style={[
                s.nearbyCafeStatus,
                { color: cafe.openNow ? "#34C759" : "#FF3B30" },
              ]}
            >
              {cafe.openNow ? "Open" : "Closed"}
            </Text>
          )}
        </View>
        <Text style={s.nearbyCafeAddress} numberOfLines={1}>
          {cafe.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Search Screen ─────────────────────────────────────────────────────────────
function SearchScreen({ T, onSelectCity }) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.province.toLowerCase().includes(query.toLowerCase()),
      )
    : CITIES;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchWrap}>
        <View style={[s.searchInner, SHADOW.sm, { backgroundColor: T.card }]}>
          <Text style={{ fontSize: 15, color: T.muted }}>🔍</Text>
          <TextInput
            style={[s.searchInput, { color: T.text }]}
            placeholder="Search a Canadian city..."
            placeholderTextColor={T.muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={{ color: T.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[s.sectionRow, { marginTop: 8 }]}>
          <Text style={[s.sectionLabel, { color: T.text }]}>
            {query ? `Results for "${query}"` : "All Cities"}
          </Text>
          <Text style={[s.sectionLink, { color: T.muted }]}>
            {filtered.length} cities
          </Text>
        </View>
        {filtered.length === 0 ? (
          <Text
            style={{
              color: T.muted,
              textAlign: "center",
              padding: 40,
              fontSize: 15,
            }}
          >
            No cities found for "{query}"
          </Text>
        ) : (
          <CityGrid cities={filtered} onSelectCity={onSelectCity} />
        )}
      </ScrollView>
    </View>
  );
}

// ── Saved Screen ──────────────────────────────────────────────────────────────
function SavedScreen({
  T,
  savedItinerary,
  toggleItinerary,
  isSaved,
  onSelectCity,
}) {
  const savedCities = CITIES.filter((c) => isSaved(c.name));

  // Group itinerary by city
  const grouped = savedItinerary.reduce((acc, item) => {
    if (!acc[item.city]) acc[item.city] = [];
    acc[item.city].push(item);
    return acc;
  }, {});

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Saved Cities */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionLabel, { color: T.text }]}>Saved Cities</Text>
        <Text style={[s.sectionLink, { color: T.muted }]}>
          {savedCities.length} cities
        </Text>
      </View>
      {savedCities.length === 0 ? (
        <Text
          style={{
            color: T.muted,
            fontSize: 15,
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          No saved cities yet. Tap 🔖 on any city.
        </Text>
      ) : (
        <CityGrid cities={savedCities} onSelectCity={onSelectCity} />
      )}

      {/* Saved Itinerary grouped by city */}
      <View style={[s.sectionRow, { marginTop: 28 }]}>
        <Text style={[s.sectionLabel, { color: T.text }]}>Saved Itinerary</Text>
        <Text style={[s.sectionLink, { color: T.muted }]}>
          {savedItinerary.length} stops
        </Text>
      </View>

      {savedItinerary.length === 0 ? (
        <Text style={{ color: T.muted, fontSize: 15, paddingHorizontal: 20 }}>
          No saved stops yet. Tap + Add to Itinerary on any spot.
        </Text>
      ) : (
        Object.entries(grouped).map(([city, items]) => (
          <View key={city} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <TouchableOpacity onPress={() => onSelectCity(city)}>
              <View
                style={[s.cityGroupHeader, { backgroundColor: T.accentSoft }]}
              >
                <Text style={[s.cityGroupTitle, { color: T.accent }]}>
                  📍 {city}
                </Text>
                <Text style={[s.cityGroupCount, { color: T.accent }]}>
                  {items.length} stops ›
                </Text>
              </View>
            </TouchableOpacity>
            {items.map((item, i) => (
              <View
                key={i}
                style={[s.savedItem, { backgroundColor: T.card }, SHADOW.sm]}
              >
                <View style={[s.savedItemDot, { backgroundColor: T.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.savedItemPlace, { color: T.text }]}>
                    {item.place}
                  </Text>
                  <Text style={[s.savedItemTime, { color: T.muted }]}>
                    {item.time} · {item.note}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleItinerary(item, city)}
                  hitSlop={8}
                >
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Main Home Screen ──────────────────────────────────────────────────────────
export default function HomeScreen({ mode, onModeChange, onSelectCity }) {
  const insets = useSafeAreaInsets();
  const T = mode === "travel" ? TRAVEL : COFFEE;
  const isTravel = mode === "travel";
  const [custom, setCustom] = useState("");
  const [activeFilter, setFilter] = useState("All");
  const [activeNav, setActiveNav] = useState("home");
  const {
    saved,
    savedItinerary,
    toggle,
    toggleItinerary,
    isItinerarySaved,
    isSaved,
  } = useSaved();
  const {
    cafes: nearbyCafes,
    loading: nearbyLoading,
    error: nearbyError,
  } = useNearby();

  const filtered =
    activeFilter === "All"
      ? CITIES
      : CITIES.filter((c) => c.province === activeFilter);

  const handleSelectCity = (city, coffeeOnly = false) => {
    onSelectCity(city, coffeeOnly);
  };

  return (
    <View style={[s.root, { backgroundColor: T.bg, paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={T.bg}
        translucent={false}
      />

      <View style={s.topbar}>
        <View style={s.avatarRow}>
          <View style={[s.avatar, { backgroundColor: T.accentSoft }]}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
          <View>
            <Text style={[s.greetName, { color: T.headerText }]}>
              Hello, Explorer
            </Text>
            <Text style={[s.greetSub, { color: T.muted }]}>
              Welcome to CafeGo
            </Text>
          </View>
        </View>
        <View style={[s.bell, SHADOW.sm, { backgroundColor: T.card }]}>
          <Text style={{ fontSize: 17 }}>🔔</Text>
        </View>
      </View>

      {/* Search tab */}
      {activeNav === "search" && (
        <SearchScreen T={T} onSelectCity={onSelectCity} />
      )}

      {/* Saved tab */}
      {activeNav === "saved" && (
        <SavedScreen
          T={T}
          savedItinerary={savedItinerary}
          toggleItinerary={toggleItinerary}
          isSaved={isSaved}
          onSelectCity={onSelectCity}
        />
      )}

      {/* Home tab */}
      {activeNav === "home" && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <Text style={[s.heroTitle, { color: T.headerText }]}>
              {isTravel
                ? "Find your next\nadventure."
                : "Find your perfect\ncuppa."}
            </Text>
            <Text style={[s.heroSub, { color: T.muted }]}>
              {isTravel
                ? "Discover the best spots across Canada."
                : "Cozy cafés waiting just for you."}
            </Text>
          </View>

          <View style={s.searchWrap}>
            <View
              style={[s.searchInner, SHADOW.sm, { backgroundColor: T.card }]}
            >
              <Text style={{ fontSize: 15, color: T.muted }}>🔍</Text>
              <TextInput
                style={[s.searchInput, { color: T.text }]}
                placeholder={isTravel ? "Search a city..." : "Search cafés..."}
                placeholderTextColor={T.muted}
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={() =>
                  custom.trim() && onSelectCity(custom.trim())
                }
                returnKeyType="search"
              />
              <Text style={{ fontSize: 12, color: T.accent }}>📍 Canada</Text>
            </View>
          </View>

          <View style={[s.modeToggle, SHADOW.sm, { backgroundColor: T.card }]}>
            {["travel", "coffee"].map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, mode === m && { backgroundColor: T.accent }]}
                onPress={() => onModeChange(m)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 15 }}>
                  {m === "travel" ? "✈️" : "☕"}
                </Text>
                <Text
                  style={[
                    s.modeBtnText,
                    { color: mode === m ? "#fff" : T.muted },
                  ]}
                >
                  {m === "travel" ? "Travel" : "Coffee"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filtersContent}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  s.filterPill,
                  { backgroundColor: activeFilter === f ? T.accent : T.card },
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    s.filterText,
                    { color: activeFilter === f ? "#fff" : T.muted },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Travel mode */}
          {isTravel && (
            <>
              <View style={s.sectionRow}>
                <Text style={[s.sectionLabel, { color: T.text }]}>
                  Recommendation
                </Text>
                <Text style={[s.sectionLink, { color: T.accent }]}>
                  See all ›
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.recsContent}
              >
                {filtered.slice(0, 5).map((city) => (
                  <CityCard
                    key={city.name + "-rec"}
                    city={city}
                    onPress={() => onSelectCity(city.name)}
                  />
                ))}
              </ScrollView>
              <View style={[s.sectionRow, { marginTop: 20 }]}>
                <Text style={[s.sectionLabel, { color: T.text }]}>
                  All Cities
                </Text>
              </View>
              <CityGrid cities={filtered} onSelectCity={onSelectCity} />
            </>
          )}

          {/* Coffee mode */}
          {!isTravel && (
            <>
              {/* Nearby cafés via GPS */}
              <View style={s.sectionRow}>
                <Text style={[s.sectionLabel, { color: T.text }]}>
                  Loved by locals
                </Text>
                <Text style={[s.sectionLink, { color: T.muted }]}>
                  Near you
                </Text>
              </View>

              {nearbyLoading && (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator color={T.accent} />
                  <Text style={{ color: T.muted, fontSize: 13, marginTop: 8 }}>
                    Finding cafés near you...
                  </Text>
                </View>
              )}

              {nearbyError && (
                <Text
                  style={{
                    color: T.muted,
                    fontSize: 14,
                    paddingHorizontal: 20,
                    marginBottom: 16,
                  }}
                >
                  {nearbyError}
                </Text>
              )}

              {!nearbyLoading && nearbyCafes.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.recsContent}
                >
                  {nearbyCafes.map((cafe, i) => (
                    <NearbyCafeCard key={i} cafe={cafe} onPress={() => {}} />
                  ))}
                </ScrollView>
              )}

              {/* Browse by city — coffee only */}
              <View style={[s.sectionRow, { marginTop: 24 }]}>
                <Text style={[s.sectionLabel, { color: T.text }]}>
                  Browse by city
                </Text>
              </View>
              <CityGrid
                cities={CITIES.slice(0, 6)}
                onSelectCity={(city) => onSelectCity(city, true)}
              />
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View
        style={[
          s.bottomNav,
          { backgroundColor: T.card, paddingBottom: insets.bottom + 10 },
        ]}
      >
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "search", icon: "🔍", label: "Search" },
          {
            id: "saved",
            icon: "🔖",
            label:
              saved.length > 0 || savedItinerary.length > 0
                ? `Saved (${saved.length + savedItinerary.length})`
                : "Saved",
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.navItem}
            onPress={() => setActiveNav(item.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[s.navIcon, activeNav !== item.id && { opacity: 0.35 }]}
            >
              {item.icon}
            </Text>
            <Text
              style={[
                s.navLabel,
                { color: activeNav === item.id ? T.accent : T.muted },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  greetName: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  greetSub: { fontSize: 12 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { paddingHorizontal: 20, paddingBottom: 16 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 6,
  },
  heroSub: { fontSize: 14, lineHeight: 20 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },
  modeToggle: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    borderRadius: 99,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 99,
  },
  modeBtnText: { fontSize: 14, fontWeight: "600" },
  filtersContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
  filterText: { fontSize: 14, fontWeight: "600" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionLabel: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  sectionLink: { fontSize: 14, fontWeight: "600" },
  recsContent: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  gridWrapper: { paddingHorizontal: 20 },
  gridRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
  cityCard: {
    flex: 1,
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  cityCardPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  cityCardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "transparent",
  },
  cityCardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cityCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cityCardSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  nearbyCafeCard: {
    width: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  nearbyCafeImg: {
    width: "100%",
    height: 120,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  nearbyCafeBody: { padding: 12 },
  nearbyCafeName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  nearbyCafeMeta: { flexDirection: "row", gap: 8, marginBottom: 4 },
  nearbyCafeRating: { fontSize: 12, fontWeight: "600", color: "#888" },
  nearbyCafeStatus: { fontSize: 12, fontWeight: "700" },
  nearbyCafeAddress: { fontSize: 12, color: "#888" },
  cityGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  cityGroupTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  cityGroupCount: { fontSize: 13, fontWeight: "600" },
  savedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  savedItemDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  savedItemPlace: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  savedItemTime: { fontSize: 12, lineHeight: 18 },
  featureCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 24,
    marginBottom: 12,
  },
  featureBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  featureBtnText: { fontSize: 13, fontWeight: "700" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  navItem: { alignItems: "center", gap: 3, paddingHorizontal: 16 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: "600" },
});

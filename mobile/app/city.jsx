import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CafeModal from "../components/CafeModal";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { TRAVEL, COFFEE, SHADOW } from "../constants/theme";
import { useExplore } from "../hooks/useExplore";
import { useSaved } from "../hooks/useSaved";
import { useCityPhoto } from "../hooks/useCityPhoto";

function SpotGridCard({ spot, onPress }) {
  const photo = useCityPhoto(spot.name + " canada");
  const isMust = spot.type === "must-see";
  return (
    <TouchableOpacity
      style={[s.spotCard, SHADOW.md]}
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
        <View style={[StyleSheet.absoluteFill, s.spotPlaceholder]}>
          <Text style={{ fontSize: 40 }}>🏛️</Text>
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, s.spotGradient]} />
      <View style={s.spotBadge}>
        <Text
          style={[s.spotBadgeText, { color: isMust ? "#0071E3" : "#1a8f38" }]}
        >
          {isMust ? "Must-see" : "Hidden gem"}
        </Text>
      </View>
      <TouchableOpacity style={s.spotHeart} hitSlop={8}>
        <Text style={{ fontSize: 14 }}>🤍</Text>
      </TouchableOpacity>
      <View style={s.spotInfo}>
        <Text style={s.spotProvince}>{spot.distance}</Text>
        <Text style={s.spotName} numberOfLines={2}>
          {spot.name}
        </Text>
        <Text style={s.spotTime}>⏱ {spot.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CafeCard({ cafe, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => onPress && onPress()}
      activeOpacity={0.88}
      style={[s.cafeCard, SHADOW.sm]}
    >
      {cafe.photo && (
        <Image
          source={{ uri: cafe.photo }}
          style={s.cafePhoto}
          resizeMode="cover"
        />
      )}
      <View style={s.cafeBody}>
        <View style={s.cafeTop}>
          <Text style={s.cafeName} numberOfLines={1}>
            {cafe.name}
          </Text>
          {cafe.openNow !== null && (
            <View
              style={[
                s.cafeStatus,
                {
                  backgroundColor: cafe.openNow
                    ? "rgba(52,199,89,0.12)"
                    : "rgba(255,59,48,0.1)",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: cafe.openNow ? "#1a8f38" : "#cc2a20",
                }}
              >
                {cafe.openNow ? "Open" : "Closed"}
              </Text>
            </View>
          )}
        </View>
        {cafe.rating && (
          <Text style={s.cafeRating}>
            ⭐ {cafe.rating} ({cafe.totalRatings?.toLocaleString()} reviews)
          </Text>
        )}
        <Text style={s.cafeAddress} numberOfLines={2}>
          {cafe.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CityScreen({
  city,
  mode,
  coffeeOnly,
  onBack,
  onSelectSpot,
}) {
  const T = mode === "travel" ? TRAVEL : COFFEE;
  const insets = useSafeAreaInsets(); // ← add this
  const { data, loading, error, explore } = useExplore();
  const { isSaved, toggle } = useSaved();
  const [tab, setTab] = useState("Cafés");
  const [selectedCafe, setSelectedCafe] = useState(null);
  const TABS =
    coffeeOnly || mode === "coffee"
      ? ["Cafés"]
      : ["Spots", "Itinerary", "Cafés"];
  useEffect(() => {
    explore(city);
  }, [city]);

  return (
    <View style={[s.root, { backgroundColor: T.bg, paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={T.bg}
        translucent={false}
      />

      <View style={s.nav}>
        <TouchableOpacity
          style={[s.backBtn, SHADOW.sm, { backgroundColor: T.card }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, color: T.text }}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: T.text }]}>{city}</Text>
        <TouchableOpacity onPress={() => toggle(city)}>
          <Text
            style={[s.saveTxt, { color: isSaved(city) ? T.accent : T.muted }]}
          >
            {isSaved(city) ? "🔖 Saved" : "🔖 Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={[s.loadingText, { color: T.muted }]}>
            Loading {city}...
          </Text>
        </View>
      )}

      {error && (
        <View style={s.center}>
          <Text
            style={{
              color: T.muted,
              fontSize: 15,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <TouchableOpacity onPress={() => explore(city)}>
            <Text style={{ color: T.accent, fontSize: 17, fontWeight: "600" }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {data && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero */}
          <View style={s.hero}>
            <Text style={[s.heroTitle, { color: T.headerText }]}>{city}</Text>
            {data.tagline ? (
              <Text style={[s.heroSub, { color: T.muted }]}>
                {data.tagline}
              </Text>
            ) : null}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsContent}
          >
            {TABS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.tab,
                  {
                    backgroundColor: tab === t ? T.accent : T.card,
                    borderColor: tab === t ? T.accent : T.subtle,
                  },
                ]}
                onPress={() => setTab(t)}
                activeOpacity={0.85}
              >
                <Text
                  style={[s.tabText, { color: tab === t ? "#fff" : T.muted }]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content */}
          <View style={s.content}>
            {tab === "Spots" &&
              (data.spots.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: T.card }]}>
                  <Text
                    style={{
                      color: T.muted,
                      fontSize: 15,
                      textAlign: "center",
                    }}
                  >
                    No spots found. Make sure your server is running and your
                    Anthropic API key is set.
                  </Text>
                </View>
              ) : (
                <View style={s.spotsGrid}>
                  {(() => {
                    const rows = [];
                    for (let i = 0; i < data.spots.length; i += 2) {
                      rows.push(data.spots.slice(i, i + 2));
                    }
                    return rows.map((row, ri) => (
                      <View key={ri} style={s.spotRow}>
                        {row.map((spot, si) => (
                          <SpotGridCard
                            key={`${ri}-${si}`}
                            spot={spot}
                            onPress={() => onSelectSpot(spot)}
                          />
                        ))}
                        {row.length === 1 && <View style={s.spotCardEmpty} />}
                      </View>
                    ));
                  })()}
                </View>
              ))}

            {tab === "Itinerary" && (
              <View style={[s.itin, { backgroundColor: T.card }, SHADOW.sm]}>
                <View style={s.itinHeader}>
                  <Text style={[s.itinTitle, { color: T.text }]}>
                    Your day in {city}
                  </Text>
                  <View style={[s.itinPill, { backgroundColor: T.accentSoft }]}>
                    <Text style={[s.itinPillText, { color: T.accent }]}>
                      1 day
                    </Text>
                  </View>
                </View>
                {data.itinerary.map((item, i) => (
                  <View key={i} style={s.itinItem}>
                    <View
                      style={[
                        s.itinDot,
                        { backgroundColor: T.accent, borderColor: T.card },
                      ]}
                    />
                    <View style={s.itinContent}>
                      <Text style={[s.itinTime, { color: T.muted }]}>
                        {item.time}
                      </Text>
                      <Text style={[s.itinPlace, { color: T.text }]}>
                        {item.place}
                      </Text>
                      <Text style={[s.itinNote, { color: T.muted }]}>
                        {item.note}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {tab === "Cafés" && (
              <View style={{ gap: 12 }}>
                {data.cafes.length === 0 ? (
                  <View style={[s.emptyCard, { backgroundColor: T.card }]}>
                    <Text
                      style={{
                        color: T.muted,
                        fontSize: 15,
                        textAlign: "center",
                        lineHeight: 22,
                      }}
                    >
                      Add your Google Places API key to see real cafés in {city}
                      .
                    </Text>
                  </View>
                ) : (
                  data.cafes.map((cafe, i) => (
                    <CafeCard
                      key={i}
                      cafe={cafe}
                      onPress={() => setSelectedCafe(cafe)}
                    />
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
      {selectedCafe && (
        <CafeModal
          cafe={selectedCafe}
          mode={mode}
          onClose={() => setSelectedCafe(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  saveTxt: { fontSize: 13, fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  loadingText: { fontSize: 15, marginTop: 8 },
  hero: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  heroSub: { fontSize: 14, lineHeight: 20 },
  tabsContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  tabText: { fontSize: 14, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  spotsGrid: { gap: 14 },
  spotRow: { flexDirection: "row", gap: 14 },
  spotCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  spotCardEmpty: { flex: 1 },
  spotPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },
  spotGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "transparent",
  },
  spotBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  spotBadgeText: { fontSize: 11, fontWeight: "700" },
  spotHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  spotInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 },
  spotProvince: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  spotName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spotTime: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  cafeCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
  cafePhoto: { width: "100%", height: 160 },
  cafeBody: { padding: 14 },
  cafeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 10,
  },
  cafeName: { fontSize: 17, fontWeight: "700", flex: 1, letterSpacing: -0.3 },
  cafeStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  cafeRating: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    fontWeight: "500",
  },
  cafeAddress: { fontSize: 13, color: "#888", lineHeight: 18 },
  itin: { borderRadius: 22, padding: 20 },
  itinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  itinTitle: { fontSize: 17, fontWeight: "700" },
  itinPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  itinPillText: { fontSize: 12, fontWeight: "600" },
  itinItem: {
    flexDirection: "row",
    marginBottom: 20,
    paddingLeft: 22,
    position: "relative",
  },
  itinDot: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
  },
  itinContent: { flex: 1 },
  itinTime: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itinPlace: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  itinNote: { fontSize: 13, lineHeight: 18 },
  emptyCard: { borderRadius: 22, padding: 40, alignItems: "center" },
});

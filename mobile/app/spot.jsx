import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import { TRAVEL, COFFEE, SHADOW } from "../constants/theme";
import { useCityPhoto } from "../hooks/useCityPhoto";
import { useSaved } from "../hooks/useSaved";
import { API_BASE } from "../constants/config";

const CROWD = {
  low: { label: "Quiet", color: "#34C759" },
  medium: { label: "Moderate", color: "#FF9500" },
  high: { label: "Busy", color: "#FF3B30" },
};

const PILLS = [
  { id: "overview", icon: "📋", label: "Overview" },
  { id: "map", icon: "🗺", label: "Map" },
  { id: "tips", icon: "💡", label: "Tips" },
  { id: "directions", icon: "🧭", label: "Directions" },
];

export default function SpotScreen({ spot, city, mode, onBack }) {
  const insets = useSafeAreaInsets();
  const T = mode === "travel" ? TRAVEL : COFFEE;
  const photo = useCityPhoto(spot.name + " " + city);
  const crowd = CROWD[spot.crowd] || CROWD.medium;
  const [activeTab, setActiveTab] = useState("overview");
  const { toggleItinerary, isItinerarySaved } = useSaved();
  const saved = isItinerarySaved(spot, city);

  const mapsQuery = encodeURIComponent(`${spot.name}, ${city}, Canada`);
  const mapsUrl = `https://maps.google.com/?q=${mapsQuery}`;
  const directionsUrl = `https://maps.google.com/maps?daddr=${mapsQuery}`;

  // Google Maps Embed URL — works with Maps Embed API
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_BASE.includes("localhost") ? "" : ""}&q=${mapsQuery}`;

  // We'll use a simple HTML page inside WebView instead of iframe
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { height: 100vh; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body>
      <iframe
        src="https://maps.google.com/maps?q=${mapsQuery}&output=embed"
        allowfullscreen
      ></iframe>
    </body>
    </html>
  `;

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero photo */}
        <View style={s.hero}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={s.heroImg}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[s.heroPlaceholder, { backgroundColor: T.accentSoft }]}
            >
              <Text style={{ fontSize: 72 }}>🏛️</Text>
            </View>
          )}
          <View style={[s.heroNav, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={[s.heroBtn, SHADOW.sm]} onPress={onBack}>
              <Text style={{ fontSize: 20, color: "#111" }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.heroBtn, SHADOW.sm]}>
              <Text style={{ fontSize: 18, color: "#111" }}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <View style={[s.body, { backgroundColor: T.bg }]}>
          {/* Title row */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: T.headerText }]}>
                {spot.name}
              </Text>
              <Text style={[s.location, { color: T.muted }]}>
                📍 {spot.distance}, {city}
              </Text>
            </View>
            <View style={s.crowdBadge}>
              <View style={[s.crowdDot, { backgroundColor: crowd.color }]} />
              <Text style={[s.crowdText, { color: crowd.color }]}>
                {crowd.label}
              </Text>
            </View>
          </View>

          {/* Info pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.pillsScroll}
            contentContainerStyle={{ gap: 10 }}
          >
            {PILLS.map((pill) => (
              <TouchableOpacity
                key={pill.id}
                style={[
                  s.pill,
                  SHADOW.sm,
                  {
                    backgroundColor: activeTab === pill.id ? T.accent : T.card,
                    borderColor: activeTab === pill.id ? T.accent : T.subtle,
                  },
                ]}
                onPress={() => setActiveTab(pill.id)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 16 }}>{pill.icon}</Text>
                <Text
                  style={[
                    s.pillText,
                    { color: activeTab === pill.id ? "#fff" : T.text },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Overview */}
          {activeTab === "overview" && (
            <>
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: T.text }]}>
                  Description
                </Text>
                <Text style={[s.desc, { color: T.muted }]}>{spot.desc}</Text>
              </View>
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: T.text }]}>
                  Schedule Overview
                </Text>
                <View style={s.statsRow}>
                  <View
                    style={[s.statBox, { backgroundColor: T.card }, SHADOW.sm]}
                  >
                    <Text style={[s.statLabel, { color: T.muted }]}>
                      Best time
                    </Text>
                    <Text style={[s.statVal, { color: T.text }]}>
                      {spot.bestTime || "Anytime"}
                    </Text>
                  </View>
                  <View
                    style={[s.statBox, { backgroundColor: T.card }, SHADOW.sm]}
                  >
                    <Text style={[s.statLabel, { color: T.muted }]}>
                      Duration
                    </Text>
                    <Text style={[s.statVal, { color: T.text }]}>
                      {spot.time}
                    </Text>
                  </View>
                  <View
                    style={[s.statBox, { backgroundColor: T.card }, SHADOW.sm]}
                  >
                    <Text style={[s.statLabel, { color: T.muted }]}>
                      Crowds
                    </Text>
                    <Text style={[s.statVal, { color: crowd.color }]}>
                      {crowd.label}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Map — using WebView with HTML to avoid iframe warning */}
          {activeTab === "map" && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: T.text }]}>Location</Text>
              <View style={[s.mapFrame, SHADOW.md]}>
                <WebView
                  source={{ html: mapHTML }}
                  style={{ height: 300, borderRadius: 16 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                  renderLoading={() => (
                    <View
                      style={[s.mapLoading, { backgroundColor: T.accentSoft }]}
                    >
                      <Text style={{ color: T.muted, fontSize: 14 }}>
                        Loading map...
                      </Text>
                    </View>
                  )}
                />
              </View>
              <TouchableOpacity
                style={[s.mapsBtn, { backgroundColor: T.accent }, SHADOW.md]}
                onPress={() => Linking.openURL(mapsUrl)}
                activeOpacity={0.88}
              >
                <Text style={s.mapsBtnText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          {activeTab === "tips" && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: T.text }]}>
                Insider Tips
              </Text>
              {[
                `Visit during ${spot.bestTime?.toLowerCase() || "early morning"} for the best experience.`,
                spot.crowd === "high"
                  ? "Popular spot — arrive early or book ahead to skip the wait."
                  : "A quieter gem — enjoy it without the tourist rush.",
                `Set aside at least ${spot.time} to properly explore this spot.`,
                "Check local weather before heading out, especially for outdoor spots.",
              ].map((tip, i) => (
                <View
                  key={i}
                  style={[s.tipRow, { borderBottomColor: T.subtle }]}
                >
                  <View style={[s.tipNum, { backgroundColor: T.accentSoft }]}>
                    <Text style={[s.tipNumText, { color: T.accent }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[s.tipText, { color: T.muted }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Directions */}
          {activeTab === "directions" && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: T.text }]}>
                Getting There
              </Text>
              <View style={[s.dirCard, { backgroundColor: T.card }, SHADOW.sm]}>
                <Text style={[s.dirTitle, { color: T.text }]}>
                  📍 {spot.name}
                </Text>
                <Text style={[s.dirSub, { color: T.muted }]}>
                  {city}, Canada
                </Text>
                <Text style={[s.dirDist, { color: T.muted }]}>
                  {spot.distance}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.mapsBtn, { backgroundColor: T.accent }, SHADOW.md]}
                onPress={() => Linking.openURL(directionsUrl)}
                activeOpacity={0.88}
              >
                <Text style={s.mapsBtnText}>Get Directions in Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomCTA, { backgroundColor: T.bg }]}>
        <TouchableOpacity
          style={[
            s.ctaBtn,
            { backgroundColor: saved ? T.accentSoft : T.accent },
            SHADOW.lg,
          ]}
          onPress={() => toggleItinerary(spot, city)}
          activeOpacity={0.88}
        >
          <Text style={[s.ctaBtnText, { color: saved ? T.accent : "#fff" }]}>
            {saved ? "✓ Saved to Itinerary" : "+ Add to Itinerary"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: { height: 320, position: "relative" },
  heroImg: { width: "100%", height: "100%" },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { borderRadius: 24, marginTop: -20, padding: 20, paddingBottom: 40 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 4,
  },
  location: { fontSize: 14, fontWeight: "500" },
  crowdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 6,
  },
  crowdDot: { width: 8, height: 8, borderRadius: 4 },
  crowdText: { fontSize: 12, fontWeight: "700" },
  pillsScroll: { marginBottom: 24 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 14, fontWeight: "600" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  desc: { fontSize: 15, lineHeight: 24, letterSpacing: -0.1 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  mapFrame: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    height: 300,
  },
  mapLoading: { height: 300, alignItems: "center", justifyContent: "center" },
  mapsBtn: { borderRadius: 16, padding: 16, alignItems: "center" },
  mapsBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  tipRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  tipNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipNumText: { fontSize: 13, fontWeight: "700" },
  tipText: { flex: 1, fontSize: 14, lineHeight: 22 },
  dirCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  dirTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  dirSub: { fontSize: 14, marginBottom: 4 },
  dirDist: { fontSize: 13 },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
  },
  ctaBtn: { borderRadius: 18, padding: 18, alignItems: "center" },
  ctaBtnText: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
});

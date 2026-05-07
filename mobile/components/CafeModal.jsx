import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TRAVEL, COFFEE, SHADOW } from "../constants/theme";
import { API_BASE } from "../constants/config";

const PRICE = { 0: "Free", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

export default function CafeModal({ cafe, mode, onClose }) {
  const T = mode === "travel" ? TRAVEL : COFFEE;
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (cafe?.placeId) fetchDetails();
  }, [cafe]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cafe/details/${cafe.placeId}`);
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error("Details error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapsQuery = encodeURIComponent(`${cafe.name}, Canada`);

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>* { margin: 0; padding: 0; } body { height: 100vh; } iframe { width: 100%; height: 100%; border: none; }</style>
    </head>
    <body>
      <iframe src="https://maps.google.com/maps?q=${mapsQuery}&output=embed" allowfullscreen></iframe>
    </body>
    </html>
  `;

  const TABS = [
    { id: "info", label: "Info", icon: "ℹ️" },
    { id: "map", label: "Map", icon: "🗺" },
    { id: "hours", label: "Hours", icon: "🕐" },
  ];

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!cafe}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <TouchableOpacity
          style={s.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            s.sheet,
            { backgroundColor: T.bg, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Handle */}
          <View style={s.handle} />

          {/* Close button */}
          <View style={s.header}>
            <TouchableOpacity
              style={[s.closeBtn, { backgroundColor: T.accentSoft }]}
              onPress={onClose}
            >
              <Text style={{ fontSize: 16, color: T.accent }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Photo */}
          {cafe.photo && (
            <Image
              source={{ uri: cafe.photo }}
              style={s.photo}
              resizeMode="cover"
            />
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.body}>
              {/* Name + status */}
              <View style={s.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: T.headerText }]}>
                    {cafe.name}
                  </Text>
                  <Text style={[s.address, { color: T.muted }]}>
                    {cafe.address}
                  </Text>
                </View>
                {cafe.openNow !== null && (
                  <View
                    style={[
                      s.statusBadge,
                      {
                        backgroundColor: cafe.openNow
                          ? "rgba(52,199,89,0.12)"
                          : "rgba(255,59,48,0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: cafe.openNow ? "#34C759" : "#FF3B30",
                      }}
                    >
                      {cafe.openNow ? "Open" : "Closed"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Rating + price */}
              <View style={s.metaRow}>
                {cafe.rating && (
                  <View style={[s.metaPill, { backgroundColor: T.accentSoft }]}>
                    <Text style={[s.metaText, { color: T.accent }]}>
                      ⭐ {cafe.rating} ({cafe.totalRatings?.toLocaleString()})
                    </Text>
                  </View>
                )}
                {details?.priceLevel != null && (
                  <View style={[s.metaPill, { backgroundColor: T.accentSoft }]}>
                    <Text style={[s.metaText, { color: T.accent }]}>
                      {PRICE[details.priceLevel]}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tabs */}
              <View style={s.tabRow}>
                {TABS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      s.tab,
                      {
                        backgroundColor: activeTab === t.id ? T.accent : T.card,
                        borderColor: activeTab === t.id ? T.accent : T.subtle,
                      },
                    ]}
                    onPress={() => setActiveTab(t.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                    <Text
                      style={[
                        s.tabText,
                        { color: activeTab === t.id ? "#fff" : T.muted },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {loading && (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator color={T.accent} />
                </View>
              )}

              {/* Info tab */}
              {!loading && activeTab === "info" && (
                <View style={s.section}>
                  {details?.phone && (
                    <TouchableOpacity
                      style={[
                        s.contactRow,
                        { backgroundColor: T.card },
                        SHADOW.sm,
                      ]}
                      onPress={() => Linking.openURL(`tel:${details.phone}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: 20 }}>📞</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.contactLabel, { color: T.muted }]}>
                          Phone
                        </Text>
                        <Text style={[s.contactValue, { color: T.accent }]}>
                          {details.phone}
                        </Text>
                      </View>
                      <Text style={{ color: T.muted }}>›</Text>
                    </TouchableOpacity>
                  )}

                  {details?.website && (
                    <TouchableOpacity
                      style={[
                        s.contactRow,
                        { backgroundColor: T.card },
                        SHADOW.sm,
                      ]}
                      onPress={() => Linking.openURL(details.website)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: 20 }}>🌐</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.contactLabel, { color: T.muted }]}>
                          Website
                        </Text>
                        <Text
                          style={[s.contactValue, { color: T.accent }]}
                          numberOfLines={1}
                        >
                          {details.website}
                        </Text>
                      </View>
                      <Text style={{ color: T.muted }}>›</Text>
                    </TouchableOpacity>
                  )}

                  {!details?.phone && !details?.website && (
                    <Text
                      style={{
                        color: T.muted,
                        fontSize: 14,
                        textAlign: "center",
                        padding: 20,
                      }}
                    >
                      No contact info available for this café.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      s.mapsBtn,
                      { backgroundColor: T.accent },
                      SHADOW.md,
                    ]}
                    onPress={() =>
                      Linking.openURL(
                        details?.mapsUrl ||
                          `https://maps.google.com/?q=${mapsQuery}`,
                      )
                    }
                    activeOpacity={0.88}
                  >
                    <Text style={s.mapsBtnText}>Open in Google Maps</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Map tab */}
              {activeTab === "map" && (
                <View style={s.section}>
                  <View style={[s.mapFrame, SHADOW.md]}>
                    <WebView
                      source={{ html: mapHTML }}
                      style={{ height: 280, borderRadius: 16 }}
                      scrollEnabled={false}
                      javaScriptEnabled
                      domStorageEnabled
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      s.mapsBtn,
                      { backgroundColor: T.accent },
                      SHADOW.md,
                    ]}
                    onPress={() =>
                      Linking.openURL(
                        `https://maps.google.com/maps?daddr=${mapsQuery}`,
                      )
                    }
                    activeOpacity={0.88}
                  >
                    <Text style={s.mapsBtnText}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Hours tab */}
              {!loading && activeTab === "hours" && (
                <View style={s.section}>
                  {details?.openingHours?.length > 0 ? (
                    <View
                      style={[
                        s.hoursCard,
                        { backgroundColor: T.card },
                        SHADOW.sm,
                      ]}
                    >
                      {details.openingHours.map((h, i) => (
                        <View
                          key={i}
                          style={[s.hoursRow, { borderBottomColor: T.subtle }]}
                        >
                          <Text style={[s.hoursDay, { color: T.text }]}>
                            {h.split(": ")[0]}
                          </Text>
                          <Text style={[s.hoursTime, { color: T.muted }]}>
                            {h.split(": ")[1]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: T.muted,
                        fontSize: 14,
                        textAlign: "center",
                        padding: 20,
                      }}
                    >
                      Hours not available.
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayTouch: { flex: 1 },
  sheet: { borderRadius: 24, maxHeight: "90%" },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: { width: "100%", height: 200 },
  body: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  address: { fontSize: 13, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  metaPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  metaText: { fontSize: 13, fontWeight: "600" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  section: { gap: 12 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactValue: { fontSize: 14, fontWeight: "600" },
  mapsBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  mapsBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  mapFrame: { borderRadius: 16, overflow: "hidden" },
  hoursCard: { borderRadius: 16, overflow: "hidden" },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  hoursDay: { fontSize: 14, fontWeight: "600" },
  hoursTime: { fontSize: 14 },
});

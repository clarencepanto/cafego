import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ─── Generate city spots + itinerary via Claude ───────────────────────────────
app.post("/api/explore", async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a travel expert for ${city}. Respond ONLY with a valid JSON object, no markdown, no backticks, no extra text. Use this exact schema:
{
  "tagline": "a short poetic 1-sentence vibe for ${city}",
  "spots": [
    {
      "name": "string",
      "type": "must-see | hidden-gem",
      "desc": "2 sentence warm description",
      "distance": "e.g. City centre or 20 min from downtown",
      "crowd": "low | medium | high",
      "time": "e.g. 1–2 hrs",
      "bestTime": "e.g. Early morning or Golden hour"
    }
  ],
  "itinerary": [
    { "time": "e.g. 9:00 AM", "place": "string", "note": "short insider tip" }
  ]
}
Include exactly 5 spots and 6 itinerary items. Make descriptions vivid and specific to ${city}.`,
        },
      ],
    });

    const raw = message.content[0].text.trim();
    const parsed = JSON.parse(raw);
    console.log(parsed);
    res.json(parsed);
  } catch (err) {
    console.error("Anthropic error:", err.message);
    res.status(500).json({ error: "Failed to generate city guide" });
  }
});

// ─── Find cafés via Google Places ────────────────────────────────────────────
app.post("/api/cafes", async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "City is required" });

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_KEY)
    return res.status(500).json({ error: "Google API key not configured" });

  try {
    // Step 1: geocode the city
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_KEY}`,
    );
    const geoData = await geoRes.json();
    const location = geoData.results[0]?.geometry?.location;
    if (!location) return res.status(404).json({ error: "City not found" });

    // Step 2: nearby search for cozy cafés
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=2000&type=cafe&keyword=cozy+cafe&key=${GOOGLE_KEY}`,
    );
    const placesData = await placesRes.json();

    const cafes = (placesData.results || []).slice(0, 5).map((p) => ({
      name: p.name,
      rating: p.rating,
      totalRatings: p.user_ratings_total,
      address: p.vicinity,
      openNow: p.opening_hours?.open_now ?? null,
      placeId: p.place_id,
      photo: p.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${GOOGLE_KEY}`
        : null,
    }));

    res.json({ cafes, city });

    console.log(cafes);
  } catch (err) {
    console.error("Google Places error:", err.message);
    res.status(500).json({ error: "Failed to fetch cafés" });
  }
});

// ─── City photo via Unsplash ──────────────────────────────────────────────────
app.get("/api/photo/:city", async (req, res) => {
  const { city } = req.params;
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return res.status(500).json({ error: "No Unsplash key" });
  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    const data = await r.json();
    const url = data.results?.[0]?.urls?.regular;
    console.log(url);
    if (!url) return res.status(404).json({ error: "No photo found" });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Nearby cafés by coordinates ──────────────────────────────────────────────
app.post("/api/cafes/nearby", async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng)
    return res.status(400).json({ error: "Coordinates required" });

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_KEY)
    return res.status(500).json({ error: "Google API key not configured" });

  try {
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&key=${GOOGLE_KEY}`,
    );
    const placesData = await placesRes.json();

    const cafes = (placesData.results || []).slice(0, 8).map((p) => ({
      name: p.name,
      rating: p.rating,
      totalRatings: p.user_ratings_total,
      address: p.vicinity,
      openNow: p.opening_hours?.open_now ?? null,
      placeId: p.place_id,
      photo: p.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${GOOGLE_KEY}`
        : null,
    }));

    res.json({ cafes });
  } catch (err) {
    console.error("Nearby cafes error:", err.message);
    res.status(500).json({ error: "Failed to fetch nearby cafés" });
  }
});

// ─── Location-based trip recommendations ──────────────────────────────────────
app.post("/api/trips/nearby", async (req, res) => {
  const { city, province, lat, lng } = req.body;
  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `The user is currently in ${city}, ${province || "Canada"}. 
Respond ONLY with valid JSON, no markdown, no backticks.
{
  "local": [
    {
      "name": "place name in or very close to ${city}",
      "type": "must-see | hidden-gem",
      "desc": "2 sentence description",
      "distance": "e.g. In ${city} or 10 min from downtown",
      "duration": "e.g. Half day",
      "emoji": "single relevant emoji"
    }
  ],
  "nearby": [
    {
      "name": "destination name within 3 hours of ${city}",
      "type": "day-trip | weekend",
      "desc": "2 sentence description", 
      "distance": "e.g. 1.5 hrs from ${city}",
      "duration": "e.g. Full day or Weekend",
      "emoji": "single relevant emoji"
    }
  ],
  "popular": [
    {
      "name": "most iconic destination in the region",
      "desc": "1 sentence",
      "distance": "e.g. 45 min from ${city}",
      "emoji": "single relevant emoji"
    }
  ]
}
Include 4 local spots, 4 nearby destinations, 3 popular picks. Be specific to ${city} and surrounding area.`,
        },
      ],
    });

    const raw = message.content[0].text.trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    console.error("Nearby trips error:", err.message);
    res.status(500).json({ error: "Failed to generate nearby trips" });
  }
});

// ─── Reverse geocode coords to city name ─────────────────────────────────────
app.post("/api/location/reverse", async (req, res) => {
  const { lat, lng } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`,
    );
    const data = await r.json();
    const components = data.results[0]?.address_components || [];
    const city =
      components.find((c) => c.types.includes("locality"))?.long_name ||
      "your area";
    const province =
      components.find((c) => c.types.includes("administrative_area_level_1"))
        ?.short_name || "Canada";
    res.json({ city, province });
  } catch (err) {
    res.status(500).json({ error: "Reverse geocode failed" });
  }
});

// ─── Get café details (menu, phone, website) ─────────────────────────────────
app.get("/api/cafe/details/:placeId", async (req, res) => {
  const { placeId } = req.params;
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_KEY)
    return res.status(500).json({ error: "Google API key not configured" });

  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,opening_hours,formatted_address,photos,url,price_level&key=${GOOGLE_KEY}`,
    );
    const data = await r.json();
    const p = data.result || {};
    res.json({
      name: p.name,
      phone: p.formatted_phone_number || null,
      website: p.website || null,
      address: p.formatted_address || null,
      rating: p.rating || null,
      mapsUrl: p.url || null,
      priceLevel: p.price_level || null,
      openingHours: p.opening_hours?.weekday_text || [],
      photos: (p.photos || [])
        .slice(0, 3)
        .map(
          (ph) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ph.photo_reference}&key=${GOOGLE_KEY}`,
        ),
    });
  } catch (err) {
    console.error("Place details error:", err.message);
    res.status(500).json({ error: "Failed to fetch café details" });
  }
});

// ─── Find nearby cities by coordinates ───────────────────────────────────────
app.post("/api/cities/nearby", async (req, res) => {
  const { lat, lng } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=150000&type=locality&key=${GOOGLE_KEY}`,
    );
    const data = await r.json();
    const cities = (data.results || []).slice(0, 10).map((p) => ({
      name: p.name,
      distance: `${Math.round(p.geometry.location.lat)}km`,
      placeId: p.place_id,
    }));
    res.json({ cities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Config (safe public keys) ────────────────────────────────────────────────
app.get("/api/config", (_, res) => {
  res.json({ googleMapsKey: process.env.GOOGLE_PLACES_API_KEY || "" });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`☕ CafeGo server running on http://localhost:${PORT}`);
});

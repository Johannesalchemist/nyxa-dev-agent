// server.ts — Express server for Amuse Events webapp

import express from "express";
import path from "path";

import {
  handleCreateEvent,
  handleGetNearbyEvents,
  handleGetMap,
  handleJoinEvent,
  handleLeaveEvent,
  handleReportEvent,
  handleRoulette,
  handleRateEvent,
  handleGetFeed,
  getStore,
} from "../amuse_events.controller";
import { DEFAULT_SEARCH_RADIUS_KM } from "../amuse_events.config";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- API Routes ---

// POST /api/events — Create event
app.post("/api/events", (req, res) => {
  const result = handleCreateEvent(req.body);
  res.status(result.success ? 201 : 400).json(result);
});

// GET /api/events/nearby — Nearby events
app.get("/api/events/nearby", (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius_km = parseFloat(req.query.radius_km as string) || DEFAULT_SEARCH_RADIUS_KM;
  const event_type = req.query.event_type as string | undefined;
  const limit = parseInt(req.query.limit as string, 10) || 50;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const result = handleGetNearbyEvents({
    lat,
    lng,
    radius_km,
    event_type: event_type as any,
    limit,
  });
  res.json(result);
});

// GET /api/events/map — Event map with heatmap
app.get("/api/events/map", (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius_km = parseFloat(req.query.radius_km as string) || undefined;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const result = handleGetMap({ lat, lng, radius_km });
  res.json(result);
});

// POST /api/events/join — Join event
app.post("/api/events/join", (req, res) => {
  const result = handleJoinEvent(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// POST /api/events/leave — Leave event
app.post("/api/events/leave", (req, res) => {
  const result = handleLeaveEvent(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// POST /api/events/report — Report event
app.post("/api/events/report", (req, res) => {
  const result = handleReportEvent(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// POST /api/events/roulette — Blind date roulette
app.post("/api/events/roulette", (req, res) => {
  const result = handleRoulette(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// POST /api/events/rate — Rate event
app.post("/api/events/rate", (req, res) => {
  const result = handleRateEvent(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// GET /api/events — List all active events
app.get("/api/events", (_req, res) => {
  const store = getStore();
  const active = store.events.filter(
    (e) => e.status === "active" || e.status === "approved"
  );
  res.json({ events: active });
});

// Fallback to index.html for SPA
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[amuse-events] server running on http://0.0.0.0:${PORT}`);
});

// amuse_events.map.ts — Live event map and heatmap system

import { AmuseEvent, MapEvent, HeatmapZone } from "./amuse_events.model";
import {
  HEATMAP_ZONE_RADIUS_KM,
  HEATMAP_MIN_EVENTS,
} from "./amuse_events.config";
import { calculateDistance } from "./amuse_events.matching";

export function toMapEvent(event: AmuseEvent): MapEvent {
  return {
    event_id: event.id,
    location_lat: event.location_lat,
    location_lng: event.location_lng,
    event_type: event.event_type,
    participant_count: event.participants.length,
    start_time: event.start_time,
    title: event.title,
  };
}

export function getMapEvents(
  events: AmuseEvent[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): MapEvent[] {
  return events
    .filter((e) => e.status === "active" || e.status === "approved")
    .filter((e) => {
      const dist = calculateDistance(
        centerLat,
        centerLng,
        e.location_lat,
        e.location_lng
      );
      return dist <= radiusKm;
    })
    .map(toMapEvent);
}

export function detectHeatmapZones(events: AmuseEvent[]): HeatmapZone[] {
  const activeEvents = events.filter(
    (e) => e.status === "active" || e.status === "approved"
  );

  if (activeEvents.length < HEATMAP_MIN_EVENTS) {
    return [];
  }

  const zones: HeatmapZone[] = [];
  const assigned = new Set<string>();

  for (const anchor of activeEvents) {
    if (assigned.has(anchor.id)) continue;

    const cluster = activeEvents.filter((e) => {
      const dist = calculateDistance(
        anchor.location_lat,
        anchor.location_lng,
        e.location_lat,
        e.location_lng
      );
      return dist <= HEATMAP_ZONE_RADIUS_KM;
    });

    if (cluster.length >= HEATMAP_MIN_EVENTS) {
      const centerLat =
        cluster.reduce((sum, e) => sum + e.location_lat, 0) / cluster.length;
      const centerLng =
        cluster.reduce((sum, e) => sum + e.location_lng, 0) / cluster.length;

      zones.push({
        center_lat: centerLat,
        center_lng: centerLng,
        radius_km: HEATMAP_ZONE_RADIUS_KM,
        event_count: cluster.length,
        label: guessZoneLabel(cluster),
      });

      for (const e of cluster) {
        assigned.add(e.id);
      }
    }
  }

  return zones.sort((a, b) => b.event_count - a.event_count);
}

function guessZoneLabel(events: AmuseEvent[]): string {
  if (events.length === 0) return "Active zone";

  // Use the most common location name in the cluster
  const nameCounts = new Map<string, number>();
  for (const e of events) {
    const name = e.location_name;
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  let bestName = "Active zone";
  let bestCount = 0;
  for (const [name, count] of nameCounts) {
    if (count > bestCount) {
      bestName = name;
      bestCount = count;
    }
  }
  return bestName;
}

export interface MapResponse {
  events: MapEvent[];
  heatmap_zones: HeatmapZone[];
}

export function buildMapResponse(
  events: AmuseEvent[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): MapResponse {
  const mapEvents = getMapEvents(events, centerLat, centerLng, radiusKm);
  const heatmapZones = detectHeatmapZones(events);
  return { events: mapEvents, heatmap_zones: heatmapZones };
}

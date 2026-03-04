// amuse_events.controller.ts — API endpoint handlers for Amuse Events

import {
  AmuseEvent,
  CreateEventInput,
  EventCard,
  EventFeedQuery,
  EventRating,
  EventReport,
  MapEvent,
  NearbyQuery,
  RouletteMatch,
  UserProfile,
} from "./amuse_events.model";
import {
  createEvent,
  joinEvent,
  leaveEvent,
  buildEventCard,
  findNearbyEvents,
  createRouletteMatch,
  triggerIcebreaker,
  createReport,
  detectSpam,
  sortEventFeed,
  markExpiredEvents,
} from "./amuse_events.service";
import { buildMapResponse, MapResponse } from "./amuse_events.map";
import { DEFAULT_SEARCH_RADIUS_KM } from "./amuse_events.config";

// In-memory store (replace with database in production)
let events: AmuseEvent[] = [];
let ratings: EventRating[] = [];
let reports: EventReport[] = [];

// --- Store Access (for testing and integration) ---

export function getStore() {
  return { events, ratings, reports };
}

export function resetStore() {
  events = [];
  ratings = [];
  reports = [];
}

// --- POST /events ---

export interface CreateEventRequest {
  input: CreateEventInput;
  creatorProfile: UserProfile;
}

export interface CreateEventResponse {
  success: boolean;
  event?: AmuseEvent;
  card?: EventCard;
  error?: string;
}

export function handleCreateEvent(
  req: CreateEventRequest
): CreateEventResponse {
  const spamCheck = detectSpam(req.input.creator_id, events);
  if (spamCheck.is_spam) {
    return { success: false, error: spamCheck.reason };
  }

  try {
    const event = createEvent(req.input, req.creatorProfile);
    events.push(event);
    const card = buildEventCard(event);
    return { success: true, event, card };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// --- GET /events/nearby ---

export interface NearbyEventsResponse {
  events: AmuseEvent[];
}

export function handleGetNearbyEvents(
  query: NearbyQuery
): NearbyEventsResponse {
  events = markExpiredEvents(events);
  const nearby = findNearbyEvents(events, query);
  return { events: nearby };
}

// --- GET /events/map ---

export interface MapRequest {
  lat: number;
  lng: number;
  radius_km?: number;
}

export function handleGetMap(req: MapRequest): MapResponse {
  events = markExpiredEvents(events);
  const radius = req.radius_km ?? DEFAULT_SEARCH_RADIUS_KM;
  return buildMapResponse(events, req.lat, req.lng, radius);
}

// --- POST /events/join ---

export interface JoinEventRequest {
  event_id: string;
  user_id: string;
}

export interface JoinEventResponse {
  success: boolean;
  event?: AmuseEvent;
  icebreaker?: ReturnType<typeof triggerIcebreaker>;
  error?: string;
}

export function handleJoinEvent(req: JoinEventRequest): JoinEventResponse {
  const idx = events.findIndex((e) => e.id === req.event_id);
  if (idx === -1) {
    return { success: false, error: "Event not found" };
  }

  try {
    const updated = joinEvent(events[idx], req.user_id);
    events[idx] = updated;

    // Trigger icebreaker if two participants joined
    let icebreaker = null;
    if (updated.participants.length === 2) {
      icebreaker = triggerIcebreaker(
        updated,
        updated.participants[0],
        updated.participants[1]
      );
    }

    return { success: true, event: updated, icebreaker };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// --- POST /events/leave ---

export interface LeaveEventRequest {
  event_id: string;
  user_id: string;
}

export interface LeaveEventResponse {
  success: boolean;
  event?: AmuseEvent;
  error?: string;
}

export function handleLeaveEvent(req: LeaveEventRequest): LeaveEventResponse {
  const idx = events.findIndex((e) => e.id === req.event_id);
  if (idx === -1) {
    return { success: false, error: "Event not found" };
  }

  try {
    const updated = leaveEvent(events[idx], req.user_id);
    events[idx] = updated;
    return { success: true, event: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// --- POST /events/report ---

export interface ReportEventRequest {
  event_id: string;
  reporter_id: string;
  reason: EventReport["reason"];
  description?: string;
}

export interface ReportEventResponse {
  success: boolean;
  report?: EventReport;
  error?: string;
}

export function handleReportEvent(
  req: ReportEventRequest
): ReportEventResponse {
  const event = events.find((e) => e.id === req.event_id);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  const report = createReport(
    req.event_id,
    req.reporter_id,
    req.reason,
    req.description
  );
  reports.push(report);
  return { success: true, report };
}

// --- POST /events/roulette ---

export interface RouletteRequest {
  user_id: string;
  user_profile: UserProfile;
  candidate_profiles: UserProfile[];
  location_lat: number;
  location_lng: number;
  location_name: string;
}

export interface RouletteResponse {
  success: boolean;
  match?: RouletteMatch;
  event?: AmuseEvent;
  error?: string;
}

export function handleRoulette(req: RouletteRequest): RouletteResponse {
  if (req.candidate_profiles.length === 0) {
    return { success: false, error: "No compatible users available" };
  }

  // Pick a random compatible candidate
  const candidate =
    req.candidate_profiles[
      Math.floor(Math.random() * req.candidate_profiles.length)
    ];

  const { match, event } = createRouletteMatch(
    req.user_id,
    candidate.id,
    req.location_lat,
    req.location_lng,
    req.location_name
  );

  events.push(event);
  return { success: true, match, event };
}

// --- GET /events/feed ---

export interface FeedResponse {
  events: AmuseEvent[];
  cards: EventCard[];
}

export function handleGetFeed(
  query: EventFeedQuery,
  userProfile: UserProfile,
  creatorProfiles: Map<string, UserProfile>
): FeedResponse {
  events = markExpiredEvents(events);
  const radius = DEFAULT_SEARCH_RADIUS_KM;
  const sorted = sortEventFeed(events, userProfile, creatorProfiles, radius);
  const page = sorted.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
  const cards = page.map(buildEventCard);
  return { events: page, cards };
}

// --- Rate Event ---

export interface RateEventRequest {
  event_id: string;
  user_id: string;
  atmosphere: number;
  authenticity: number;
  social_vibe: number;
}

export interface RateEventResponse {
  success: boolean;
  rating?: EventRating;
  error?: string;
}

export function handleRateEvent(req: RateEventRequest): RateEventResponse {
  const event = events.find((e) => e.id === req.event_id);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  if (!event.participants.includes(req.user_id)) {
    return { success: false, error: "Only participants can rate events" };
  }

  const rating: EventRating = {
    event_id: req.event_id,
    user_id: req.user_id,
    atmosphere: Math.max(1, Math.min(5, req.atmosphere)),
    authenticity: Math.max(1, Math.min(5, req.authenticity)),
    social_vibe: Math.max(1, Math.min(5, req.social_vibe)),
    created_at: Date.now(),
  };

  ratings.push(rating);
  return { success: true, rating };
}

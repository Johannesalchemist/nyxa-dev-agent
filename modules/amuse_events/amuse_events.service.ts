// amuse_events.service.ts — Core business logic for Amuse Events

import {
  AmuseEvent,
  CreateEventInput,
  EventCard,
  EventRating,
  EventReport,
  EventStatus,
  HostReputation,
  NearbyQuery,
  RouletteMatch,
  UserProfile,
} from "./amuse_events.model";
import {
  MODERATION_DELAY_MS,
  PREMIUM_RULES,
  MYSTERY_DATE_REVEAL_MINUTES,
  SPAM_DETECTION,
  TRUSTED_HOST_THRESHOLD,
  FEED_SORT_WEIGHTS,
} from "./amuse_events.config";
import {
  calculateDistance,
  calculateMatchScore,
  filterMatchingEvents,
  pickIcebreaker,
} from "./amuse_events.matching";

function generateId(): string {
  // Simple UUID v4 generator without external dependencies
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      id += "-";
    } else if (i === 14) {
      id += "4";
    } else if (i === 19) {
      id += hex[(Math.random() * 4) | 8];
    } else {
      id += hex[(Math.random() * 16) | 0];
    }
  }
  return id;
}

// --- Event Creation ---

export function createEvent(
  input: CreateEventInput,
  creatorProfile: UserProfile
): AmuseEvent {
  const isPremium = creatorProfile.is_premium;
  const rules = isPremium ? PREMIUM_RULES.premium : PREMIUM_RULES.standard;

  if (input.image_url && !rules.image_allowed) {
    throw new Error("Image not allowed for standard users");
  }
  if (input.recurring && !rules.recurring_allowed) {
    throw new Error("Recurring events not allowed for standard users");
  }

  const status: EventStatus = rules.moderation_delay ? "pending" : "approved";

  return {
    id: generateId(),
    creator_id: input.creator_id,
    title: input.title,
    description: input.description,
    location_lat: input.location_lat,
    location_lng: input.location_lng,
    location_name: input.location_name,
    start_time: input.start_time,
    end_time: input.end_time,
    max_participants: input.max_participants,
    event_type: input.event_type,
    visibility: input.visibility,
    premium_creator: isPremium,
    status,
    participants: [input.creator_id],
    created_at: Date.now(),
    image_url: rules.image_allowed ? input.image_url : undefined,
    recurring: rules.recurring_allowed ? input.recurring : undefined,
    room_id: input.room_id,
  };
}

// --- Event Joining ---

export function joinEvent(
  event: AmuseEvent,
  userId: string
): AmuseEvent {
  if (event.participants.includes(userId)) {
    throw new Error("Already joined");
  }
  if (
    event.max_participants &&
    event.participants.length >= event.max_participants
  ) {
    throw new Error("Event is full");
  }
  if (event.status !== "active" && event.status !== "approved") {
    throw new Error("Event is not available");
  }

  return {
    ...event,
    participants: [...event.participants, userId],
  };
}

export function leaveEvent(
  event: AmuseEvent,
  userId: string
): AmuseEvent {
  if (!event.participants.includes(userId)) {
    throw new Error("Not a participant");
  }
  if (event.creator_id === userId) {
    throw new Error("Creator cannot leave their own event");
  }

  return {
    ...event,
    participants: event.participants.filter((id) => id !== userId),
  };
}

// --- Event Card ---

export function buildEventCard(event: AmuseEvent): EventCard {
  const rules = event.premium_creator
    ? PREMIUM_RULES.premium
    : PREMIUM_RULES.standard;

  return {
    event,
    card_size: rules.card_size,
    card_color: rules.card_color,
    show_image: rules.image_allowed && !!event.image_url,
  };
}

// --- Mystery Date ---

export function shouldRevealMysteryLocation(event: AmuseEvent): boolean {
  if (event.event_type !== "mystery") return true;
  const revealTime =
    event.start_time - MYSTERY_DATE_REVEAL_MINUTES * 60 * 1000;
  return Date.now() >= revealTime;
}

export function getMysteryEventInfo(event: AmuseEvent): Partial<AmuseEvent> {
  if (shouldRevealMysteryLocation(event)) {
    return event;
  }
  // Hide exact location until reveal time
  return {
    ...event,
    location_lat: 0,
    location_lng: 0,
    location_name: "Location revealed 30 min before start",
  };
}

// --- Nearby Events ---

export function findNearbyEvents(
  events: AmuseEvent[],
  query: NearbyQuery
): AmuseEvent[] {
  return events
    .filter((e) => e.status === "active" || e.status === "approved")
    .filter((e) => {
      const dist = calculateDistance(
        query.lat,
        query.lng,
        e.location_lat,
        e.location_lng
      );
      return dist <= query.radius_km;
    })
    .filter((e) => (query.event_type ? e.event_type === query.event_type : true))
    .slice(0, query.limit ?? 50);
}

// --- Blind Date Roulette ---

export function createRouletteMatch(
  userA: string,
  userB: string,
  locationLat: number,
  locationLng: number,
  locationName: string
): { match: RouletteMatch; event: AmuseEvent } {
  const eventId = generateId();
  const now = Date.now();
  const startTime = now + 60 * 60 * 1000; // 1 hour from now

  const match: RouletteMatch = {
    user_a: userA,
    user_b: userB,
    event_id: eventId,
    location_revealed_at: startTime - MYSTERY_DATE_REVEAL_MINUTES * 60 * 1000,
  };

  const event: AmuseEvent = {
    id: eventId,
    creator_id: userA,
    title: "Blind Date Roulette",
    description: "A surprise match — enjoy the adventure!",
    location_lat: locationLat,
    location_lng: locationLng,
    location_name: locationName,
    start_time: startTime,
    event_type: "mystery",
    visibility: "dating_match",
    premium_creator: false,
    status: "approved",
    participants: [userA, userB],
    created_at: now,
    max_participants: 2,
  };

  return { match, event };
}

// --- Icebreaker ---

export function triggerIcebreaker(
  event: AmuseEvent,
  userA: string,
  userB: string
): { user_a: string; user_b: string; prompt: ReturnType<typeof pickIcebreaker> } | null {
  if (!event.participants.includes(userA) || !event.participants.includes(userB)) {
    return null;
  }
  return {
    user_a: userA,
    user_b: userB,
    prompt: pickIcebreaker(),
  };
}

// --- Event Reputation ---

export function calculateHostReputation(
  hostId: string,
  ratings: EventRating[]
): HostReputation {
  const hostRatings = ratings.filter((r) => r.event_id); // all ratings for events by this host
  if (hostRatings.length === 0) {
    return {
      user_id: hostId,
      total_events: 0,
      average_atmosphere: 0,
      average_authenticity: 0,
      average_social_vibe: 0,
      trusted_host: false,
    };
  }

  const avgAtmosphere =
    hostRatings.reduce((s, r) => s + r.atmosphere, 0) / hostRatings.length;
  const avgAuthenticity =
    hostRatings.reduce((s, r) => s + r.authenticity, 0) / hostRatings.length;
  const avgVibe =
    hostRatings.reduce((s, r) => s + r.social_vibe, 0) / hostRatings.length;

  const overallAvg = (avgAtmosphere + avgAuthenticity + avgVibe) / 3;
  const totalEvents = new Set(hostRatings.map((r) => r.event_id)).size;

  const trusted =
    totalEvents >= TRUSTED_HOST_THRESHOLD.min_events &&
    overallAvg >= TRUSTED_HOST_THRESHOLD.min_average_rating;

  return {
    user_id: hostId,
    total_events: totalEvents,
    average_atmosphere: Math.round(avgAtmosphere * 100) / 100,
    average_authenticity: Math.round(avgAuthenticity * 100) / 100,
    average_social_vibe: Math.round(avgVibe * 100) / 100,
    trusted_host: trusted,
  };
}

// --- Spam Detection ---

export function detectSpam(
  creatorId: string,
  existingEvents: AmuseEvent[]
): { is_spam: boolean; reason?: string } {
  const now = Date.now();
  const creatorEvents = existingEvents.filter(
    (e) => e.creator_id === creatorId
  );

  const lastHour = creatorEvents.filter(
    (e) => now - e.created_at < 60 * 60 * 1000
  );
  if (lastHour.length >= SPAM_DETECTION.max_events_per_hour) {
    return { is_spam: true, reason: "Too many events created in the last hour" };
  }

  const lastDay = creatorEvents.filter(
    (e) => now - e.created_at < 24 * 60 * 60 * 1000
  );
  if (lastDay.length >= SPAM_DETECTION.max_events_per_day) {
    return { is_spam: true, reason: "Too many events created in the last 24 hours" };
  }

  // Check for clustered fake locations
  if (lastHour.length >= 2) {
    for (let i = 0; i < lastHour.length - 1; i++) {
      const dist = calculateDistance(
        lastHour[i].location_lat,
        lastHour[i].location_lng,
        lastHour[i + 1].location_lat,
        lastHour[i + 1].location_lng
      );
      if (dist < SPAM_DETECTION.min_distance_between_events_km) {
        return { is_spam: true, reason: "Suspicious duplicate locations" };
      }
    }
  }

  return { is_spam: false };
}

// --- Event Report ---

export function createReport(
  eventId: string,
  reporterId: string,
  reason: EventReport["reason"],
  description?: string
): EventReport {
  return {
    event_id: eventId,
    reporter_id: reporterId,
    reason,
    description,
    created_at: Date.now(),
  };
}

// --- Feed Sorting ---

export function sortEventFeed(
  events: AmuseEvent[],
  user: UserProfile,
  creatorProfiles: Map<string, UserProfile>,
  maxRadiusKm: number
): AmuseEvent[] {
  return events
    .filter((e) => e.status === "active" || e.status === "approved")
    .map((event) => {
      const creator = creatorProfiles.get(event.creator_id);
      const matchScore = creator
        ? calculateMatchScore(user, event, creator, maxRadiusKm)
        : 0;

      const dist = calculateDistance(
        user.location_lat,
        user.location_lng,
        event.location_lat,
        event.location_lng
      );
      const distScore = dist <= maxRadiusKm ? 1 - dist / maxRadiusKm : 0;

      const activityScore = event.participants.length / (event.max_participants ?? 100);
      const premiumBoost = event.premium_creator ? 1 : 0;

      const feedScore =
        FEED_SORT_WEIGHTS.dating_relevance * matchScore +
        FEED_SORT_WEIGHTS.distance * distScore +
        FEED_SORT_WEIGHTS.activity * activityScore +
        FEED_SORT_WEIGHTS.premium_boost * premiumBoost;

      return { event, feedScore };
    })
    .sort((a, b) => b.feedScore - a.feedScore)
    .map((entry) => entry.event);
}

// --- Event Expiry ---

export function markExpiredEvents(events: AmuseEvent[]): AmuseEvent[] {
  const now = Date.now();
  return events.map((e) => {
    if (
      (e.status === "active" || e.status === "approved") &&
      e.end_time &&
      e.end_time < now
    ) {
      return { ...e, status: "expired" as const };
    }
    if (
      (e.status === "active" || e.status === "approved") &&
      !e.end_time &&
      e.start_time < now - 3 * 60 * 60 * 1000 // default 3h after start
    ) {
      return { ...e, status: "expired" as const };
    }
    return e;
  });
}

// --- Moderation Approval ---

export function approveEvent(event: AmuseEvent): AmuseEvent {
  if (event.status !== "pending") {
    throw new Error("Only pending events can be approved");
  }
  return { ...event, status: "approved" };
}

export function activateEvent(event: AmuseEvent): AmuseEvent {
  if (event.status !== "approved") {
    throw new Error("Only approved events can be activated");
  }
  return { ...event, status: "active" };
}

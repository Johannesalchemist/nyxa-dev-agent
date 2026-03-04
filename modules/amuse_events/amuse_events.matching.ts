// amuse_events.matching.ts — Matching engine for event suggestions

import {
  AmuseEvent,
  UserProfile,
  IcebreakerPrompt,
} from "./amuse_events.model";
import {
  MATCHING_WEIGHTS,
  MATCHING_SCORE_THRESHOLD,
  ICEBREAKER_PROMPTS,
  GROUP_CHEMISTRY_SIZE,
} from "./amuse_events.config";

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateInterestOverlap(
  userInterests: string[],
  eventCreatorInterests: string[]
): number {
  if (userInterests.length === 0 || eventCreatorInterests.length === 0) {
    return 0;
  }
  const overlap = userInterests.filter((i) =>
    eventCreatorInterests.includes(i)
  ).length;
  const total = new Set([...userInterests, ...eventCreatorInterests]).size;
  return total > 0 ? overlap / total : 0;
}

export function calculateRoomAffinity(
  userRoomIds: string[],
  eventRoomId?: string
): number {
  if (!eventRoomId) return 0.5; // neutral for events without rooms
  return userRoomIds.includes(eventRoomId) ? 1.0 : 0.0;
}

export function normalizeDistance(
  distanceKm: number,
  maxRadiusKm: number
): number {
  if (distanceKm >= maxRadiusKm) return 0;
  return 1 - distanceKm / maxRadiusKm;
}

export function calculateMatchScore(
  user: UserProfile,
  event: AmuseEvent,
  creatorProfile: UserProfile,
  maxRadiusKm: number
): number {
  const distanceKm = calculateDistance(
    user.location_lat,
    user.location_lng,
    event.location_lat,
    event.location_lng
  );

  const distanceScore = normalizeDistance(distanceKm, maxRadiusKm);
  const interestScore = calculateInterestOverlap(
    user.interests,
    creatorProfile.interests
  );
  const activityScore = Math.min(user.activity_level / 10, 1.0);
  const roomScore = calculateRoomAffinity(user.room_ids, event.room_id);

  const score =
    MATCHING_WEIGHTS.distance * distanceScore +
    MATCHING_WEIGHTS.interest_overlap * interestScore +
    MATCHING_WEIGHTS.activity_level * activityScore +
    MATCHING_WEIGHTS.room_affinity * roomScore;

  return Math.round(score * 1000) / 1000;
}

export function filterMatchingEvents(
  user: UserProfile,
  events: AmuseEvent[],
  creatorProfiles: Map<string, UserProfile>,
  maxRadiusKm: number
): Array<{ event: AmuseEvent; score: number }> {
  const scored = events
    .filter((e) => e.status === "active" || e.status === "approved")
    .filter((e) => e.creator_id !== user.id)
    .filter(
      (e) =>
        !e.max_participants ||
        e.participants.length < e.max_participants
    )
    .map((event) => {
      const creatorProfile = creatorProfiles.get(event.creator_id);
      if (!creatorProfile) return { event, score: 0 };
      return {
        event,
        score: calculateMatchScore(user, event, creatorProfile, maxRadiusKm),
      };
    })
    .filter((entry) => entry.score >= MATCHING_SCORE_THRESHOLD);

  return scored.sort((a, b) => b.score - a.score);
}

export function selectGroupChemistryParticipants(
  candidates: Array<{ user: UserProfile; gender: "male" | "female" }>,
  targetEvent: AmuseEvent
): string[] {
  const men = candidates
    .filter((c) => c.gender === "male")
    .sort(
      (a, b) =>
        calculateDistance(
          b.user.location_lat,
          b.user.location_lng,
          targetEvent.location_lat,
          targetEvent.location_lng
        ) -
        calculateDistance(
          a.user.location_lat,
          a.user.location_lng,
          targetEvent.location_lat,
          targetEvent.location_lng
        )
    )
    .slice(0, GROUP_CHEMISTRY_SIZE.men);

  const women = candidates
    .filter((c) => c.gender === "female")
    .sort(
      (a, b) =>
        calculateDistance(
          b.user.location_lat,
          b.user.location_lng,
          targetEvent.location_lat,
          targetEvent.location_lng
        ) -
        calculateDistance(
          a.user.location_lat,
          a.user.location_lng,
          targetEvent.location_lat,
          targetEvent.location_lng
        )
    )
    .slice(0, GROUP_CHEMISTRY_SIZE.women);

  return [...men.map((m) => m.user.id), ...women.map((w) => w.user.id)];
}

export function pickIcebreaker(): IcebreakerPrompt {
  const types = Object.keys(ICEBREAKER_PROMPTS) as Array<
    keyof typeof ICEBREAKER_PROMPTS
  >;
  const type = types[Math.floor(Math.random() * types.length)];
  const prompts = ICEBREAKER_PROMPTS[type];
  const text = prompts[Math.floor(Math.random() * prompts.length)];
  return { type, text };
}

// amuse_events.model.ts — Data models for the Amuse Events module

export type EventType =
  | "date"
  | "group"
  | "adventure"
  | "mystery"
  | "speeddate"
  | "coffee"
  | "walk"
  | "instant_date";

export type EventVisibility =
  | "public"
  | "dating_match"
  | "room_only";

export type EventStatus =
  | "pending"
  | "approved"
  | "active"
  | "expired";

export interface AmuseEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_name: string;
  start_time: number;
  end_time?: number;
  max_participants?: number;
  event_type: EventType;
  visibility: EventVisibility;
  premium_creator: boolean;
  status: EventStatus;
  participants: string[];
  created_at: number;
  image_url?: string;
  recurring?: boolean;
  room_id?: string;
}

export interface EventRating {
  event_id: string;
  user_id: string;
  atmosphere: number;
  authenticity: number;
  social_vibe: number;
  created_at: number;
}

export interface HostReputation {
  user_id: string;
  total_events: number;
  average_atmosphere: number;
  average_authenticity: number;
  average_social_vibe: number;
  trusted_host: boolean;
}

export interface EventCard {
  event: AmuseEvent;
  card_size: "small" | "large";
  card_color: "grey" | "highlight";
  show_image: boolean;
}

export interface MapEvent {
  event_id: string;
  location_lat: number;
  location_lng: number;
  event_type: EventType;
  participant_count: number;
  start_time: number;
  title: string;
}

export interface HeatmapZone {
  center_lat: number;
  center_lng: number;
  radius_km: number;
  event_count: number;
  label: string;
}

export interface RouletteMatch {
  user_a: string;
  user_b: string;
  event_id: string;
  location_revealed_at: number;
}

export interface IcebreakerPrompt {
  type: "two_truths_one_lie" | "would_you_rather" | "compatibility_quiz";
  text: string;
}

export interface EventReport {
  event_id: string;
  reporter_id: string;
  reason: "spam" | "fake_location" | "mass_invitation" | "inappropriate" | "other";
  description?: string;
  created_at: number;
}

export interface UserProfile {
  id: string;
  interests: string[];
  location_lat: number;
  location_lng: number;
  activity_level: number;
  room_ids: string[];
  is_online: boolean;
  is_premium: boolean;
}

export interface CreateEventInput {
  creator_id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_name: string;
  start_time: number;
  end_time?: number;
  max_participants?: number;
  event_type: EventType;
  visibility: EventVisibility;
  image_url?: string;
  recurring?: boolean;
  room_id?: string;
}

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius_km: number;
  event_type?: EventType;
  limit?: number;
}

export interface EventFeedQuery {
  user_id: string;
  lat: number;
  lng: number;
  limit?: number;
  offset?: number;
}

export interface DatabaseSchema {
  table: "amuse_events";
  columns: [
    "id",
    "creator_id",
    "title",
    "description",
    "location_lat",
    "location_lng",
    "location_name",
    "start_time",
    "end_time",
    "event_type",
    "visibility",
    "premium_creator",
    "status",
    "participants",
    "created_at",
  ];
  indexes: ["location", "start_time", "status"];
}

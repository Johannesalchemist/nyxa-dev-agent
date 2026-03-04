// amuse_events.telegram.ts — Telegram bot integration for Amuse Events

import { AmuseEvent, CreateEventInput, EventType } from "./amuse_events.model";
import { SPONTAN_OPTIONS, INSTANT_DATE_RADIUS_KM } from "./amuse_events.config";

export interface TelegramCommand {
  command: string;
  description: string;
  handler: string;
}

export const BOT_COMMANDS: TelegramCommand[] = [
  { command: "/events", description: "Show upcoming events", handler: "handleEventsCommand" },
  { command: "/create_event", description: "Create a new event", handler: "handleCreateEventCommand" },
  { command: "/join_event", description: "Join an event by ID", handler: "handleJoinEventCommand" },
  { command: "/nearby_events", description: "Find events near you", handler: "handleNearbyEventsCommand" },
  { command: "/spontan", description: "Create a spontaneous meetup", handler: "handleSpontanCommand" },
];

export interface SpontanSession {
  user_id: string;
  step: "awaiting_choice" | "creating";
  location_lat?: number;
  location_lng?: number;
}

export function buildSpontanPrompt(): string {
  const lines = [
    "What do you want to do?",
    "",
    ...Object.entries(SPONTAN_OPTIONS).map(
      ([key, opt]) => `${key} ${opt.label}`
    ),
  ];
  return lines.join("\n");
}

export function parseSpontanChoice(
  input: string
): { label: string; event_type: EventType } | null {
  const trimmed = input.trim();
  const option = SPONTAN_OPTIONS[trimmed as keyof typeof SPONTAN_OPTIONS];
  return option ?? null;
}

export function buildSpontanEventInput(
  userId: string,
  choice: { label: string; event_type: EventType },
  lat: number,
  lng: number
): CreateEventInput {
  const now = Date.now();
  return {
    creator_id: userId,
    title: `${choice.label} in 20 minutes`,
    description: `Spontaneous ${choice.label.toLowerCase()} meetup!`,
    location_lat: lat,
    location_lng: lng,
    location_name: "Near you",
    start_time: now + 20 * 60 * 1000,
    event_type: choice.event_type === "date" ? "instant_date" : choice.event_type,
    visibility: "public",
    max_participants: 2,
  };
}

export function formatEventForTelegram(event: AmuseEvent): string {
  const date = new Date(event.start_time);
  const timeStr = date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const spots = event.max_participants
    ? ` [${event.participants.length}/${event.max_participants}]`
    : ` [${event.participants.length}]`;

  return `${event.title}\n📍 ${event.location_name}\n🕐 ${timeStr}${spots}\nID: ${event.id}`;
}

export function formatEventList(events: AmuseEvent[]): string {
  if (events.length === 0) {
    return "No events found.";
  }
  return events.map(formatEventForTelegram).join("\n\n");
}

export function formatNearbyEvents(
  events: AmuseEvent[],
  userLat: number,
  userLng: number
): string {
  if (events.length === 0) {
    return "No events nearby.";
  }

  return events
    .map((e) => {
      return formatEventForTelegram(e);
    })
    .join("\n\n");
}

export function buildJoinConfirmation(event: AmuseEvent, userId: string): string {
  if (event.participants.includes(userId)) {
    return `You are already part of "${event.title}".`;
  }
  if (
    event.max_participants &&
    event.participants.length >= event.max_participants
  ) {
    return `"${event.title}" is full.`;
  }
  return `You joined "${event.title}"! See you there.`;
}

export function buildEventCreatedMessage(event: AmuseEvent): string {
  const status = event.status === "pending"
    ? "Your event is pending moderation (up to 24h)."
    : "Your event is live!";
  return `Event created: "${event.title}"\n${status}`;
}

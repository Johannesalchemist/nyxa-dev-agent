// amuse_events.rooms.ts — Room integration for event creation and display

import { AmuseEvent } from "./amuse_events.model";

export interface RoomEventSection {
  label: string;
  emoji: string;
  events: AmuseEvent[];
}

export function categorizeEventsByTime(
  events: AmuseEvent[],
  nowMs: number
): RoomEventSection[] {
  const todayStart = new Date(nowMs);
  todayStart.setHours(0, 0, 0, 0);

  const tonightStart = new Date(nowMs);
  tonightStart.setHours(18, 0, 0, 0);

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayEvents = events.filter(
    (e) =>
      e.start_time >= todayStart.getTime() &&
      e.start_time < tonightStart.getTime()
  );

  const tonightEvents = events.filter(
    (e) =>
      e.start_time >= tonightStart.getTime() &&
      e.start_time < todayEnd.getTime()
  );

  const thisWeekEvents = events.filter(
    (e) =>
      e.start_time >= todayEnd.getTime() && e.start_time < weekEnd.getTime()
  );

  return [
    { label: "Today", emoji: "🔥", events: todayEvents },
    { label: "Tonight", emoji: "🌙", events: tonightEvents },
    { label: "This Week", emoji: "📅", events: thisWeekEvents },
  ];
}

export function filterEventsByRoom(
  events: AmuseEvent[],
  roomId: string
): AmuseEvent[] {
  return events.filter(
    (e) => e.room_id === roomId || e.visibility === "public"
  );
}

export function formatRoomEventsCommand(
  roomId: string,
  events: AmuseEvent[],
  nowMs: number
): string {
  const roomEvents = filterEventsByRoom(events, roomId);
  const sections = categorizeEventsByTime(roomEvents, nowMs);

  const lines: string[] = [`Events in room:`];

  for (const section of sections) {
    if (section.events.length === 0) continue;
    lines.push("");
    lines.push(`${section.emoji} ${section.label}`);
    for (const event of section.events) {
      const time = new Date(event.start_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const count = event.participants.length;
      const max = event.max_participants
        ? `/${event.max_participants}`
        : "";
      lines.push(`  ${time} — ${event.title} [${count}${max}]`);
    }
  }

  if (lines.length === 1) {
    lines.push("No upcoming events.");
  }

  return lines.join("\n");
}

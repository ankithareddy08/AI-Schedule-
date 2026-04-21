import { promises as fs } from "node:fs"
import path from "node:path"

import type { CalendarEvent, TimeSlotRecord, UserProfile } from "@/lib/types"


const DATASET_DIR = path.resolve(process.cwd(), "..", "dataset")

let cache:
  | {
      users: UserProfile[]
      events: CalendarEvent[]
      slots: TimeSlotRecord[]
    }
  | undefined

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split(/\r?\n/)
  const headers = lines[0].split(",")

  return lines.slice(1).map((line) => {
    const values = line.split(",")
    return headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? ""
      return accumulator
    }, {})
  })
}

function displayName(userId: number): string {
  return `User ${userId}`
}

export async function loadDataset() {
  if (cache) {
    return cache
  }

  const [eventsRaw, slotsRaw, profilesRaw] = await Promise.all([
    fs.readFile(path.join(DATASET_DIR, "calendar_events.csv"), "utf-8"),
    fs.readFile(path.join(DATASET_DIR, "time_slots.csv"), "utf-8"),
    fs.readFile(path.join(DATASET_DIR, "user_profiles.json"), "utf-8"),
  ])

  const events = parseCsv(eventsRaw).map<CalendarEvent>((row) => ({
    eventId: Number(row.event_id),
    userId: Number(row.user_id),
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    meetingType: row.meeting_type,
    isConflict: row.is_conflict === "1",
    durationMinutes: Number(row.duration_minutes),
  }))

  const slots = parseCsv(slotsRaw).map<TimeSlotRecord>((row) => ({
    slotId: Number(row.slot_id),
    userId: Number(row.user_id),
    date: row.date,
    startTime: row.start_time,
    hour: Number(row.hour),
    dayOfWeek: Number(row.day_of_week),
    focusScore: Number(row.focus_score),
    isBusy: row.is_busy === "1",
    isConflict: row.is_conflict === "1",
    meetingCountThatDay: Number(row.meeting_count_that_day),
    label: Number(row.label),
  }))

  const users = JSON.parse(profilesRaw).map((row: Record<string, unknown>) => {
    const userId = Number(row.user_id)
    return {
      userId,
      name: displayName(userId),
      email: `user${userId}@aurasync.dev`,
      preferredTime: row.preferred_time as UserProfile["preferredTime"],
      avgMeetingsPerDay: Number(row.avg_meetings_per_day),
      preferredDuration: Number(row.preferred_duration),
      doNotDisturbStart: (row.do_not_disturb_start as string | null) ?? null,
      doNotDisturbEnd: (row.do_not_disturb_end as string | null) ?? null,
      preferredMeetingTypes: (row.preferred_meeting_types as string[]) ?? [],
    } satisfies UserProfile
  })

  cache = { users, events, slots }
  return cache
}

export async function getUsers() {
  const data = await loadDataset()
  return data.users
}

export async function getUser(userId: number) {
  const users = await getUsers()
  return users.find((user) => user.userId === userId) ?? null
}

export async function getUserEvents(userId: number) {
  const data = await loadDataset()
  return data.events.filter((event) => event.userId === userId)
}

export async function getUserSlots(userId: number) {
  const data = await loadDataset()
  return data.slots.filter((slot) => slot.userId === userId)
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number) {
  const safeMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function addMinutes(time: string, delta: number) {
  return minutesToTime(timeToMinutes(time) + delta)
}

export function getDateWindow(datePreference: string, specificDate: string | null) {
  const anchor = new Date("2025-01-06T00:00:00Z")
  const toDateString = (date: Date) => date.toISOString().slice(0, 10)

  if (datePreference === "specific_date" && specificDate) {
    return { start: specificDate, end: specificDate }
  }

  if (datePreference === "tomorrow") {
    const tomorrow = new Date(anchor)
    tomorrow.setUTCDate(anchor.getUTCDate() + 1)
    const value = toDateString(tomorrow)
    return { start: value, end: value }
  }

  if (datePreference === "next_week") {
    const start = new Date(anchor)
    start.setUTCDate(anchor.getUTCDate() + 7)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6)
    return { start: toDateString(start), end: toDateString(end) }
  }

  if (datePreference === "today") {
    const value = toDateString(anchor)
    return { start: value, end: value }
  }

  const start = toDateString(anchor)
  const end = new Date(anchor)
  end.setUTCDate(anchor.getUTCDate() + 6)
  return { start, end: toDateString(end) }
}

export function isWithinDateRange(date: string, start: string, end: string) {
  return date >= start && date <= end
}

export function eventsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd)
}

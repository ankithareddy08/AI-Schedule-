import type { CalendarEvent, RecommendationOption, ScheduleResponse, SchedulingIntent, TimeSlotRecord, UserProfile, ConflictMoveOption } from "@/lib/types"
import { addMinutes, eventsOverlap, getDateWindow, getUser, getUserEvents, getUserSlots, isWithinDateRange } from "@/lib/server/data"
import { getModelMetrics, scoreSlot } from "@/lib/server/runtime-model"


const URGENCY_LEVEL: Record<SchedulingIntent["urgency"], number> = {
  low: 0,
  medium: 1,
  high: 2,
}

const EVENT_PRIORITY: Record<string, number> = {
  client_call: 0.95,
  interview: 0.9,
  "1:1": 0.75,
  team_sync: 0.65,
  brainstorm: 0.55,
  focus_block: 0.4,
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function buildSlotIndex(slots: TimeSlotRecord[]) {
  const index = new Map<string, TimeSlotRecord>()
  for (const slot of slots) {
    index.set(`${slot.userId}|${slot.date}|${slot.startTime}`, slot)
  }
  return index
}

function buildRunwayIndex(slots: TimeSlotRecord[]) {
  const ordered = [...slots].sort((a, b) => {
    const left = `${a.userId}|${a.date}|${a.startTime}`
    const right = `${b.userId}|${b.date}|${b.startTime}`
    return left.localeCompare(right)
  })

  const runways = new Map<string, number>()
  const grouped = new Map<string, TimeSlotRecord[]>()
  for (const slot of ordered) {
    const key = `${slot.userId}|${slot.date}`
    grouped.set(key, [...(grouped.get(key) ?? []), slot])
  }

  for (const [key, group] of grouped) {
    let streak = 0
    for (let index = group.length - 1; index >= 0; index -= 1) {
      const slot = group[index]
      streak = !slot.isBusy && !slot.isConflict ? streak + 1 : 0
      runways.set(`${key}|${slot.startTime}`, streak)
    }
  }

  return runways
}

function buildExplanation(input: {
  slot: TimeSlotRecord
  user: UserProfile
  participantAvailability: number
  focusAverage: number
  requestDuration: number
  score: number
  timePreference: SchedulingIntent["timePreference"]
}) {
  const explanation: string[] = []
  const supportingSignals: string[] = []

  if (input.focusAverage >= 0.8) {
    explanation.push("High focus window across the selected participants.")
    supportingSignals.push(`Avg focus ${Math.round(input.focusAverage * 100)}%`)
  }

  if (input.slot.meetingCountThatDay <= input.user.avgMeetingsPerDay) {
    explanation.push("Keeps the meeting on a lighter calendar day.")
    supportingSignals.push(`Daily load ${input.slot.meetingCountThatDay.toFixed(1)} meetings`)
  }

  if (input.user.preferredDuration === input.requestDuration) {
    explanation.push("Matches the user's historical meeting duration preference.")
  }

  if (input.timePreference === "morning" && input.slot.hour < 12) {
    explanation.push("Honors the morning preference from the request.")
  }

  if (input.timePreference === "afternoon" && input.slot.hour >= 12) {
    explanation.push("Keeps the meeting in the requested afternoon window.")
  }

  if (input.timePreference === "avoid_low_focus" && input.slot.focusScore >= 0.7) {
    explanation.push("Avoids lower-focus hours called out in the prompt.")
  }

  if (input.participantAvailability === 1) {
    supportingSignals.push("All participants free")
  } else {
    supportingSignals.push(`${Math.round(input.participantAvailability * 100)}% participant availability`)
  }

  if (explanation.length === 0) {
    explanation.push("Best overall tradeoff between availability, focus score, and meeting load.")
  }

  supportingSignals.push(`ML score ${Math.round(input.score * 100)} / 100`)
  return { explanation, supportingSignals }
}

function scoreLabel(score: number) {
  if (score >= 0.85) return "Excellent fit"
  if (score >= 0.7) return "Strong fit"
  if (score >= 0.55) return "Viable option"
  return "Fallback option"
}

function respectsTimePreference(slot: TimeSlotRecord, intent: SchedulingIntent) {
  if (intent.timePreference === "morning" && slot.hour >= 12) {
    return false
  }
  if (intent.timePreference === "afternoon" && slot.hour < 12) {
    return false
  }
  if (intent.timePreference === "avoid_low_focus" && slot.focusScore < 0.65) {
    return false
  }
  if (intent.hardConstraints.includes("Before noon") && slot.hour >= 12) {
    return false
  }
  if (intent.hardConstraints.includes("After lunch") && slot.hour < 13) {
    return false
  }
  return true
}

async function buildRecommendations(user: UserProfile, intent: SchedulingIntent): Promise<RecommendationOption[]> {
  const allParticipantIds = Array.from(new Set(intent.participants))
  const participantUsers = (await Promise.all(allParticipantIds.map((id) => getUser(id)))).filter(Boolean) as UserProfile[]
  const participantSlotsList = await Promise.all(allParticipantIds.map((id) => getUserSlots(id)))
  const allSlots = participantSlotsList.flat()
  const slotIndex = buildSlotIndex(allSlots)
  const runwayIndex = buildRunwayIndex(allSlots)
  const activeUserSlots = participantSlotsList[0] ?? []
  const durationBlocks = Math.max(Math.ceil(intent.durationMinutes / 30), 1)
  const window = getDateWindow(intent.datePreference, intent.specificDate)
  const urgencyLevel = URGENCY_LEVEL[intent.urgency]
  const recommendationsMap = new Map<string, RecommendationOption>()
  const processedSlots = new Set<string>()

  for (const slot of activeUserSlots) {
    if (!isWithinDateRange(slot.date, window.start, window.end)) {
      continue
    }
    if (!respectsTimePreference(slot, intent)) {
      continue
    }

    const slotKey = `${slot.date}|${slot.startTime}`
    if (processedSlots.has(slotKey)) {
      continue
    }
    processedSlots.add(slotKey)

    const endTime = addMinutes(slot.startTime, intent.durationMinutes)
    const participantScores: number[] = []
    const participantFocus: number[] = []
    let fullyAvailableCount = 0

    for (const participant of participantUsers) {
      const participantKey = `${participant.userId}|${slot.date}|${slot.startTime}`
      const participantSlot = slotIndex.get(participantKey)
      const runwayBlocks = runwayIndex.get(participantKey) ?? 0

      if (!participantSlot) {
        continue
      }

      if (runwayBlocks >= durationBlocks) {
        fullyAvailableCount += 1
      }

      participantScores.push(
        scoreSlot({
          slot: participantSlot,
          user: participant,
          runwayBlocks,
          requestDuration: intent.durationMinutes,
          urgencyLevel,
        }),
      )
      participantFocus.push(participantSlot.focusScore)
    }

    if (participantScores.length === 0) {
      continue
    }

    const participantAvailability = fullyAvailableCount / participantUsers.length
    const focusAverage = participantFocus.reduce((sum, value) => sum + value, 0) / participantFocus.length
    const averageScore = participantScores.reduce((sum, value) => sum + value, 0) / participantScores.length
    const finalScore = averageScore * (0.7 + 0.3 * participantAvailability)

    const { explanation, supportingSignals } = buildExplanation({
      slot,
      user,
      participantAvailability,
      focusAverage,
      requestDuration: intent.durationMinutes,
      score: finalScore,
      timePreference: intent.timePreference,
    })

    recommendationsMap.set(slotKey, {
      slotKey,
      date: slot.date,
      startTime: slot.startTime,
      endTime,
      score: Number(finalScore.toFixed(3)),
      scoreLabel: scoreLabel(finalScore),
      participantAvailability: Number(participantAvailability.toFixed(2)),
      focusAverage: Number(focusAverage.toFixed(2)),
      explanation,
      supportingSignals,
    })
  }

  const recommendations = Array.from(recommendationsMap.values())
  const sorted = recommendations.sort((left, right) => right.score - left.score)
  const fullyAvailable = sorted.filter((option) => option.participantAvailability === 1)
  return (fullyAvailable.length > 0 ? fullyAvailable : sorted).slice(0, 5)
}

function overlappingEvents(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => `${a.date}|${a.startTime}`.localeCompare(`${b.date}|${b.startTime}`))
  const overlaps: CalendarEvent[] = []

  for (let index = 0; index < sorted.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < sorted.length; otherIndex += 1) {
      if (sorted[index].date !== sorted[otherIndex].date) {
        break
      }
      if (eventsOverlap(sorted[index].startTime, sorted[index].endTime, sorted[otherIndex].startTime, sorted[otherIndex].endTime)) {
        overlaps.push(sorted[index], sorted[otherIndex])
      }
    }
  }

  return Array.from(new Map(overlaps.map((event) => [event.eventId, event])).values())
}

async function buildConflictOptions(user: UserProfile, intent: SchedulingIntent, recommendations: RecommendationOption[]) {
  const allEvents = await getUserEvents(user.userId)
  const window = getDateWindow(intent.datePreference, intent.specificDate)
  const scopedEvents = allEvents.filter((event) => isWithinDateRange(event.date, window.start, window.end))
  const conflicts = overlappingEvents(scopedEvents)
  if (conflicts.length === 0) {
    return []
  }

  const slots = await getUserSlots(user.userId)
  const slotIndex = buildSlotIndex(slots)
  const runwayIndex = buildRunwayIndex(slots)
  const urgencyLevel = URGENCY_LEVEL[intent.urgency]

  return conflicts
    .map<ConflictMoveOption>((event) => {
      const slot = slotIndex.get(`${user.userId}|${event.date}|${event.startTime}`)
      const runwayBlocks = runwayIndex.get(`${user.userId}|${event.date}|${event.startTime}`) ?? 0
      const currentScore =
        slot
          ? scoreSlot({
              slot: { ...slot, isBusy: false, isConflict: true },
              user,
              runwayBlocks,
              requestDuration: event.durationMinutes,
              urgencyLevel,
            })
          : 0.35

      const bestAlternative =
        recommendations.find(
          (option) =>
            option.date !== event.date ||
            !eventsOverlap(option.startTime, option.endTime, event.startTime, event.endTime),
        ) ?? null

      const importance = EVENT_PRIORITY[event.meetingType] ?? 0.5
      const movePriority = (bestAlternative?.score ?? 0.4) - currentScore + (1 - importance) * 0.35

      return {
        eventId: event.eventId,
        title: toTitleCase(event.meetingType),
        date: event.date,
        currentStart: event.startTime,
        currentEnd: event.endTime,
        currentScore: Number(currentScore.toFixed(3)),
        bestAlternative,
        movePriority: Number(movePriority.toFixed(3)),
        explanation: [
          `${toTitleCase(event.meetingType)} has a ${Math.round((bestAlternative?.score ?? 0.4) * 100)} score alternative available.`,
          `Current placement scores ${Math.round(currentScore * 100)} and overlaps another commitment.`,
          "Lower-importance meetings with higher-quality alternatives are prioritized for rescheduling.",
        ],
      }
    })
    .sort((left, right) => right.movePriority - left.movePriority)
}

export async function generateSchedule(userId: number, intent: SchedulingIntent): Promise<ScheduleResponse> {
  const user = await getUser(userId)
  if (!user) {
    throw new Error(`Unknown user ${userId}`)
  }

  const events = await getUserEvents(user.userId)
  const recommendations = await buildRecommendations(user, intent)
  const alternatives = recommendations.slice(1)
  const conflictOptions = intent.requiresConflictResolution
    ? await buildConflictOptions(user, intent, recommendations)
    : []

  const notes = [
    intent.llmUsed
      ? "Intent parsing used the configured external language model."
      : "Intent parsing fell back to a deterministic parser because no LLM endpoint was configured.",
    "All ranking and conflict recommendations come from the trained runtime ML model plus live calendar features.",
    "No meeting is created or moved automatically; the UI requires confirmation first.",
  ]

  return {
    user,
    intent,
    events,
    recommendations: recommendations.slice(0, 3),
    alternatives: alternatives.slice(0, 2),
    conflictOptions,
    modelMetrics: getModelMetrics(),
    notes,
  }
}

import modelArtifact from "@/lib/model-artifact.json"
import type { TimeSlotRecord, UserProfile } from "@/lib/types"
import { timeToMinutes } from "@/lib/server/data"


type ModelArtifact = typeof modelArtifact

const PREFERRED_TIME_CENTERS: Record<UserProfile["preferredTime"], number> = {
  morning: 10,
  neutral: 13,
  afternoon: 15.5,
}

export interface ModelContext {
  slot: TimeSlotRecord
  user: UserProfile
  runwayBlocks: number
  requestDuration: number
  urgencyLevel: number
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-Math.max(Math.min(value, 40), -40)))
}

function dndFlag(start: string | null, end: string | null, slotTime: string) {
  if (!start || !end) {
    return 0
  }

  const slotMinutes = timeToMinutes(slotTime)
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  if (endMinutes < startMinutes) {
    return slotMinutes >= startMinutes || slotMinutes < endMinutes ? 1 : 0
  }

  return slotMinutes >= startMinutes && slotMinutes < endMinutes ? 1 : 0
}

function featureVector(context: ModelContext) {
  const { slot, user, runwayBlocks, requestDuration, urgencyLevel } = context
  const requestBlocks = Math.max(Math.ceil(requestDuration / 30), 1)
  const durationFit = runwayBlocks >= requestBlocks ? 1 : 0
  const runwayMargin = runwayBlocks - requestBlocks
  const durationGap = Math.abs(user.preferredDuration - requestDuration)
  const meetingLoadGap = slot.meetingCountThatDay - user.avgMeetingsPerDay
  const meetingLoadRatio = slot.meetingCountThatDay / Math.max(user.avgMeetingsPerDay, 1)
  const hourDistance = Math.abs(slot.hour - PREFERRED_TIME_CENTERS[user.preferredTime])

  return {
    focus_score: slot.focusScore,
    is_busy: slot.isBusy ? 1 : 0,
    is_conflict: slot.isConflict ? 1 : 0,
    meeting_count_that_day: slot.meetingCountThatDay,
    runway_blocks: runwayBlocks,
    request_blocks: requestBlocks,
    duration_fit: durationFit,
    runway_margin: runwayMargin,
    duration_gap: durationGap,
    urgency_level: urgencyLevel,
    focus_x_urgency: slot.focusScore * (urgencyLevel + 1),
    meeting_load_gap: meetingLoadGap,
    meeting_load_ratio: meetingLoadRatio,
    hour_distance_from_preference: hourDistance,
    dnd_overlap: dndFlag(user.doNotDisturbStart, user.doNotDisturbEnd, slot.startTime),
    hour_sin: Math.sin((slot.hour / 24) * 2 * Math.PI),
    hour_cos: Math.cos((slot.hour / 24) * 2 * Math.PI),
    dow_sin: Math.sin((slot.dayOfWeek / 7) * 2 * Math.PI),
    dow_cos: Math.cos((slot.dayOfWeek / 7) * 2 * Math.PI),
  }
}

export function scoreSlot(context: ModelContext) {
  const featureMap = featureVector(context)
  const artifact = modelArtifact as ModelArtifact

  let linear = artifact.bias
  for (let index = 0; index < artifact.feature_names.length; index += 1) {
    const featureName = artifact.feature_names[index] as keyof typeof featureMap
    const value = featureMap[featureName]
    const mean = artifact.means[index]
    const std = artifact.stds[index] || 1
    const normalized = (value - mean) / std
    linear += normalized * artifact.weights[index]
  }

  return sigmoid(linear)
}

export function getModelMetrics() {
  return modelArtifact.metrics
}

export type Urgency = "low" | "medium" | "high"
export type PreferredTime = "morning" | "neutral" | "afternoon"

export interface UserProfile {
  userId: number
  name: string
  email: string
  preferredTime: PreferredTime
  avgMeetingsPerDay: number
  preferredDuration: number
  doNotDisturbStart: string | null
  doNotDisturbEnd: string | null
  preferredMeetingTypes: string[]
}

export interface CalendarEvent {
  eventId: number
  userId: number
  date: string
  startTime: string
  endTime: string
  meetingType: string
  isConflict: boolean
  durationMinutes: number
}

export interface TimeSlotRecord {
  slotId: number
  userId: number
  date: string
  startTime: string
  hour: number
  dayOfWeek: number
  focusScore: number
  isBusy: boolean
  isConflict: boolean
  meetingCountThatDay: number
  label: number
}

export interface SchedulingIntent {
  rawRequest: string
  action: "schedule" | "resolve_conflict"
  durationMinutes: number
  participants: number[]
  participantHints: string[]
  urgency: Urgency
  hardConstraints: string[]
  datePreference: "today" | "tomorrow" | "this_week" | "next_week" | "specific_date" | "none"
  specificDate: string | null
  timePreference: "morning" | "afternoon" | "avoid_low_focus" | "none"
  requiresConflictResolution: boolean
  llmUsed: boolean
}

export interface RecommendationOption {
  slotKey: string
  date: string
  startTime: string
  endTime: string
  score: number
  scoreLabel: string
  participantAvailability: number
  focusAverage: number
  explanation: string[]
  supportingSignals: string[]
}

export interface ConflictMoveOption {
  eventId: number
  title: string
  date: string
  currentStart: string
  currentEnd: string
  currentScore: number
  bestAlternative: RecommendationOption | null
  movePriority: number
  explanation: string[]
}

export interface ScheduleResponse {
  user: UserProfile
  intent: SchedulingIntent
  events: CalendarEvent[]
  recommendations: RecommendationOption[]
  alternatives: RecommendationOption[]
  conflictOptions: ConflictMoveOption[]
  modelMetrics: {
    accuracy: number
    precision: number
    recall: number
    positiveRate: number
  }
  notes: string[]
}

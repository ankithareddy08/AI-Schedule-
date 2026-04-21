import type { SchedulingIntent } from "@/lib/types"


interface LlmIntentResponse {
  durationMinutes?: number
  participants?: number[]
  participantHints?: string[]
  urgency?: SchedulingIntent["urgency"]
  hardConstraints?: string[]
  datePreference?: SchedulingIntent["datePreference"]
  specificDate?: string | null
  timePreference?: SchedulingIntent["timePreference"]
  action?: SchedulingIntent["action"]
  requiresConflictResolution?: boolean
}

function extractDuration(text: string) {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*hour/)
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60)
  }

  const minuteMatch = text.match(/(\d+)\s*(minute|min)\b/)
  if (minuteMatch) {
    return Number(minuteMatch[1])
  }

  if (text.includes("quick sync")) {
    return 30
  }

  return 60
}

function extractParticipants(text: string) {
  const matches = Array.from(text.matchAll(/user\s*(\d+)/gi))
  return matches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value))
}

function extractUrgency(text: string): SchedulingIntent["urgency"] {
  if (/(urgent|asap|immediately|today)/i.test(text)) {
    return "high"
  }
  if (/(soon|priority|important|tomorrow)/i.test(text)) {
    return "medium"
  }
  return "low"
}

function extractDatePreference(text: string): Pick<SchedulingIntent, "datePreference" | "specificDate"> {
  const explicitDate = text.match(/\b(2025-\d{2}-\d{2})\b/)
  if (explicitDate) {
    return { datePreference: "specific_date", specificDate: explicitDate[1] }
  }
  if (/tomorrow/i.test(text)) {
    return { datePreference: "tomorrow", specificDate: null }
  }
  if (/next week/i.test(text)) {
    return { datePreference: "next_week", specificDate: null }
  }
  if (/\bthis week\b/i.test(text)) {
    return { datePreference: "this_week", specificDate: null }
  }
  if (/today/i.test(text)) {
    return { datePreference: "today", specificDate: null }
  }
  return { datePreference: "none", specificDate: null }
}

function extractTimePreference(text: string): SchedulingIntent["timePreference"] {
  if (/avoid my low-focus hours|avoid low-focus|low focus/i.test(text)) {
    return "avoid_low_focus"
  }
  if (/morning|before noon/i.test(text)) {
    return "morning"
  }
  if (/afternoon|after lunch|after 2/i.test(text)) {
    return "afternoon"
  }
  return "none"
}

function extractHardConstraints(text: string) {
  const constraints: string[] = []
  if (/avoid my low-focus hours|avoid low-focus|low focus/i.test(text)) {
    constraints.push("Avoid low-focus hours")
  }
  if (/before noon/i.test(text)) {
    constraints.push("Before noon")
  }
  if (/after lunch|afternoon/i.test(text)) {
    constraints.push("After lunch")
  }
  if (/this week/i.test(text)) {
    constraints.push("Schedule within this week")
  }
  if (/tomorrow/i.test(text)) {
    constraints.push("Schedule tomorrow")
  }
  return constraints
}

function fallbackIntent(rawRequest: string): SchedulingIntent {
  const datePreference = extractDatePreference(rawRequest)
  const participants = extractParticipants(rawRequest)
  const requiresConflictResolution = /overlap|overlapping|conflict|which one should move|reschedule/i.test(rawRequest)

  return {
    rawRequest,
    action: requiresConflictResolution ? "resolve_conflict" : "schedule",
    durationMinutes: extractDuration(rawRequest),
    participants,
    participantHints: participants.map((participant) => `User ${participant}`),
    urgency: extractUrgency(rawRequest),
    hardConstraints: extractHardConstraints(rawRequest),
    datePreference: datePreference.datePreference,
    specificDate: datePreference.specificDate,
    timePreference: extractTimePreference(rawRequest),
    requiresConflictResolution,
    llmUsed: false,
  }
}

async function parseWithGemini(rawRequest: string): Promise<LlmIntentResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `You are a meeting scheduling assistant. Extract structured meeting intent from natural language input.
Return ONLY a valid JSON object with these exact keys (no markdown, no extra text):
{
  "action": "schedule" or "resolve_conflict",
  "durationMinutes": <integer, meeting duration in minutes>,
  "participants": [<integer user IDs mentioned, e.g. [1, 2]>],
  "participantHints": [<participant name hints as strings>],
  "urgency": "low" or "medium" or "high",
  "hardConstraints": [<constraint strings like "Before noon", "After lunch", "Avoid low-focus hours">],
  "datePreference": "today" or "tomorrow" or "this_week" or "next_week" or "specific_date" or "none",
  "specificDate": "<YYYY-MM-DD>" or null,
  "timePreference": "morning" or "afternoon" or "avoid_low_focus" or "none",
  "requiresConflictResolution": <true or false>
}

Meeting request: "${rawRequest}"`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
      },
    )

    if (!response.ok) return null

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    return JSON.parse(text) as LlmIntentResponse
  } catch {
    return null
  }
}

export async function parseIntent(rawRequest: string, activeUserId: number): Promise<SchedulingIntent> {
  const fallback = fallbackIntent(rawRequest)

  try {
    const parsed = await parseWithGemini(rawRequest)
    if (!parsed) {
      return {
        ...fallback,
        participants: Array.from(new Set([activeUserId, ...fallback.participants])),
      }
    }

    return {
      rawRequest,
      action: parsed.action ?? fallback.action,
      durationMinutes: parsed.durationMinutes ?? fallback.durationMinutes,
      participants: Array.from(new Set([activeUserId, ...(parsed.participants ?? fallback.participants)])),
      participantHints: parsed.participantHints ?? fallback.participantHints,
      urgency: parsed.urgency ?? fallback.urgency,
      hardConstraints: parsed.hardConstraints ?? fallback.hardConstraints,
      datePreference: parsed.datePreference ?? fallback.datePreference,
      specificDate: parsed.specificDate ?? fallback.specificDate,
      timePreference: parsed.timePreference ?? fallback.timePreference,
      requiresConflictResolution: parsed.requiresConflictResolution ?? fallback.requiresConflictResolution,
      llmUsed: true,
    }
  } catch {
    return {
      ...fallback,
      participants: Array.from(new Set([activeUserId, ...fallback.participants])),
    }
  }
}

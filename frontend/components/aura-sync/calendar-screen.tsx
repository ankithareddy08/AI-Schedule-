"use client"

import { CalendarClock, Clock3, Flame, GitCompareArrows } from "lucide-react"

import type { CalendarEvent, ConflictMoveOption, RecommendationOption } from "@/lib/types"


interface CalendarScreenProps {
  events: CalendarEvent[]
  recommendations: RecommendationOption[]
  conflictOptions: ConflictMoveOption[]
}

const HOURS = Array.from({ length: 11 }, (_, index) => 8 + index)

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`))
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function eventTop(time: string) {
  return ((toMinutes(time) - 8 * 60) / 30) * 32
}

function eventHeight(start: string, end: string) {
  return Math.max(((toMinutes(end) - toMinutes(start)) / 30) * 32 - 6, 26)
}

export function CalendarScreen({ events, recommendations, conflictOptions }: CalendarScreenProps) {
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((accumulator, event) => {
    accumulator[event.date] = [...(accumulator[event.date] ?? []), event]
    return accumulator
  }, {})

  const visibleDates = Object.keys(grouped).sort().slice(0, 3)

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Calendar view</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Current meetings and suggested windows</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            Dataset-driven week
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {visibleDates.map((date) => (
            <div key={date} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-white">{dayLabel(date)}</p>
                <CalendarClock className="h-4 w-4 text-slate-500" />
              </div>
              <div className="relative">
                {HOURS.map((hour) => (
                  <div key={hour} className="flex h-8 items-start gap-3 border-t border-white/8">
                    <span className="w-12 pt-1 text-[11px] text-slate-500">{hour}:00</span>
                    <div className="flex-1" />
                  </div>
                ))}

                <div className="absolute inset-x-12 top-0">
                  {(grouped[date] ?? []).map((event) => (
                    <div
                      key={event.eventId}
                      className="absolute inset-x-0 rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/16 to-cyan-400/10 px-3 py-2 text-xs text-white shadow-lg shadow-fuchsia-950/10"
                      style={{ top: eventTop(event.startTime), height: eventHeight(event.startTime, event.endTime) }}
                    >
                      <p className="font-medium">{event.meetingType.replace("_", " ")}</p>
                      <p className="mt-1 text-[11px] text-slate-200">
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                  ))}

                  {(recommendations ?? [])
                    .filter((option) => option.date === date)
                    .slice(0, 2)
                    .map((option, index) => (
                      <div
                        key={option.slotKey}
                        className="absolute inset-x-0 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100"
                        style={{ top: eventTop(option.startTime) + index * 4, height: eventHeight(option.startTime, option.endTime) }}
                      >
                        <p className="font-medium">Suggested slot</p>
                        <p className="mt-1 text-[11px]">
                          {option.startTime} - {option.endTime} · {Math.round(option.score * 100)} score
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-white">Top ML signals</p>
              <p className="text-xs text-slate-400">What the ranking model liked most in the recommended slots.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {recommendations.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Submit a scheduling request to populate ranked slots here.
              </div>
            ) : (
              recommendations.map((option) => (
                <div key={option.slotKey} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {option.date} · {option.startTime} - {option.endTime}
                      </p>
                      <p className="mt-1 text-xs text-cyan-200">{option.scoreLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-right">
                      <p className="text-xs text-slate-400">ML score</p>
                      <p className="text-lg font-semibold text-white">{Math.round(option.score * 100)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.supportingSignals.map((signal) => (
                      <span key={signal} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-white">Conflict comparison</p>
              <p className="text-xs text-slate-400">Which overlapping meeting is most reasonable to move.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {conflictOptions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Ask a conflict question and the model will compare overlapping meetings here.
              </div>
            ) : (
              conflictOptions.slice(0, 3).map((option) => (
                <div key={option.eventId} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{option.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {option.date} · {option.currentStart} - {option.currentEnd}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-right">
                      <p className="text-xs text-slate-400">Move score</p>
                      <p className="text-lg font-semibold text-white">{Math.round(option.movePriority * 100)}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs leading-6 text-slate-300">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Clock3 className="h-3.5 w-3.5" />
                      Current {Math.round(option.currentScore * 100)} · Best alternative {Math.round((option.bestAlternative?.score ?? 0) * 100)}
                    </div>
                    <p className="mt-2">{option.explanation[0]}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { CheckCircle2, Sparkles, X } from "lucide-react"

import type { RecommendationOption, ScheduleResponse } from "@/lib/types"


interface RecommendationSheetProps {
  isOpen: boolean
  result: ScheduleResponse | null
  confirmedSlotKey: string | null
  onClose: () => void
  onConfirm: (option: RecommendationOption) => void
}

export function RecommendationSheet({
  isOpen,
  result,
  confirmedSlotKey,
  onClose,
  onConfirm,
}: RecommendationSheetProps) {
  if (!isOpen || !result) {
    return null
  }

  const options = result.recommendations

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/72 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0a0d15]/94 p-5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/15" />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Slot comparison view</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ranked recommendations for confirmation</h2>
            <p className="mt-2 text-sm text-slate-400">
              No action is taken until the user confirms one of these ML-ranked options.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {options.map((option, index) => {
              const confirmed = confirmedSlotKey === option.slotKey

              return (
                <div
                  key={option.slotKey}
                  className={`rounded-[1.75rem] border p-5 ${
                    index === 0
                      ? "border-cyan-300/35 bg-cyan-400/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                            <Sparkles className="h-3 w-3" />
                            Top choice
                          </span>
                        ) : null}
                        {confirmed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xl font-semibold text-white">
                        {option.date} · {option.startTime} - {option.endTime}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">{option.scoreLabel}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ML score</p>
                      <p className="mt-1 text-3xl font-semibold text-white">{Math.round(option.score * 100)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {option.explanation.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {option.supportingSignals.map((signal) => (
                      <span key={signal} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {signal}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                      Participant availability {Math.round(option.participantAvailability * 100)}% · focus average {Math.round(option.focusAverage * 100)}%
                    </p>
                    <button
                      onClick={() => onConfirm(option)}
                      className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Confirm suggestion
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Model performance snapshot</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Accuracy</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(result.modelMetrics.accuracy * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Precision</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(result.modelMetrics.precision * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Recall</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(result.modelMetrics.recall * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">Positive rate</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(result.modelMetrics.positiveRate * 100)}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">System notes</p>
              <div className="mt-4 space-y-3">
                {result.notes.map((note) => (
                  <div key={note} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm leading-6 text-slate-200">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { Loader2, Send, Sparkles } from "lucide-react"

import type { ScheduleResponse } from "@/lib/types"


interface Message {
  id: number
  type: "user" | "assistant"
  text: string
}

interface ChatScreenProps {
  messages: Message[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  result: ScheduleResponse | null
  onShowRecommendations: () => void
}

function intentSummary(result: ScheduleResponse) {
  const participants = result.intent.participants.join(", ")
  return [
    `Duration ${result.intent.durationMinutes} min`,
    `Urgency ${result.intent.urgency}`,
    `Participants ${participants}`,
    `Constraint count ${result.intent.hardConstraints.length}`,
  ]
}

export function ChatScreen({
  messages,
  input,
  onInputChange,
  onSend,
  isLoading,
  result,
  onShowRecommendations,
}: ChatScreenProps) {
  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Chat input</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Ask the scheduler in natural language</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === "assistant" ? (
              <div className="mr-3 mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-lg shadow-fuchsia-900/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            ) : null}
            <div
                className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-7 ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white"
                    : "border border-white/10 bg-white/[0.06] text-slate-100"
                }`}
              >
              {message.text}
            </div>
          </div>
        ))}

        {result ? (
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/8 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">Intent extraction</p>
                <p className="mt-2 text-sm text-white">
                  {result.intent.llmUsed ? "LLM parser active" : "Fallback parser active"} · action {result.intent.action.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={onShowRecommendations}
                className="rounded-2xl border border-cyan-300/30 bg-white/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-white/15"
              >
                View ranked slots
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {intentSummary(result).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-2">
          <textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                onSend()
              }
            }}
            placeholder='Try "Schedule a 1-hour team sync this week" or "I have two overlapping meetings tomorrow - which one should move?"'
            className="min-h-[112px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-xs text-slate-500">LLM parses intent only. ML decides the slot ranking.</p>
            <button
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Run scheduler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

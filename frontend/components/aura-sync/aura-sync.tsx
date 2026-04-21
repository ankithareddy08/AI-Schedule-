"use client"

import { useEffect, useState } from "react"
import { Bot, CalendarDays, LogOut, UserCircle2 } from "lucide-react"

import { CalendarScreen } from "./calendar-screen"
import { ChatScreen } from "./chat-screen"
import { LoginScreen } from "./login-screen"
import { RecommendationSheet } from "./recommendation-sheet"
import type { RecommendationOption, ScheduleResponse, UserProfile } from "@/lib/types"


interface ChatMessage {
  id: number
  type: "user" | "assistant"
  text: string
}

export function AuraSync() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "assistant",
      text: "Ask for a meeting in plain language and I'll parse the request, rank candidate slots with the trained model, and show alternatives for confirmation.",
    },
  ])
  const [input, setInput] = useState("Schedule a 1-hour team sync this week and avoid my low-focus hours.")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<ScheduleResponse | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [confirmedSlotKey, setConfirmedSlotKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      try {
        const response = await fetch("/api/users")
        const payload = (await response.json()) as { users: UserProfile[] }
        if (!cancelled) {
          setUsers(payload.users)
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false)
        }
      }
    }

    void loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSend() {
    if (!activeUser || !input.trim() || isSubmitting) {
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      text: input.trim(),
    }
    setMessages((current) => [...current, userMessage])
    setIsSubmitting(true)
    setConfirmedSlotKey(null)

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: activeUser.userId,
          prompt: input.trim(),
        }),
      })

      const payload = (await response.json()) as ScheduleResponse | { error: string }
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Scheduling failed")
      }

      setResult(payload)
      setShowRecommendations(true)
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          type: "assistant",
          text:
            payload.intent.requiresConflictResolution && payload.conflictOptions.length > 0
              ? `I found overlapping meetings and ranked which one is easiest to move. The top move candidate is ${payload.conflictOptions[0].title} with a move score of ${Math.round(payload.conflictOptions[0].movePriority * 100)}.`
              : `I ranked ${payload.recommendations.length} meeting options. The best slot is ${payload.recommendations[0]?.date} at ${payload.recommendations[0]?.startTime} with an ML score of ${Math.round((payload.recommendations[0]?.score ?? 0) * 100)}.`,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          type: "assistant",
          text: error instanceof Error ? error.message : "Something went wrong while running the scheduler.",
        },
      ])
    } finally {
      setIsSubmitting(false)
      setInput("")
    }
  }

  function handleConfirm(option: RecommendationOption) {
    setConfirmedSlotKey(option.slotKey)
    setShowRecommendations(false)
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + 2,
        type: "assistant",
        text: `Confirmation captured for ${option.date} ${option.startTime}-${option.endTime}. The prototype stops here by design so no calendar mutation happens without an explicit final action step.`,
      },
    ])
  }

  if (!activeUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-12%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[160px]" />
          <div className="absolute bottom-[-18%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/12 blur-[160px]" />
        </div>
        <div className="relative z-10">
          <LoginScreen users={users} isLoading={usersLoading} onSelectUser={setActiveUser} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-12%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[160px]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-5">
        <header className="mb-5 rounded-[2rem] border border-white/10 bg-black/35 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                <Bot className="h-3.5 w-3.5" />
                Aura Sync
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white">AI-powered scheduling workspace</h1>
              <p className="mt-2 text-sm text-slate-400">
                Logged in as {activeUser.name}. Ranking runs on the trained slot model; chat only handles intent extraction.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500">Active user</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                  <UserCircle2 className="h-4 w-4 text-cyan-300" />
                  {activeUser.name}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500">Preferred window</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                  <CalendarDays className="h-4 w-4 text-fuchsia-300" />
                  {activeUser.preferredTime}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveUser(null)
                  setResult(null)
                  setShowRecommendations(false)
                  setConfirmedSlotKey(null)
                }}
                className="inline-flex items-center gap-2 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Switch user
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <ChatScreen
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={() => void handleSend()}
            isLoading={isSubmitting}
            result={result}
            onShowRecommendations={() => setShowRecommendations(true)}
          />
          <CalendarScreen
            events={result?.events ?? []}
            recommendations={result?.recommendations ?? []}
            conflictOptions={result?.conflictOptions ?? []}
          />
        </div>
      </div>

      <RecommendationSheet
        isOpen={showRecommendations}
        result={result}
        confirmedSlotKey={confirmedSlotKey}
        onClose={() => setShowRecommendations(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

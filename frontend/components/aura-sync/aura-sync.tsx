"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

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

type Tab = "chat" | "calendar"

const SCHEDULING_RE = /\b(schedule|meeting|book|set up|arrange|plan|sync|standup|stand.?up|1:1|one.on.one|call|review|interview|hour|minute|min|today|tomorrow|monday|tuesday|wednesday|thursday|friday|this week|next week|morning|afternoon|evening)\b/i

export function AuraSync() {
  const msgId = useRef(2)
  const nextId = () => ++msgId.current

  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("chat")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "assistant",
      text: "Hi! Tell me what meeting you need to schedule. I'll parse the request and rank the best time slots.",
    },
  ])
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<ScheduleResponse | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [confirmedSlotKey, setConfirmedSlotKey] = useState<string | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/users")
      .then((r) => r.json())
      .then((payload: { users: UserProfile[] }) => {
        if (!cancelled) setUsers(payload.users)
      })
      .finally(() => { if (!cancelled) setUsersLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleSend() {
    if (!activeUser || !input.trim() || isSubmitting) return

    const prompt = input.trim()
    const userMsgId = nextId()
    setMessages((c) => [...c, { id: userMsgId, type: "user", text: prompt }])
    setInput("")

    if (!SCHEDULING_RE.test(prompt)) {
      setMessages((c) => [...c, {
        id: nextId(), type: "assistant",
        text: "I'm a scheduling assistant! Try something like: \"Schedule a 30-min team sync tomorrow\" or \"Book a 1-hour review this Friday afternoon\".",
      }])
      return
    }

    setIsSubmitting(true)
    setConfirmedSlotKey(null)

    const loadingId = nextId()
    setMessages((c) => [...c, { id: loadingId, type: "assistant", text: "⏳ Parsing with Gemini..." }])

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUser.userId, prompt }),
      })
      const payload = (await res.json()) as ScheduleResponse | { error: string }
      if (!res.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Scheduling failed")

      setResult(payload)
      setShowRecommendations(true)

      const p = payload as ScheduleResponse
      const method = p.intent.llmUsed ? "🤖 Gemini" : "📋 Auto"
      const count = p.recommendations.length
      const aiText = p.intent.requiresConflictResolution && p.conflictOptions.length > 0
        ? `Conflict detected. Ranked ${p.conflictOptions.length} overlapping meeting${p.conflictOptions.length !== 1 ? 's' : ''} by move priority.`
        : `${method} parsed: ${p.intent.durationMinutes}min ${p.intent.action.replace('_', ' ')} · ML model ranked ${count} slot${count !== 1 ? 's' : ''}.`

      setMessages((c) => c.map((m) => m.id === loadingId ? { ...m, text: aiText } : m))
    } catch (err) {
      setMessages((c) => c.map((m) =>
        m.id === loadingId
          ? { ...m, text: err instanceof Error ? err.message : "Scheduling failed." }
          : m
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleConfirm(option: RecommendationOption) {
    setConfirmedSlotKey(option.slotKey)
    setShowRecommendations(false)
    setMessages((c) => [
      ...c,
      {
        id: nextId(),
        type: "assistant",
        text: `✅ Confirmed! Meeting locked for ${option.date} at ${option.startTime}–${option.endTime}. No calendar was mutated — confirmation is the final human-in-the-loop step.`,
      },
    ])
  }

  function handleSignOut() {
    setActiveUser(null)
    setResult(null)
    setShowRecommendations(false)
    setConfirmedSlotKey(null)
    setActiveTab("chat")
    setMessages([{
      id: 1, type: "assistant",
      text: "Hi! Tell me what meeting you need to schedule. I'll parse the request and rank the best time slots.",
    }])
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!activeUser) {
    return <LoginScreen users={users} isLoading={usersLoading} onSelectUser={setActiveUser} />
  }

  // ── App shell ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#050505' }}>

      {/* Header — matches mobile chatHeader */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0f0f13',
        flexShrink: 0,
        zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            position: 'relative',
            width: 36, height: 36, borderRadius: '50%',
            border: '1.5px solid #22d3ee',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <Image
              src="/app-logo.jpg"
              alt="Logo"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Aura Sync</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User info chips */}
          <div style={{
            display: 'flex', gap: 8,
            fontSize: 12, color: '#888',
          }} className="hidden sm:flex">
            <span className="m-tag" style={{ color: '#22d3ee' }}>{activeUser.name}</span>
            <span className="m-tag">{activeUser.preferredTime} preference</span>
          </div>

          {/* User badge */}
          <div
            className="m-user-badge"
            title={`Signed in as ${activeUser.name}`}
            onClick={() => setShowSignOut(true)}
          >
            {activeUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', padding: '20px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* Desktop: two columns — Chat | Calendar */}
        <div className="hidden lg:grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
          <ChatScreen
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={() => void handleSend()}
            isLoading={isSubmitting}
            result={result}
            onShowRecommendations={() => setShowRecommendations(true)}
          />
          <div style={{ overflowY: 'auto', paddingRight: 4 }}>
            <CalendarScreen
              events={result?.events ?? []}
              recommendations={result?.recommendations ?? []}
              conflictOptions={result?.conflictOptions ?? []}
            />
          </div>
        </div>

        {/* Mobile: tab-based single column */}
        <div className="lg:hidden" style={{ height: '100%' }}>
          {activeTab === "chat"
            ? <ChatScreen
                messages={messages}
                input={input}
                onInputChange={setInput}
                onSend={() => void handleSend()}
                isLoading={isSubmitting}
                result={result}
                onShowRecommendations={() => setShowRecommendations(true)}
              />
            : <div style={{ overflowY: 'auto', height: '100%' }}>
                <CalendarScreen
                  events={result?.events ?? []}
                  recommendations={result?.recommendations ?? []}
                  conflictOptions={result?.conflictOptions ?? []}
                />
              </div>
          }
        </div>
      </main>

      {/* Bottom nav — mobile only, matches mobile bottomNav */}
      <nav className="lg:hidden" style={{
        display: 'flex',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#050505',
        paddingTop: 12, paddingBottom: 12,
        flexShrink: 0,
      }}>
        {(["chat", "calendar"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            {tab === "chat"
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === tab ? '#22d3ee' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === tab ? '#22d3ee' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            }
            <span style={{ fontSize: 12, fontWeight: 600, color: activeTab === tab ? '#22d3ee' : '#555' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
          </button>
        ))}
      </nav>

      <RecommendationSheet
        isOpen={showRecommendations}
        result={result}
        confirmedSlotKey={confirmedSlotKey}
        onClose={() => setShowRecommendations(false)}
        onConfirm={handleConfirm}
      />

      {/* Sign-out confirmation modal */}
      {showSignOut && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowSignOut(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Centered modal card */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 70,
            width: 320,
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: 28,
          }}>
            {/* User avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#0f0f13',
                border: '2px solid #22d3ee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#22d3ee',
                marginBottom: 12,
              }}>
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                {activeUser.name}
              </p>
              <p style={{ fontSize: 12, color: '#888' }}>
                {activeUser.preferredTime} preference · {activeUser.email}
              </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }} />

            <p style={{ color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to sign out?
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSignOut(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: '#888',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowSignOut(false); handleSignOut() }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderTop: '1.5px solid #ef4444',
                  borderRadius: 12,
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

"use client"

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
  return [
    `${result.intent.durationMinutes} min`,
    `Urgency: ${result.intent.urgency}`,
    `Participants: ${result.intent.participants.join(", ")}`,
    `${result.intent.hardConstraints.length} constraint${result.intent.hardConstraints.length !== 1 ? 's' : ''}`,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }} className="m-card">
      {/* Header */}
      <div className="m-header">
        <div>
          <p className="m-label">Chat input</p>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginTop: 6 }}>Ask the scheduler</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              gap: 8,
            }}
          >
            {message.type === 'assistant' && (
              <span style={{ fontSize: 20, marginBottom: 4 }}>⚡</span>
            )}
            <div
              className={message.type === 'user' ? 'm-bubble-user' : 'm-bubble-ai'}
              style={{ maxWidth: '80%' }}
            >
              {message.text}
            </div>
          </div>
        ))}

        {/* Intent extraction card */}
        {result && (
          <div style={{
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '1rem',
            padding: '1rem',
            marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p className="m-label" style={{ color: '#22d3ee', marginBottom: 4 }}>Intent extraction</p>
                <p style={{ color: '#fff', fontSize: 14 }}>
                  {result.intent.llmUsed ? '🤖 Gemini parsed' : '📋 Auto parsed'} · {result.intent.action.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={onShowRecommendations}
                style={{
                  background: 'rgba(34,211,238,0.1)',
                  border: '1px solid rgba(34,211,238,0.3)',
                  borderRadius: '0.625rem',
                  color: '#22d3ee',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                View ranked slots ↓
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {intentSummary(result).map((item) => (
                <div key={item} className="m-card" style={{ padding: '8px 12px', fontSize: 13, color: '#ccc' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '16px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: '#050505',
      }}>
        <input
          className="m-input"
          placeholder='e.g. "Schedule a 1-hour team sync this week"'
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          disabled={isLoading}
        />
        <button className="m-send-btn" onClick={onSend} disabled={isLoading || !input.trim()}>
          {isLoading
            ? <div style={{ width: 18, height: 18, border: '2px solid #22d3ee', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

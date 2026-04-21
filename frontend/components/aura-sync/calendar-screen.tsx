"use client"

import type { CalendarEvent, ConflictMoveOption, RecommendationOption } from "@/lib/types"


interface CalendarScreenProps {
  events: CalendarEvent[]
  recommendations: RecommendationOption[]
  conflictOptions: ConflictMoveOption[]
}

function fmtDate(d: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" })
      .format(new Date(`${d}T00:00:00`))
  } catch { return d }
}

function fmtTime(t: string) {
  if (!t) return ''
  const h = parseInt(t.split(':')[0] ?? '0', 10)
  const m = t.split(':')[1] ?? '00'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m}`
}

function fmtAMPM(t: string) {
  return parseInt(t.split(':')[0] ?? '0', 10) >= 12 ? 'PM' : 'AM'
}

export function CalendarScreen({ events, recommendations, conflictOptions }: CalendarScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

      {/* Events list */}
      <div className="m-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="m-header">
          <div>
            <p className="m-label">Calendar</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginTop: 6 }}>Your events</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {events.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
              Submit a scheduling request to load calendar events.
            </p>
          )}

          {events.map((ev, i) => {
            const safeType = ev.meetingType.replace(/_/g, ' ').toUpperCase()
            return (
              <div
                key={ev.eventId || i}
                className="m-event"
                style={{ borderLeftColor: ev.isConflict ? '#ef4444' : '#22d3ee' }}
              >
                <div style={{ textAlign: 'center', width: 50, flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{fmtTime(ev.startTime)}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: ev.isConflict ? '#ef4444' : '#22d3ee' }}>
                    {fmtAMPM(ev.startTime)}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{safeType}</p>
                  <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    {ev.durationMinutes}m · {ev.date}
                  </p>
                  {ev.isConflict && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⚠ Conflict</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ML signals */}
      <div className="m-card">
        <div className="m-header">
          <div>
            <p className="m-label">ML Signals</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginTop: 6 }}>Top ranked slots</p>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {recommendations.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>
              Send a request to see ranked slots here.
            </p>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.slotKey} style={{ marginBottom: 12, padding: '12px 14px', borderRadius: '0.875rem', background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      {fmtDate(rec.date)} · {fmtTime(rec.startTime)}–{fmtTime(rec.endTime)} {fmtAMPM(rec.endTime)}
                    </p>
                    <p style={{ color: '#22d3ee', fontSize: 12, marginTop: 2 }}>{rec.scoreLabel}</p>
                  </div>
                  <div style={{
                    background: 'rgba(34,211,238,0.1)',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: '0.625rem',
                    padding: '6px 12px',
                    textAlign: 'right',
                  }}>
                    <p style={{ fontSize: 10, color: '#888' }}>ML score</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{Math.round(rec.score * 100)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rec.supportingSignals.map((sig) => (
                    <span key={sig} className="m-tag">{sig}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conflict comparison */}
      {conflictOptions.length > 0 && (
        <div className="m-card">
          <div className="m-header">
            <div>
              <p className="m-label">Conflict Analysis</p>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginTop: 6 }}>Which meeting to move</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {conflictOptions.slice(0, 3).map((opt) => (
              <div key={opt.eventId} style={{ marginBottom: 12 }} className="m-slot">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{opt.title}</p>
                    <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                      {opt.date} · {opt.currentStart} – {opt.currentEnd}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: '0.625rem',
                    padding: '6px 12px',
                    textAlign: 'right',
                  }}>
                    <p style={{ fontSize: 10, color: '#888' }}>Move score</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{Math.round(opt.movePriority * 100)}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{opt.explanation[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

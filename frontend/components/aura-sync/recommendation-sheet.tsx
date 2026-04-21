"use client"

import type { RecommendationOption, ScheduleResponse } from "@/lib/types"


interface RecommendationSheetProps {
  isOpen: boolean
  result: ScheduleResponse | null
  confirmedSlotKey: string | null
  onClose: () => void
  onConfirm: (option: RecommendationOption) => void
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

export function RecommendationSheet({
  isOpen,
  result,
  confirmedSlotKey,
  onClose,
  onConfirm,
}: RecommendationSheetProps) {
  if (!isOpen || !result) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 50,
        maxHeight: '88vh',
        overflowY: 'auto',
        background: '#0a0a0c',
        borderTop: '1.5px solid rgba(255,255,255,0.2)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2 }} />
        </div>

        {/* Sheet header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p className="m-label">Slot comparison</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginTop: 6 }}>Top Recommendations</p>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              No action is taken until you confirm a slot.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#0f0f13',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '0.625rem',
              padding: '8px 10px',
              color: '#666',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.8fr)',
          gap: 16,
          padding: '20px',
        }}
          className="max-lg:grid-cols-1"
        >
          {/* Left — ranked slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.recommendations.map((rec, index) => {
              const isTop = index === 0
              const confirmed = confirmedSlotKey === rec.slotKey
              return (
                <div key={rec.slotKey} className={isTop ? 'm-slot-top' : 'm-slot'}>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {isTop && (
                      <span style={{
                        background: 'rgba(34,211,238,0.1)',
                        border: '1px solid rgba(34,211,238,0.3)',
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        color: '#22d3ee',
                        fontWeight: 600,
                      }}>⭐ Top choice</span>
                    )}
                    {confirmed && (
                      <span style={{
                        background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.3)',
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        color: '#34d399',
                        fontWeight: 600,
                      }}>✓ Confirmed</span>
                    )}
                  </div>

                  {/* Score + time */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div>
                      <p style={{ color: '#22d3ee', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                        ⭐ {Math.round(rec.score * 100)}% · {rec.scoreLabel}
                      </p>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                        {fmtDate(rec.date)}
                      </p>
                      <p style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>
                        {fmtTime(rec.startTime)}–{fmtTime(rec.endTime)} {fmtAMPM(rec.endTime)}
                      </p>
                    </div>
                    <div style={{
                      background: '#050505',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '0.625rem',
                      padding: '8px 14px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ML score</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                        {Math.round(rec.score * 100)}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {rec.explanation.map((exp) => (
                      <div key={exp} style={{
                        background: '#050505',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '0.625rem',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: '#ccc',
                        lineHeight: 1.5,
                      }}>
                        {exp}
                      </div>
                    ))}
                  </div>

                  {/* Signals */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {rec.supportingSignals.map((sig) => (
                      <span key={sig} className="m-tag">{sig}</span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ fontSize: 12, color: '#666' }}>
                      Availability {Math.round(rec.participantAvailability * 100)}% · Focus {Math.round(rec.focusAverage * 100)}%
                    </p>
                    <button
                      onClick={() => onConfirm(rec)}
                      className="m-btn-cyan"
                      style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                    >
                      Confirm suggestion
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right — model metrics + notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Model metrics */}
            <div className="m-card" style={{ padding: 20 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Model performance</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Accuracy', value: result.modelMetrics.accuracy },
                  { label: 'Precision', value: result.modelMetrics.precision },
                  { label: 'Recall', value: result.modelMetrics.recall },
                  { label: 'Positive rate', value: result.modelMetrics.positiveRate },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: '#050505',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '0.625rem',
                    padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: 11, color: '#666' }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                      {Math.round(value * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* System notes */}
            <div className="m-card" style={{ padding: 20 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>System notes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.notes.map((note) => (
                  <div key={note} style={{
                    background: '#050505',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '0.625rem',
                    padding: '10px 12px',
                    fontSize: 13,
                    color: '#bbb',
                    lineHeight: 1.6,
                  }}>
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

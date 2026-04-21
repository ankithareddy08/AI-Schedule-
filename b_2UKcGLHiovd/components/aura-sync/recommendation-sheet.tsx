"use client"

import { Star, X, Check } from "lucide-react"
import { useState } from "react"

interface RecommendationSheetProps {
  isOpen: boolean
  onClose: () => void
}

const recommendations = [
  {
    id: 1,
    time: "10:00 AM - 10:30 AM",
    match: 95,
    reason: "Protects your deep work block.",
    isBest: true,
  },
  {
    id: 2,
    time: "2:00 PM - 2:30 PM",
    match: 87,
    reason: "Good energy window after lunch.",
    isBest: false,
  },
  {
    id: 3,
    time: "4:30 PM - 5:00 PM",
    match: 72,
    reason: "Available but less optimal.",
    isBest: false,
  },
]

export function RecommendationSheet({ isOpen, onClose }: RecommendationSheetProps) {
  const [confirmed, setConfirmed] = useState<number | null>(null)

  if (!isOpen) return null

  const handleConfirm = (id: number) => {
    setConfirmed(id)
    setTimeout(() => {
      setConfirmed(null)
      onClose()
    }, 1500)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-black/60 backdrop-blur-xl border-t border-white/20 rounded-t-3xl z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Top Recommendations</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Recommendations */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id}>
              {confirmed === rec.id ? (
                /* Confirmed State */
                <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-emerald-400 font-semibold text-lg">Scheduled!</p>
                  <p className="text-slate-400 text-sm mt-1">{rec.time}</p>
                </div>
              ) : rec.isBest ? (
                /* Best Match Card with Fuchsia/Purple Border */
                <div className="bg-white/5 backdrop-blur-xl border border-fuchsia-500/50 rounded-2xl p-5 shadow-lg shadow-fuchsia-500/10">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {rec.match}% Match
                    </span>
                  </div>
                  <p className="text-white font-semibold text-lg mb-1">{rec.time}</p>
                  <p className="text-slate-400 text-sm mb-4">{rec.reason}</p>
                  <button 
                    onClick={() => handleConfirm(rec.id)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/25"
                  >
                    Confirm & Schedule
                  </button>
                </div>
              ) : (
                /* Alternative Cards */
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-gray-400 bg-white/5 px-2.5 py-1 rounded-full text-xs font-medium">
                      {rec.match}% Match
                    </span>
                  </div>
                  <p className="text-white font-medium text-base mb-1">{rec.time}</p>
                  <p className="text-slate-400 text-sm mb-4">{rec.reason}</p>
                  <button 
                    onClick={() => handleConfirm(rec.id)}
                    className="w-full py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Select
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

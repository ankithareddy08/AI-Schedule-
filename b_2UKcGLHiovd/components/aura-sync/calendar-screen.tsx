"use client"

import { ChevronLeft, ChevronRight, Brain, Lock } from "lucide-react"
import { useState } from "react"

const weekDays = [
  { day: "Mon", date: 14, isToday: false },
  { day: "Tue", date: 15, isToday: true },
  { day: "Wed", date: 16, isToday: false },
  { day: "Thu", date: 17, isToday: false },
  { day: "Fri", date: 18, isToday: false },
  { day: "Sat", date: 19, isToday: false },
  { day: "Sun", date: 20, isToday: false },
]

type MeetingType = "standard" | "focus" | "toggle"

interface Meeting {
  id: number
  title: string
  timeRange: string
  subtitle?: string
  duration: number
  top: number
  type: MeetingType
  tags?: string[]
  accentColor?: string
  timeRight?: string
}

const meetings: Meeting[] = [
  { 
    id: 1, 
    title: "Daily Standup", 
    timeRange: "9:00 - 9:45", 
    subtitle: "Team",
    duration: 0.75, 
    top: 0,
    type: "standard",
    accentColor: "from-fuchsia-500 to-purple-600"
  },
  { 
    id: 2, 
    title: "Deep Work Block", 
    timeRange: "10:00 - 12:00", 
    duration: 2, 
    top: 1,
    type: "focus",
    tags: ["Q3 Roadmap", "No Interruptions"]
  },
  { 
    id: 3, 
    title: "Design Review", 
    timeRange: "1:00 - 2:00", 
    subtitle: "Product Team",
    duration: 1, 
    top: 4,
    type: "toggle",
    accentColor: "from-cyan-400 to-blue-500"
  },
  { 
    id: 4, 
    title: "Marketing Sync", 
    timeRange: "2:30 - 3:00", 
    duration: 0.5, 
    top: 5.5,
    type: "standard",
    accentColor: "from-fuchsia-500 to-purple-600",
    timeRight: "2:30 - 3:00"
  },
  { 
    id: 5, 
    title: "Acme Corp Sync", 
    timeRange: "4:00 - 5:00", 
    subtitle: "External",
    duration: 1, 
    top: 7,
    type: "standard",
    accentColor: "from-gray-500 to-gray-600"
  },
]

const timeSlots = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"]

// Current time at 12:30
const currentTimeTop = 3.5 // 12:30 PM position

export function CalendarScreen() {
  const [toggleStates, setToggleStates] = useState<Record<number, boolean>>({ 3: true })

  const handleToggle = (id: number) => {
    setToggleStates(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Week Navigation */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button className="w-8 h-8 rounded-full bg-[#0f0f13] border border-white/5 border-t-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-white font-medium">January 2025</span>
          <button className="w-8 h-8 rounded-full bg-[#0f0f13] border border-white/5 border-t-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Week View */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {weekDays.map((item) => (
            <button
              key={item.date}
              className={`flex flex-col items-center min-w-[48px] py-2 px-3 rounded-xl transition-all ${
                item.isToday
                  ? "bg-gradient-to-b from-fuchsia-500/20 to-purple-600/20 border border-fuchsia-500/50 text-white"
                  : "bg-[#0f0f13] border border-white/5 border-t-white/20 text-gray-400 hover:bg-white/10"
              }`}
            >
              <span className="text-xs font-medium">{item.day}</span>
              <span className="text-lg font-semibold mt-1">{item.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="relative">
          {timeSlots.map((time, index) => (
            <div key={time} className="relative h-[60px] flex">
              <span className={`text-xs w-12 flex-shrink-0 pt-1 ${
                time === "12 PM" ? "text-fuchsia-400 font-medium" : "text-gray-500"
              }`}>
                {time}
              </span>
              <div className="flex-1 border-t border-white/5 relative" />
            </div>
          ))}

          {/* Current Time Indicator */}
          <div 
            className="absolute left-10 right-0 flex items-center z-20"
            style={{ top: `${currentTimeTop * 60}px` }}
          >
            <div className="w-3 h-3 rounded-full bg-fuchsia-500 border-2 border-fuchsia-400 shadow-[0_0_10px_rgba(236,72,153,0.6)]" />
            <div className="flex-1 h-[2px] bg-gradient-to-r from-fuchsia-500 to-transparent" />
            <span className="text-xs text-fuchsia-400 font-medium ml-2 bg-black px-1">12:30</span>
          </div>

          {/* Meetings Overlay */}
          <div className="absolute left-12 right-0 top-0">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="absolute left-0 right-2"
                style={{
                  top: `${meeting.top * 60 + 4}px`,
                  height: `${meeting.duration * 60 - 8}px`,
                }}
              >
                {meeting.type === "focus" ? (
                  // Deep Work Block - Special styling
                  <div className="h-full bg-[#0f0f13] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 border-t-white/20 rounded-2xl p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">{meeting.title}</span>
                      </div>
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-8">{meeting.timeRange}</p>
                    {meeting.tags && (
                      <div className="flex gap-2 mt-auto">
                        {meeting.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-3 py-1 text-xs bg-[#1a1a1f] border border-white/10 rounded-full text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : meeting.type === "toggle" ? (
                  // Toggle meeting card
                  <div className="h-full bg-[#0f0f13] bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl overflow-hidden border border-white/5 border-t-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex">
                    <div className={`w-1 bg-gradient-to-b ${meeting.accentColor}`} />
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{meeting.title}</p>
                        <p className="text-xs text-gray-400">{meeting.timeRange} • {meeting.subtitle}</p>
                      </div>
                      <button 
                        onClick={() => handleToggle(meeting.id)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 ${
                          toggleStates[meeting.id] 
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500" 
                            : "bg-gray-700"
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          toggleStates[meeting.id] ? "translate-x-5" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Standard meeting card
                  <div className="h-full bg-[#0f0f13] bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl overflow-hidden border border-white/5 border-t-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex">
                    <div className={`w-1 bg-gradient-to-b ${meeting.accentColor}`} />
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{meeting.title}</p>
                        <p className="text-xs text-gray-400">
                          {meeting.timeRight ? "" : meeting.timeRange}
                          {meeting.subtitle && ` • ${meeting.subtitle}`}
                        </p>
                      </div>
                      {meeting.timeRight && (
                        <span className="text-xs text-gray-400">{meeting.timeRight}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

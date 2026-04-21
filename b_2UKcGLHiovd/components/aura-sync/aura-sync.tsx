"use client"

import { useState } from "react"
import { MessageSquare, CalendarDays, User, Settings, LogOut } from "lucide-react"
import { ChatScreen } from "./chat-screen"
import { CalendarScreen } from "./calendar-screen"
import { RecommendationSheet } from "./recommendation-sheet"
import { LoginScreen } from "./login-screen"

export function AuraSync() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "calendar">("chat")
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto h-screen relative overflow-hidden bg-slate-950 text-white">
        {/* Ambient Glow Background - Fuchsia/Purple */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto h-screen relative overflow-hidden bg-slate-950 text-white">
      {/* Ambient Glow Background - Fuchsia/Purple */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-30 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Aura Sync
          </h1>
          <div className="relative">
            {/* Glassmorphic Profile Button */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/15 transition-all shadow-lg shadow-fuchsia-500/10"
            >
              <span className="text-sm font-semibold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">JS</span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)} 
                />
                <div className="absolute right-0 top-12 w-56 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                        <span className="text-sm font-semibold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">JS</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">John Smith</p>
                        <p className="text-xs text-gray-400">john@example.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Settings</span>
                    </button>
                    <div className="my-2 border-t border-white/10" />
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false)
                        setIsLoggedIn(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 h-full pt-16">
        {activeTab === "chat" ? (
          <ChatScreen onShowRecommendations={() => setShowRecommendations(true)} />
        ) : (
          <CalendarScreen />
        )}
      </main>

      {/* Recommendation Bottom Sheet */}
      <RecommendationSheet
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              activeTab === "chat" ? "text-fuchsia-400" : "text-gray-500"
            }`}
          >
            <MessageSquare
              className={`w-6 h-6 ${activeTab === "chat" ? "drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" : ""}`}
            />
            <span className="text-xs font-medium">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              activeTab === "calendar" ? "text-fuchsia-400" : "text-gray-500"
            }`}
          >
            <CalendarDays
              className={`w-6 h-6 ${activeTab === "calendar" ? "drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" : ""}`}
            />
            <span className="text-xs font-medium">Calendar</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

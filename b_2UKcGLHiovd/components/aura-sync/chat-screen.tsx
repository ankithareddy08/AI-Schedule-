"use client"

import { Send, Sparkles } from "lucide-react"
import { useState } from "react"

interface Message {
  id: number
  type: "user" | "ai"
  text: string
}

interface ChatScreenProps {
  onShowRecommendations: () => void
}

export function ChatScreen({ onShowRecommendations }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "user", text: "Schedule a team sync for tomorrow." },
    { id: 2, type: "ai", text: "Looking at your calendar for tomorrow... I found 3 optimal time slots that work for everyone. Let me show you the best options based on focus time and availability." },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    const newMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: input,
    }
    setMessages([...messages, newMessage])
    setInput("")
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: "ai",
        text: "I've analyzed your request and found some great options. Let me show you the top recommendations."
      }])
      setTimeout(() => {
        onShowRecommendations()
      }, 500)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "ai" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-lg shadow-fuchsia-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="max-w-[80%]">
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-fuchsia-500/20"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 text-white"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              {/* Show recommendations button on last AI message */}
              {message.type === "ai" && index === messages.length - 1 && (
                <button
                  onClick={onShowRecommendations}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl text-fuchsia-400 text-sm font-medium hover:from-fuchsia-500/30 hover:to-purple-500/30 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  View Recommendations
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-20">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Aura to schedule..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/25"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { BrainCircuit, CalendarRange, ShieldCheck } from "lucide-react"

import type { UserProfile } from "@/lib/types"


interface LoginScreenProps {
  users: UserProfile[]
  isLoading: boolean
  onSelectUser: (user: UserProfile) => void
}

export function LoginScreen({ users, isLoading, onSelectUser }: LoginScreenProps) {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-fuchsia-950/20 backdrop-blur-xl">
            <div className="mb-8 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
              AI Schedule
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              LLM intent parsing, ML slot ranking, and human confirmation in one scheduler.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              The Vercel design is now wired to the synthetic dataset so we can log in as a user, parse a natural language request, rank time slots with the trained model, and preview rescheduling recommendations before any action is taken.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <BrainCircuit className="h-5 w-5 text-fuchsia-300" />
                <p className="mt-3 text-sm font-medium text-white">LLM Boundary</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">Only extracts duration, participants, urgency, and hard constraints.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-sm font-medium text-white">ML Runtime</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">Scores live candidate slots with calendar context, focus, and runway.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="mt-3 text-sm font-medium text-white">Human In Loop</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">Recommendations always require confirmation before scheduling.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Select demo user</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Use the dataset as your login source</h2>
              <p className="mt-2 text-sm text-slate-400">Each profile loads the user's calendar history, focus behavior, and DND preferences from `user_profiles.json`.</p>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Loading users from the dataset...
                </div>
              ) : null}

              {!isLoading &&
                users.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => onSelectUser(user)}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">{user.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{user.preferredTime} preference</p>
                        <p className="mt-3 text-sm text-slate-300">
                          Avg meetings/day {user.avgMeetingsPerDay.toFixed(1)} | preferred duration {user.preferredDuration} min
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
                        <p className="text-xs text-slate-500">DND</p>
                        <p className="text-sm font-medium text-white">
                          {user.doNotDisturbStart ?? "--:--"} to {user.doNotDisturbEnd ?? "--:--"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

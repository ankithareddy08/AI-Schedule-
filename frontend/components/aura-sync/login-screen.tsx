"use client"

import Image from "next/image"

import type { UserProfile } from "@/lib/types"


interface LoginScreenProps {
  users: UserProfile[]
  isLoading: boolean
  onSelectUser: (user: UserProfile) => void
}

export function LoginScreen({ users, isLoading, onSelectUser }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-12">
      {/* Logo */}
      <div
        style={{
          position: 'relative',
          width: 96, height: 96, borderRadius: 22,
          border: '2px solid #22d3ee',
          overflow: 'hidden', marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <Image
          src="/app-logo.jpg"
          alt="Aura Sync"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Aura Sync</h1>
      <p style={{ fontSize: 16, color: '#22d3ee', marginBottom: 40 }}>AI-powered scheduling</p>

      {/* Profile card */}
      <div className="m-card w-full max-w-sm p-6">
        <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', textAlign: 'center', marginBottom: 20 }}>
          Choose Profile
        </p>

        {isLoading && (
          <p style={{ color: '#22d3ee', textAlign: 'center', padding: '20px 0' }}>
            Loading profiles...
          </p>
        )}

        {!isLoading && users.length === 0 && (
          <p style={{ color: '#ef4444', textAlign: 'center', padding: '20px 0', fontSize: 14 }}>
            No profiles found. Is the server running?
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map((user) => (
            <button key={user.userId} className="m-btn" onClick={() => onSelectUser(user)}>
              <span style={{ color: '#ccc', fontWeight: 700, fontSize: 16 }}>
                Login as {user.name}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

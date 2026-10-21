"use client"

import * as React from "react"

import { applySession, can as canNow, currentUser, defaultUserId, signInUsers } from "@/lib/session"

type SessionValue = { userId: string; user: typeof currentUser; can: (permission: string) => boolean; signInAs: (userId: string) => void; signOut: () => void }
const SessionContext = React.createContext<SessionValue | null>(null)
const storageKey = "session"

// Remembers who is signed in (in this browser) so a refresh keeps the same person.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState(defaultUserId)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored && signInUsers.some((user) => user.id === stored)) { applySession(stored); setUserId(stored) }
    } catch {}
  }, [])

  const signInAs = React.useCallback((id: string) => {
    applySession(id)
    setUserId(id)
    try { localStorage.setItem(storageKey, id) } catch {}
  }, [])
  const signOut = React.useCallback(() => {
    applySession(defaultUserId)
    setUserId(defaultUserId)
    try { localStorage.removeItem(storageKey) } catch {}
  }, [])

  const value = React.useMemo(() => ({ userId, user: currentUser, can: canNow, signInAs, signOut }), [userId, signInAs, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = React.useContext(SessionContext)
  if (!context) throw new Error("useSession must be used within SessionProvider")
  return context
}

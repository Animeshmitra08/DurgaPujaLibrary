import { createContext, useContext } from 'react'

/**
 * `checking`: first probe in flight · `waking`: the host was asleep and is booting ·
 * `online`: health check passed · `offline`: gave up waiting.
 */
export type ServerStatus = 'checking' | 'waking' | 'online' | 'offline'

export type ServerValue = {
  status: ServerStatus
  /** When the current wake-up began (epoch ms), for the elapsed timer. */
  wakingSince: number | null
  /** When the server process last started (epoch ms), worked out from its uptime. */
  upSince: number | null
  /** The last wake-up this tab waited through. */
  lastWake: { at: number; tookMs: number } | null
  /** Probes the server now, waking it if needed. No-op while a probe is already running. */
  wake: () => void
}

export const ServerContext = createContext<ServerValue | null>(null)

export function useServer() {
  const value = useContext(ServerContext)
  if (!value) throw new Error('useServer must be used inside <ServerProvider>')
  return value
}

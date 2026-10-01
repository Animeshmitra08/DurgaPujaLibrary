/**
 * Likes and play counts belong to the listener, not the file, and the storage
 * API has no fields for them — so they stay in localStorage, keyed by file id.
 */
import type { Track } from '../types'

const KEY = 'dpl.catalogue.v1'

export type ListenerState = Partial<Pick<Track, 'liked' | 'playCount'>>

export function loadListenerState(): Record<string, ListenerState> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, ListenerState>) : {}
  } catch {
    return {}
  }
}

export function saveListenerState(id: string, state: ListenerState): void {
  const all = loadListenerState()
  all[id] = state
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* Quota or private mode — playback still works, it just will not persist. */
  }
}

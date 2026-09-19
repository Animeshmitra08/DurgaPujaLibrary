/**
 * Bundled tracks are files on disk, so only the parts a listener can change —
 * likes, play counts and retagged metadata — need persisting. They go to
 * localStorage; IndexedDB is reserved for upload blobs.
 */
import type { Track } from '../types'

const KEY = 'dpl.bundled.v1'

export type BundledOverride = Partial<
  Pick<Track, 'title' | 'artist' | 'album' | 'genre' | 'year' | 'liked' | 'playCount'>
>

export function loadBundledState(): Record<string, BundledOverride> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, BundledOverride>) : {}
  } catch {
    return {}
  }
}

export function saveBundledState(state: Record<string, BundledOverride>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Quota or private mode — playback still works, it just will not persist. */
  }
}

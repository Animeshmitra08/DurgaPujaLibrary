import { createContext, useContext } from 'react'
import type { RepeatMode, Track } from '../types'

export type PlayerValue = {
  current: Track | undefined
  queue: Track[]
  /** queue entries in playback order, paired with their position in the order list */
  upcoming: Array<{ track: Track; orderPos: number }>
  orderPos: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  rate: number
  /** `forceShuffle` overrides the current shuffle flag for this one call. */
  playTracks: (tracks: Track[], startIndex: number, forceShuffle?: boolean) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  nudge: (delta: number) => void
  setVolume: (value: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setRate: (value: number) => void
  playNext: (track: Track) => void
  addToQueue: (track: Track) => void
  jumpTo: (orderPos: number) => void
  removeAt: (orderPos: number) => void
  clearQueue: () => void
}

export const PlayerContext = createContext<PlayerValue | null>(null)

export function usePlayer() {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return value
}

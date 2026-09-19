import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RepeatMode, Track } from '../types'
import { useLibrary } from './libraryStore'
import { PlayerContext, type PlayerValue } from './playerStore'

const PREFS_KEY = 'dpl.player.prefs.v1'

type Prefs = { volume: number; shuffle: boolean; repeat: RepeatMode; rate: number }

function loadPrefs(): Prefs {
  const fallback: Prefs = { volume: 0.8, shuffle: false, repeat: 'off', rate: 1 }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Prefs>) } : fallback
  } catch {
    return fallback
  }
}

function buildOrder(length: number, shuffle: boolean, first?: number): number[] {
  const order = Array.from({ length }, (_, i) => i)
  if (!shuffle) return order
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (first != null) {
    const at = order.indexOf(first)
    if (at > 0) [order[0], order[at]] = [order[at], order[0]]
  }
  return order
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { registerPlay } = useLibrary()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [prefs] = useState(loadPrefs)

  const [queue, setQueue] = useState<Track[]>([])
  const [order, setOrder] = useState<number[]>([])
  const [orderPos, setOrderPos] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(prefs.volume)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(prefs.shuffle)
  const [repeat, setRepeat] = useState<RepeatMode>(prefs.repeat)
  const [rate, setRateState] = useState(prefs.rate)

  const current = queue[order[orderPos]]
  const currentId = current?.id
  const currentSrc = current?.url

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ volume, shuffle, repeat, rate }))
  }, [volume, shuffle, repeat, rate])

  // Load the source whenever the track identity changes. Bundled tracks point
  // at a hashed asset URL, uploads at an object URL — either way it is ready.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSrc) return
    if (audio.src !== currentSrc) {
      audio.src = currentSrc
      audio.load()
    }
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
    // Re-running on isPlaying would fight the play/pause effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, currentSrc])

  // Keep the element in sync with declarative playback state.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [isPlaying, currentId, current])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
      audio.muted = muted
      audio.playbackRate = rate
    }
  }, [volume, muted, rate])

  useEffect(() => {
    if (currentId) registerPlay(currentId)
  }, [currentId, registerPlay])

  const advance = useCallback(
    (auto: boolean) => {
      const audio = audioRef.current
      if (auto && repeat === 'one' && audio) {
        audio.currentTime = 0
        void audio.play().catch(() => setIsPlaying(false))
        return
      }
      if (orderPos + 1 < order.length) {
        setOrderPos(orderPos + 1)
      } else if (repeat === 'all' || !auto) {
        setOrderPos(0)
      } else {
        setIsPlaying(false)
      }
    },
    [order.length, orderPos, repeat],
  )

  const next = useCallback(() => advance(false), [advance])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    setOrderPos((pos) => (pos > 0 ? pos - 1 : Math.max(0, order.length - 1)))
  }, [order.length])

  const playTracks = useCallback(
    (tracks: Track[], startIndex: number, forceShuffle?: boolean) => {
      if (tracks.length === 0) return
      // `forceShuffle` lets "Shuffle all" take effect immediately instead of
      // waiting a render for the shuffle flag to settle.
      const useShuffle = forceShuffle ?? shuffle
      if (forceShuffle != null && forceShuffle !== shuffle) setShuffle(forceShuffle)
      const nextOrder = buildOrder(tracks.length, useShuffle, startIndex)
      setQueue(tracks)
      setOrder(nextOrder)
      setOrderPos(useShuffle ? 0 : Math.max(0, nextOrder.indexOf(startIndex)))
      setCurrentTime(0)
      setIsPlaying(true)
    },
    [shuffle],
  )

  const toggle = useCallback(() => {
    if (!current) return
    setIsPlaying((playing) => !playing)
  }, [current])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = seconds
    setCurrentTime(seconds)
  }, [])

  const nudge = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio) return
      seek(Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta)))
    },
    [seek],
  )

  const setVolume = useCallback((value: number) => {
    setVolumeState(value)
    if (value > 0) setMuted(false)
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  const toggleShuffle = useCallback(() => {
    const nowOn = !shuffle
    // Rebuild the play order around whatever is playing so it stays put.
    const currentIndex = order[orderPos] ?? 0
    const rebuilt = buildOrder(queue.length, nowOn, currentIndex)
    setShuffle(nowOn)
    setOrder(rebuilt)
    setOrderPos(nowOn ? 0 : Math.max(0, rebuilt.indexOf(currentIndex)))
  }, [shuffle, order, orderPos, queue.length])

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'))
  }, [])

  const setRate = useCallback((value: number) => setRateState(value), [])

  const enqueue = useCallback(
    (track: Track, immediate: boolean) => {
      const index = queue.length
      setQueue([...queue, track])
      if (order.length === 0) {
        // Nothing playing yet — this becomes the current track.
        setOrder([index])
        setOrderPos(0)
        setIsPlaying(true)
        return
      }
      const nextOrder = [...order]
      nextOrder.splice(immediate ? orderPos + 1 : nextOrder.length, 0, index)
      setOrder(nextOrder)
    },
    [queue, order, orderPos],
  )

  const playNext = useCallback((track: Track) => enqueue(track, true), [enqueue])
  const addToQueue = useCallback((track: Track) => enqueue(track, false), [enqueue])

  const jumpTo = useCallback((pos: number) => {
    setOrderPos(pos)
    setIsPlaying(true)
  }, [])

  const removeAt = useCallback(
    (pos: number) => {
      if (pos === orderPos) return
      setOrder((prevOrder) => prevOrder.filter((_, i) => i !== pos))
      if (pos < orderPos) setOrderPos((p) => p - 1)
    },
    [orderPos],
  )

  const clearQueue = useCallback(() => {
    // Keep the playing track, drop everything after it.
    setOrder((prevOrder) => prevOrder.slice(0, orderPos + 1))
  }, [orderPos])

  // Keyboard shortcuts, ignored while typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      switch (event.key) {
        case ' ':
          event.preventDefault()
          toggle()
          break
        case 'ArrowRight':
          if (event.shiftKey) next()
          else nudge(5)
          break
        case 'ArrowLeft':
          if (event.shiftKey) prev()
          else nudge(-5)
          break
        case 'ArrowUp':
          event.preventDefault()
          setVolume(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          event.preventDefault()
          setVolume(Math.max(0, volume - 0.05))
          break
        case 'm':
          toggleMute()
          break
        case 's':
          toggleShuffle()
          break
        case 'r':
          cycleRepeat()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, next, prev, nudge, setVolume, volume, toggleMute, toggleShuffle, cycleRepeat])

  // OS-level media keys / lock-screen controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: current.coverUrl ? [{ src: current.coverUrl }] : [],
    })
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    const handlers: Array<[MediaSessionAction, () => void]> = [
      ['play', () => setIsPlaying(true)],
      ['pause', () => setIsPlaying(false)],
      ['previoustrack', prev],
      ['nexttrack', next],
    ]
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        /* unsupported action */
      }
    }
  }, [current, isPlaying, next, prev])

  const upcoming = useMemo(
    () =>
      order
        .map((queueIndex, pos) => ({ track: queue[queueIndex], orderPos: pos }))
        .filter((entry): entry is { track: Track; orderPos: number } => Boolean(entry.track)),
    [order, queue],
  )

  const value = useMemo<PlayerValue>(
    () => ({
      current,
      queue,
      upcoming,
      orderPos,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      rate,
      playTracks,
      toggle,
      next,
      prev,
      seek,
      nudge,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      setRate,
      playNext,
      addToQueue,
      jumpTo,
      removeAt,
      clearQueue,
    }),
    [
      current, queue, upcoming, orderPos, isPlaying, currentTime, duration, volume, muted,
      shuffle, repeat, rate, playTracks, toggle, next, prev, seek, nudge, setVolume,
      toggleMute, toggleShuffle, cycleRepeat, setRate, playNext, addToQueue, jumpTo,
      removeAt, clearQueue,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => advance(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  )
}

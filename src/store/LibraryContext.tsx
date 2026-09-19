import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { StoredTrack, Track } from '../types'
import * as db from '../lib/db'
import { bundledAudio, durgaImageFor, shuffledArtwork } from '../lib/assets'
import { probeDuration } from '../lib/audioMeta'
import { loadBundledState, saveBundledState } from '../lib/bundledState'
import { parseFilename } from '../lib/format'
import { LibraryContext, type LibraryValue, type UploadDraft } from './libraryStore'

/** Left behind by the builds that seeded synthesised clips into IndexedDB. */
const LEGACY_SEED_FLAG = 'dpl.seeded.v1'

/** Fixed, so the shipped catalogue keeps a stable order and sorts below uploads. */
const BUNDLED_EPOCH = Date.UTC(2025, 0, 1)

const byNewest = (list: Track[]) => [...list].sort((a, b) => b.createdAt - a.createdAt)

/** Folds in whatever lengths have been measured so far, in either arrival order. */
const withDurations = (list: Track[], measured: Map<string, number>) =>
  list.map((track) => {
    const duration = measured.get(track.id)
    return duration && !track.duration ? { ...track, duration } : track
  })

/** The shipped catalogue, with each file dealt a random Durga image. */
function buildBundled(): Track[] {
  const audio = bundledAudio()
  const artwork = shuffledArtwork(audio.length)
  const saved = loadBundledState()
  return audio.map(({ id, url, ...meta }, i) => ({
    ...meta,
    id,
    url,
    duration: 0,
    kind: 'bundled' as const,
    coverUrl: artwork[i],
    backdropUrl: artwork[i],
    liked: false,
    playCount: 0,
    createdAt: BUNDLED_EPOCH + i * 1000,
    ...saved[id],
  }))
}

function hydrate(stored: StoredTrack): Track {
  const { audio, cover, ...rest } = stored
  return {
    ...rest,
    url: audio ? URL.createObjectURL(audio) : undefined,
    coverUrl: cover ? URL.createObjectURL(cover) : undefined,
    backdropUrl: durgaImageFor(stored.id),
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  // Upload blobs live in IndexedDB; this only mirrors them for reads during updates.
  const blobCache = useRef(new Map<string, { audio?: Blob; cover?: Blob }>())
  // Bundled lengths arrive from the network and can land either side of the
  // IndexedDB read, so they are kept here and folded into both updates.
  const measured = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false
    const bundled = buildBundled()

    ;(async () => {
      try {
        const stored = await db.getAllTracks()
        // Earlier builds stored synthesised "demo" audio in IndexedDB. The
        // catalogue now ships as real files under src/assets, so drop them.
        const legacy = stored.filter((item) => item.kind !== 'upload')
        await Promise.all(legacy.map((item) => db.deleteTrack(item.id)))
        localStorage.removeItem(LEGACY_SEED_FLAG)

        if (cancelled) return
        const uploads = stored.filter((item) => item.kind === 'upload')
        for (const item of uploads) {
          blobCache.current.set(item.id, { audio: item.audio, cover: item.cover })
        }
        setTracks(byNewest(withDurations([...bundled, ...uploads.map(hydrate)], measured.current)))
      } catch (error) {
        console.error('Failed to load uploads', error)
        // The shipped catalogue does not need IndexedDB, so still show it.
        if (!cancelled) setTracks(byNewest(withDurations(bundled, measured.current)))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    // Lengths are unknown until each file's metadata arrives over the network.
    for (const track of bundled) {
      void probeDuration(track.url ?? '').then((duration) => {
        if (cancelled || !duration) return
        measured.current.set(track.id, duration)
        setTracks((prev) => withDurations(prev, measured.current))
      })
    }

    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (track: Track) => {
    if (track.kind === 'bundled') {
      // Only the mutable parts are saved — the file itself is on disk.
      const state = loadBundledState()
      state[track.id] = {
        title: track.title,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        year: track.year,
        liked: track.liked,
        playCount: track.playCount,
      }
      saveBundledState(state)
      return
    }
    const blobs = blobCache.current.get(track.id) ?? {}
    const stored: StoredTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      year: track.year,
      duration: track.duration,
      kind: track.kind,
      liked: track.liked,
      playCount: track.playCount,
      createdAt: track.createdAt,
      audio: blobs.audio,
      cover: blobs.cover,
    }
    await db.putTrack(stored)
  }, [])

  const addUploads = useCallback(async (drafts: UploadDraft[]) => {
    const created: Track[] = []
    for (const draft of drafts) {
      const id = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      const stored: StoredTrack = {
        id,
        title: draft.title.trim() || parseFilename(draft.file.name).title,
        artist: draft.artist.trim() || 'Unknown artist',
        album: draft.album.trim() || 'Singles',
        genre: draft.genre.trim() || 'Uncategorised',
        year: draft.year.trim(),
        duration: draft.duration,
        kind: 'upload',
        liked: false,
        playCount: 0,
        createdAt: Date.now(),
        audio: draft.file,
        cover: draft.cover,
      }
      await db.putTrack(stored)
      blobCache.current.set(id, { audio: stored.audio, cover: stored.cover })
      created.push(hydrate(stored))
    }
    setTracks((prev) => byNewest([...created, ...prev]))
  }, [])

  const updateTrack = useCallback(
    async (id: string, patch: Partial<Track>, coverFile?: File) => {
      // Create the replacement URL outside the updater — updaters run twice
      // under StrictMode and would otherwise leak one URL per edit.
      let nextCoverUrl: string | undefined
      if (coverFile) {
        nextCoverUrl = URL.createObjectURL(coverFile)
        const blobs = blobCache.current.get(id) ?? {}
        blobCache.current.set(id, { ...blobs, cover: coverFile })
      }
      let next: Track | undefined
      setTracks((prev) =>
        prev.map((track) => {
          if (track.id !== id) return track
          if (nextCoverUrl && track.coverUrl) URL.revokeObjectURL(track.coverUrl)
          next = { ...track, ...patch, coverUrl: nextCoverUrl ?? track.coverUrl }
          return next
        }),
      )
      if (next) await persist(next)
    },
    [persist],
  )

  const removeTrack = useCallback(async (id: string) => {
    let dropped = false
    setTracks((prev) => {
      const target = prev.find((track) => track.id === id)
      // Bundled tracks are files in the build — there is nothing to delete.
      if (!target || target.kind === 'bundled') return prev
      if (target.url) URL.revokeObjectURL(target.url)
      if (target.coverUrl) URL.revokeObjectURL(target.coverUrl)
      dropped = true
      return prev.filter((track) => track.id !== id)
    })
    if (!dropped) return
    blobCache.current.delete(id)
    await db.deleteTrack(id)
  }, [])

  const toggleLike = useCallback(
    (id: string) => {
      let next: Track | undefined
      setTracks((prev) =>
        prev.map((track) => {
          if (track.id !== id) return track
          next = { ...track, liked: !track.liked }
          return next
        }),
      )
      if (next) void persist(next)
    },
    [persist],
  )

  const registerPlay = useCallback(
    (id: string) => {
      let next: Track | undefined
      setTracks((prev) =>
        prev.map((track) => {
          if (track.id !== id) return track
          next = { ...track, playCount: track.playCount + 1 }
          return next
        }),
      )
      if (next) void persist(next)
    },
    [persist],
  )

  const value = useMemo<LibraryValue>(
    () => ({ tracks, loading, addUploads, updateTrack, removeTrack, toggleLike, registerPlay }),
    [tracks, loading, addUploads, updateTrack, removeTrack, toggleLike, registerPlay],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

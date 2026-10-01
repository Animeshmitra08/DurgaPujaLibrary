import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Track } from '../types'
import { deleteFile, syncDrive, uploadFile, type DriveFolder } from '../lib/api'
import { fetchCatalogue, shuffledArtwork, toTrack, type DriveImage } from '../lib/assets'
import { probeDuration } from '../lib/audioMeta'
import { loadListenerState, saveListenerState } from '../lib/catalogueState'
import { LibraryContext, type LibraryValue } from './libraryStore'
import { useServer } from './serverStore'

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [images, setImages] = useState<DriveImage[]>([])
  const [loading, setLoading] = useState(true)
  // Track ids whose length has been asked for, so a reload only probes new files.
  const probed = useRef(new Set<string>())

  /** Lengths are unknown until each file's metadata arrives over the network. */
  const probeDurations = useCallback((list: Track[]) => {
    for (const track of list) {
      if (probed.current.has(track.id)) continue
      probed.current.add(track.id)
      void probeDuration(track.url ?? '').then((duration) => {
        if (!duration) return
        setTracks((prev) => prev.map((item) => (item.id === track.id ? { ...item, duration } : item)))
      })
    }
  }, [])

  /** Fetches both Drive folders. Tracks already on screen keep their artwork, length and likes. */
  const reload = useCallback(
    async (signal?: AbortSignal) => {
      const catalogue = await fetchCatalogue(signal)
      if (signal?.aborted) return

      const urls = catalogue.images.map((image) => image.url)
      const artwork = shuffledArtwork(urls, catalogue.audio.length)
      const saved = loadListenerState()
      const fresh = catalogue.audio.map((file, i) => ({ ...toTrack(file, artwork[i]), ...saved[file._id] }))

      setImages(catalogue.images)
      setTracks((prev) => {
        const known = new Map(prev.map((track) => [track.id, track]))
        return fresh.map((track) => {
          const old = known.get(track.id)
          if (!old) return track
          // Re-deal the artwork only if its image was deleted from Drive.
          return old.coverUrl && !urls.includes(old.coverUrl)
            ? { ...old, coverUrl: track.coverUrl, backdropUrl: track.backdropUrl }
            : old
        })
      })
      probeDurations(fresh)
    },
    [probeDurations],
  )

  // A sleeping server would only time out, so wait for it — and refetch each time it wakes.
  const online = useServer().status === 'online'

  useEffect(() => {
    if (!online) return
    const controller = new AbortController()
    const { signal } = controller

    ;(async () => {
      try {
        await reload(signal)
      } catch (error) {
        if (!signal.aborted) console.error('Failed to load the library from the storage API', error)
      }
      if (!signal.aborted) setLoading(false)
    })()

    return () => controller.abort()
  }, [online, reload])

  const upload = useCallback(
    async (file: File, folder: DriveFolder, title?: string) => {
      await uploadFile(file, folder, title)
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (fileId: string) => {
      await deleteFile(fileId)
      await reload()
    },
    [reload],
  )

  const sync = useCallback(async () => {
    const report = await syncDrive()
    await reload()
    return report
  }, [reload])

  const toggleLike = useCallback((id: string) => {
    let next: Track | undefined
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== id) return track
        next = { ...track, liked: !track.liked }
        return next
      }),
    )
    if (next) saveListenerState(id, { liked: next.liked, playCount: next.playCount })
  }, [])

  const registerPlay = useCallback((id: string) => {
    let next: Track | undefined
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== id) return track
        next = { ...track, playCount: track.playCount + 1 }
        return next
      }),
    )
    if (next) saveListenerState(id, { liked: next.liked, playCount: next.playCount })
  }, [])

  const value = useMemo<LibraryValue>(
    () => ({ tracks, images, loading, upload, remove, sync, toggleLike, registerPlay }),
    [tracks, images, loading, upload, remove, sync, toggleLike, registerPlay],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

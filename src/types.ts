/** `bundled` ships with the app from src/assets; `upload` is added by the admin. */
export type TrackKind = 'bundled' | 'upload'

export type Track = {
  id: string
  title: string
  artist: string
  album: string
  genre: string
  year: string
  /** seconds — 0 until the file's metadata has been read */
  duration: number
  kind: TrackKind
  /** bundled asset URL, or an object URL for uploads */
  url?: string
  coverUrl?: string
  /** Durga image shown behind the now-playing view */
  backdropUrl?: string
  liked: boolean
  playCount: number
  createdAt: number
}

/** Shape persisted in IndexedDB — uploads only, blobs instead of object URLs. */
export type StoredTrack = Omit<Track, 'url' | 'coverUrl' | 'backdropUrl'> & {
  audio?: Blob
  cover?: Blob
}

export type RepeatMode = 'off' | 'all' | 'one'

export type ViewId = 'library' | 'liked' | 'recent' | 'admin'

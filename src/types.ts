/** An audio file in the Drive `audios` folder. */
export type Track = {
  /** the storage API file id */
  id: string
  title: string
  artist: string
  album: string
  genre: string
  year: string
  /** seconds — 0 until the file's metadata has been read */
  duration: number
  /** storage API stream URL */
  url?: string
  coverUrl?: string
  /** Durga image shown behind the now-playing view */
  backdropUrl?: string
  liked: boolean
  playCount: number
  createdAt: number
}

export type RepeatMode = 'off' | 'all' | 'one'

export type ViewId = 'library' | 'liked' | 'recent' | 'admin'

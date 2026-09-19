import { createContext, useContext } from 'react'
import type { Track } from '../types'

export type UploadDraft = {
  file: File
  title: string
  artist: string
  album: string
  genre: string
  year: string
  duration: number
  cover?: File
}

export type LibraryValue = {
  tracks: Track[]
  loading: boolean
  addUploads: (drafts: UploadDraft[]) => Promise<void>
  updateTrack: (id: string, patch: Partial<Track>, coverFile?: File) => Promise<void>
  removeTrack: (id: string) => Promise<void>
  toggleLike: (id: string) => void
  registerPlay: (id: string) => void
}

export const LibraryContext = createContext<LibraryValue | null>(null)

export function useLibrary() {
  const value = useContext(LibraryContext)
  if (!value) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return value
}

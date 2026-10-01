import { createContext, useContext } from 'react'
import type { DriveFolder, SyncResult } from '../lib/api'
import type { DriveImage } from '../lib/assets'
import type { Track } from '../types'

export type LibraryValue = {
  /** Audio in the Drive `audios` folder. */
  tracks: Track[]
  /** Durga images in the Drive `images` folder, used as artwork. */
  images: DriveImage[]
  loading: boolean
  /** Uploads a file to `audios` or `images`, then reloads the library. */
  upload: (file: File, folder: DriveFolder, title?: string) => Promise<void>
  /** Deletes an audio or image file, then reloads the library. */
  remove: (fileId: string) => Promise<void>
  /** Imports files added straight to the Drive folders, then reloads the library. */
  sync: () => Promise<SyncResult>
  toggleLike: (id: string) => void
  registerPlay: (id: string) => void
}

export const LibraryContext = createContext<LibraryValue | null>(null)

export function useLibrary() {
  const value = useContext(LibraryContext)
  if (!value) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return value
}

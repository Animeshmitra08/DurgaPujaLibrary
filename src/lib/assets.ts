/**
 * The catalogue: whatever is in the Drive `audios` and `images` folders,
 * listed through the storage API. Every URL points at its stream endpoint,
 * so nothing is bundled into the build and nothing is kept in the browser.
 */
import type { Track } from '../types'
import { listFolder, streamUrl, type RemoteFile } from './api'
import { parseFilename } from './format'

export type DriveImage = { id: string; name: string; url: string }

export type Catalogue = { audio: RemoteFile[]; images: DriveImage[] }

export async function fetchCatalogue(signal?: AbortSignal): Promise<Catalogue> {
  const [audio, images] = await Promise.all([listFolder('audios', signal), listFolder('images', signal)])
  return {
    audio,
    images: images.map((file) => ({ id: file._id, name: file.originalName, url: streamUrl(file._id) })),
  }
}

type TrackTags = Pick<Track, 'title' | 'artist' | 'album' | 'genre' | 'year'>

/**
 * Hand-written tags for the known files — their filenames carry release
 * slugs and download-site suffixes that no generic parser should have to guess.
 */
const CURATED: Record<string, TrackTags> = {
  'Dhak Baja Kashor Baja (PenduJatt.dev).mp3': {
    title: 'Dhak Baja Kashor Baja',
    artist: 'Traditional',
    album: 'Agomoni',
    genre: 'Dhak',
    year: '',
  },
  'Dhaker-Taley-Lyrical-Dev-Subhashree-Jeet-Gannguli-Abhijeet-Parinita-Sudipto-SVF-Music.mp3': {
    title: 'Dhaker Taley',
    artist: 'Abhijeet Bhattacharya',
    album: 'Parinita',
    genre: 'Bengali Film',
    year: '2019',
  },
}

/** Tags for a file: the curated list first, otherwise a guess from its title. */
function describe(file: RemoteFile): TrackTags {
  const curated = CURATED[file.originalName]
  if (curated) return curated

  // The API defaults a title to the filename, with or without its extension.
  const cleaned = (file.title || file.originalName)
    .replace(/\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i, '')
    .replace(/\([^)]*\)/g, ' ') // drop "(SomeSite.dev)" style suffixes
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const guess = parseFilename(cleaned)
  return {
    title: guess.title || cleaned,
    artist: guess.artist || 'Traditional',
    album: 'Durga Puja',
    genre: 'Devotional',
    year: '',
  }
}

/** An audio file as a track, with a Durga image as its cover and backdrop. */
export function toTrack(file: RemoteFile, artwork?: string): Track {
  return {
    id: file._id,
    ...describe(file),
    duration: 0,
    url: streamUrl(file._id),
    coverUrl: artwork,
    backdropUrl: artwork,
    liked: false,
    playCount: 0,
    createdAt: Date.parse(file.createdAt) || 0,
  }
}

function shuffled(list: string[]): string[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Deals the Durga images out in a freshly shuffled rotation: every track gets
 * a random picture, no two neighbours repeat while images are left in the bag,
 * and the pairing changes from one visit to the next.
 */
export function shuffledArtwork(images: string[], count: number): Array<string | undefined> {
  if (images.length === 0) return Array.from({ length: count })
  const out: string[] = []
  let bag: string[] = []
  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag = shuffled(images)
    out.push(bag.pop() as string)
  }
  return out
}

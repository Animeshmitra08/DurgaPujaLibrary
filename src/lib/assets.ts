/**
 * The built-in catalogue. Audio and artwork are imported straight out of
 * `src/assets`, so Vite fingerprints and serves them like any other asset —
 * nothing is synthesised at runtime and no audio is copied into IndexedDB.
 *
 * Dropping a new file into either folder is enough to add it to the app.
 */
import { parseFilename } from './format'

const audioUrls = import.meta.glob('../assets/audiofiles/*.{mp3,wav,ogg,m4a,flac,aac,opus}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const imageUrls = import.meta.glob('../assets/durgaImages/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1)

/** Every Durga image, used for covers and the now-playing backdrop. */
export const DURGA_IMAGES: string[] = Object.keys(imageUrls)
  .sort()
  .map((path) => imageUrls[path])

export type BundledMeta = {
  title: string
  artist: string
  album: string
  genre: string
  year: string
}

export type BundledAudio = BundledMeta & {
  id: string
  file: string
  url: string
}

/**
 * Hand-written tags for the shipped files — their filenames carry release
 * slugs and download-site suffixes that no generic parser should have to guess.
 */
const CURATED: Record<string, BundledMeta> = {
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

/** Fallback tags for files that are not in the curated list. */
function describe(file: string): BundledMeta {
  const curated = CURATED[file]
  if (curated) return curated

  const cleaned = file
    .replace(/\.[^.]+$/, '')
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

/** The shipped catalogue, in a stable filename order. */
export function bundledAudio(): BundledAudio[] {
  return Object.keys(audioUrls)
    .sort()
    .map((path) => {
      const file = basename(path)
      return { id: `bundled:${file}`, file, url: audioUrls[path], ...describe(file) }
    })
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
export function shuffledArtwork(count: number): Array<string | undefined> {
  if (DURGA_IMAGES.length === 0) return Array.from({ length: count })
  const out: string[] = []
  let bag: string[] = []
  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag = shuffled(DURGA_IMAGES)
    out.push(bag.pop() as string)
  }
  return out
}

/**
 * Stable pick for ids outside the shuffled rotation (uploads), so an uploaded
 * track keeps the same backdrop for as long as it is in the library.
 */
export function durgaImageFor(id: string): string | undefined {
  if (DURGA_IMAGES.length === 0) return undefined
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return DURGA_IMAGES[Math.abs(hash) % DURGA_IMAGES.length]
}

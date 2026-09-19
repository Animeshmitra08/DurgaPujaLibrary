/** 154 -> "2:34", 3725 -> "1:02:05" */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

export function formatCount(n: number, singular: string): string {
  return `${n} ${singular}${n === 1 ? '' : 's'}`
}

/**
 * Guess title/artist from a filename like "Anjan Dutt - Bela Bose.mp3"
 * or "03. Agomoni.flac".
 */
export function parseFilename(name: string): { title: string; artist: string } {
  const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim()
  const cleaned = base.replace(/^\d{1,3}\s*[-.)]\s*/, '').trim()
  const parts = cleaned.split(/\s+-\s+/)
  if (parts.length >= 2) {
    return { title: parts.slice(1).join(' - ').trim(), artist: parts[0].trim() }
  }
  return { title: cleaned || base, artist: '' }
}

/**
 * Curated saffron/marigold gradient pairs so generated covers stay on-palette
 * and still read as distinct from one another.
 */
const COVER_GRADIENTS: Array<[string, string]> = [
  ['#ff9933', '#8f4e00'],
  ['#fecb00', '#8a5a00'],
  ['#f97316', '#7c2d12'],
  ['#fbbf24', '#713f12'],
  ['#e11d48', '#7f1d3a'],
  ['#b5b48b', '#464626'],
  ['#fb923c', '#9a3412'],
  ['#d97706', '#60603e'],
]

/** Deterministic cover gradient for tracks without artwork. */
export function gradientFor(id: string): [string, string] {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length]
}

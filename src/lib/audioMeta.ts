/** Reads a clip's length from its metadata without handing it to the player. */
export function probeDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0)
    audio.onerror = () => resolve(0)
    audio.src = src
  })
}

/** Same, for a file the admin has picked but not published yet. */
export async function probeFileDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file)
  try {
    return await probeDuration(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

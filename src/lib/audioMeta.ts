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

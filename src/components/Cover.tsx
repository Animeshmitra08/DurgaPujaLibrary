import { gradientFor } from '../lib/format'
import type { Track } from '../types'

type CoverProps = {
  track: Track
  className?: string
  rounded?: string
}

/** Album art when present, otherwise a deterministic gradient + mandala mark. */
export function Cover({ track, className = 'size-12', rounded = 'rounded-xl' }: CoverProps) {
  if (track.coverUrl) {
    return (
      <img
        src={track.coverUrl}
        alt=""
        className={`${className} ${rounded} object-cover shadow-lg shadow-black/40`}
      />
    )
  }
  const [from, to] = gradientFor(track.id)
  return (
    <div
      className={`${className} ${rounded} relative grid place-items-center overflow-hidden shadow-lg shadow-black/40`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-3/5 opacity-70">
        <g fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1.6">
          <circle cx="32" cy="32" r="9" />
          <circle cx="32" cy="32" r="18" strokeDasharray="3 4" />
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="32"
              cy="32"
              rx="5"
              ry="22"
              transform={`rotate(${i * 22.5} 32 32)`}
              opacity="0.45"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

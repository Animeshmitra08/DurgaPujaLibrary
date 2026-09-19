import { Cover } from './Cover'
import { HeartIcon, PauseIcon, PlayIcon, PlusIcon, QueueIcon } from './Icons'
import { formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'
import type { Track } from '../types'

/**
 * Touch screens have no hover, so anything a pointer reveals on hover stays
 * visible below `sm`. Left hidden it is still tappable — invisible controls
 * swallow taps meant for the artwork.
 */
const revealed =
  'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'

export function TrackCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  const { current, isPlaying, toggle, playNext, addToQueue } = usePlayer()
  const { toggleLike } = useLibrary()
  const isCurrent = current?.id === track.id
  const isActive = isCurrent && isPlaying

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-3xl border p-3 transition ${
        isCurrent
          ? 'border-primary bg-primary-container/25 shadow-md'
          : 'border-outline-variant bg-surface-low sm:hover:-translate-y-1 sm:hover:border-outline sm:hover:shadow-lg'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Cover track={track} className="aspect-square w-full" rounded="rounded-2xl" />

        {/* The whole artwork is the play control, so one tap anywhere on it
            starts the track — no hunting for a hover-revealed button. */}
        <button
          type="button"
          onClick={() => (isCurrent ? toggle() : onPlay())}
          className="absolute inset-0 rounded-2xl outline-offset-2 outline-primary focus-visible:outline-2"
          aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
        />

        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-inverse-surface/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-inverse-on-surface backdrop-blur">
          {formatTime(track.duration)}
        </span>

        {/* Play badge — decoration over the tap target, not a control itself. */}
        <span
          className={`pointer-events-none absolute bottom-2 right-2 grid size-12 place-items-center rounded-2xl bg-primary text-on-primary shadow-lg transition ${
            isCurrent
              ? 'opacity-100'
              : `${revealed} sm:translate-y-2 sm:group-hover:translate-y-0 sm:group-focus-within:translate-y-0`
          }`}
        >
          {isActive ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5 translate-x-px" />}
        </span>

        {/* Like comes after the tap target so it keeps its own hit area. */}
        <button
          type="button"
          onClick={() => toggleLike(track.id)}
          className={`absolute right-2 top-2 grid size-9 place-items-center rounded-full backdrop-blur transition ${
            track.liked
              ? 'bg-surface/90 text-error'
              : `bg-surface/70 text-on-surface-variant hover:text-on-surface ${revealed}`
          }`}
          aria-label={track.liked ? `Unlike ${track.title}` : `Like ${track.title}`}
          aria-pressed={track.liked}
        >
          <HeartIcon className="size-4" filled={track.liked} />
        </button>
      </div>

      <div className="min-w-0 px-1">
        <p
          className={`truncate text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-on-surface'}`}
          title={track.title}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-on-surface-variant" title={track.artist}>
          {track.artist}
        </p>
      </div>

      <div className="flex items-center justify-between gap-1 px-1 pb-0.5">
        <span className="truncate text-[11px] text-on-surface-variant/80">{track.album}</span>
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => playNext(track)}
            title="Play next"
            className={`grid size-7 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface ${revealed}`}
            aria-label={`Play ${track.title} next`}
          >
            <PlusIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => addToQueue(track)}
            title="Add to queue"
            className={`grid size-7 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface ${revealed}`}
            aria-label={`Add ${track.title} to queue`}
          >
            <QueueIcon className="size-4" />
          </button>
        </span>
      </div>
    </div>
  )
}

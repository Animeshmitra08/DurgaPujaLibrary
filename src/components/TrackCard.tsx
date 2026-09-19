import { Cover } from './Cover'
import { HeartIcon, PauseIcon, PlayIcon, PlusIcon, QueueIcon } from './Icons'
import { formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'
import type { Track } from '../types'

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
          : 'border-outline-variant bg-surface-low hover:-translate-y-1 hover:border-outline hover:shadow-lg'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Cover track={track} className="aspect-square w-full" rounded="rounded-2xl" />

        {/* Like sits top-right, revealed on hover or when already liked. */}
        <button
          type="button"
          onClick={() => toggleLike(track.id)}
          className={`absolute right-2 top-2 grid size-9 place-items-center rounded-full backdrop-blur transition ${
            track.liked
              ? 'bg-surface/90 text-error'
              : 'bg-surface/70 text-on-surface-variant opacity-0 hover:text-on-surface group-hover:opacity-100 focus-visible:opacity-100'
          }`}
          aria-label={track.liked ? `Unlike ${track.title}` : `Like ${track.title}`}
          aria-pressed={track.liked}
        >
          <HeartIcon className="size-4" filled={track.liked} />
        </button>

        <span className="absolute bottom-2 left-2 rounded-full bg-inverse-surface/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-inverse-on-surface backdrop-blur">
          {formatTime(track.duration)}
        </span>

        {/* Play FAB */}
        <button
          type="button"
          onClick={() => (isCurrent ? toggle() : onPlay())}
          className={`absolute bottom-2 right-2 grid size-12 place-items-center rounded-2xl bg-primary text-on-primary shadow-lg transition ${
            isCurrent
              ? 'opacity-100'
              : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100'
          }`}
          aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {isActive ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5 translate-x-px" />}
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
            className="grid size-7 place-items-center rounded-lg text-on-surface-variant opacity-0 transition hover:bg-surface-high hover:text-on-surface group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Play ${track.title} next`}
          >
            <PlusIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => addToQueue(track)}
            title="Add to queue"
            className="grid size-7 place-items-center rounded-lg text-on-surface-variant opacity-0 transition hover:bg-surface-high hover:text-on-surface group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Add ${track.title} to queue`}
          >
            <QueueIcon className="size-4" />
          </button>
        </span>
      </div>
    </div>
  )
}

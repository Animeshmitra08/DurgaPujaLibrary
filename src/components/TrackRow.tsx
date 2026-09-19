import { Cover } from './Cover'
import { HeartIcon, PauseIcon, PlayIcon, PlusIcon, QueueIcon } from './Icons'
import { formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'
import type { Track } from '../types'

type TrackRowProps = {
  track: Track
  index: number
  onPlay: () => void
}

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[2px]" aria-label="Now playing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{ animation: `eq 900ms ease-in-out ${i * 160}ms infinite`, height: '40%' }}
        />
      ))}
    </span>
  )
}

export function TrackRow({ track, index, onPlay }: TrackRowProps) {
  const { current, isPlaying, toggle, playNext, addToQueue } = usePlayer()
  const { toggleLike } = useLibrary()
  const isCurrent = current?.id === track.id
  const isActive = isCurrent && isPlaying
  const pinButton = isCurrent && !isPlaying

  return (
    <div
      onDoubleClick={onPlay}
      className={`group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-2xl px-2 py-2 transition sm:grid-cols-[2.5rem_minmax(0,2.2fr)_minmax(0,1.4fr)_auto] ${
        isCurrent ? 'bg-primary-container/30 ring-1 ring-primary/40' : 'hover:bg-surface-high'
      }`}
    >
      {/* Index / equalizer sit under an overlaid play button that appears on
          hover — and stays put while the current track is paused. Touch has no
          hover and no double-click, so below `sm` the button is always there. */}
      <div className="relative grid size-10 place-items-center">
        <span
          className={`${pinButton ? 'invisible' : 'invisible sm:visible sm:group-hover:invisible'} ${
            isActive ? '' : 'text-sm tabular-nums text-on-surface-variant'
          }`}
        >
          {isActive ? <Equalizer /> : index + 1}
        </span>
        <button
          type="button"
          onClick={() => (isCurrent ? toggle() : onPlay())}
          className={`absolute inset-0 m-auto size-9 place-items-center rounded-full bg-primary text-on-primary shadow transition hover:opacity-90 ${
            pinButton ? 'grid' : 'grid sm:hidden sm:group-hover:grid'
          }`}
          aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {isActive ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Cover track={track} className="size-11 shrink-0" rounded="rounded-xl" />
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
            {track.title}
          </p>
          <p className="truncate text-xs text-on-surface-variant">{track.artist}</p>
        </div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm text-on-surface-variant">{track.album}</p>
        <p className="truncate text-xs text-on-surface-variant/70">
          {track.genre}
          {track.year ? ` · ${track.year}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => playNext(track)}
          title="Play next"
          className="hidden size-8 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-highest hover:text-on-surface group-hover:grid"
          aria-label={`Play ${track.title} next`}
        >
          <PlusIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => addToQueue(track)}
          title="Add to queue"
          className="hidden size-8 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-highest hover:text-on-surface group-hover:grid"
          aria-label={`Add ${track.title} to queue`}
        >
          <QueueIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => toggleLike(track.id)}
          className={`grid size-8 place-items-center rounded-lg transition hover:bg-surface-highest ${
            track.liked ? 'text-error' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          aria-label={track.liked ? `Unlike ${track.title}` : `Like ${track.title}`}
          aria-pressed={track.liked}
        >
          <HeartIcon className="size-4" filled={track.liked} />
        </button>
        <span className="w-12 text-right text-sm tabular-nums text-on-surface-variant">
          {formatTime(track.duration)}
        </span>
      </div>
    </div>
  )
}

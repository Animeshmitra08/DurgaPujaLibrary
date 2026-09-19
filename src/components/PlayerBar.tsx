import { useState } from 'react'
import { Cover } from './Cover'
import {
  ChevronUpIcon,
  HeartIcon,
  MuteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  SpeedIcon,
  VolumeIcon,
  VolumeLowIcon,
} from './Icons'
import { formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'

const RATES = [0.75, 1, 1.25, 1.5, 2]

const thumbClass =
  '[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary'

type PlayerBarProps = {
  onToggleQueue: () => void
  queueOpen: boolean
  onExpand: () => void
}

export function PlayerBar({ onToggleQueue, queueOpen, onExpand }: PlayerBarProps) {
  const {
    current, isPlaying, currentTime, duration, volume, muted, shuffle, repeat, rate,
    toggle, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat, setRate,
    upcoming, orderPos,
  } = usePlayer()
  const { toggleLike } = useLibrary()
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  const remaining = Math.max(0, upcoming.length - orderPos - 1)

  const total = duration || current?.duration || 0
  const position = scrubbing ?? currentTime
  const progress = total > 0 ? (position / total) * 100 : 0

  const VolumeGlyph = muted || volume === 0 ? MuteIcon : volume < 0.5 ? VolumeLowIcon : VolumeIcon
  const volumeValue = muted ? 0 : volume

  return (
    <footer className="relative isolate border-t border-outline-variant bg-surface-low/95 backdrop-blur-xl">
      {/* A whisper of the track's Durga image tints the bar while it plays. */}
      {current?.backdropUrl && (
        <img
          src={current.backdropUrl}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 size-full object-cover blur-xl transition-opacity duration-700 ${
            isPlaying ? 'opacity-20' : 'opacity-0'
          }`}
        />
      )}

      {/* Progress bar sits flush against the top edge of the bar; the seek
          input above it is deliberately taller than 1px to stay grabbable. */}
      <div className="relative h-1 w-full bg-surface-highest">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={position}
          onChange={(e) => setScrubbing(Number(e.target.value))}
          onPointerUp={() => {
            if (scrubbing != null) seek(scrubbing)
            setScrubbing(null)
          }}
          onKeyUp={() => {
            if (scrubbing != null) seek(scrubbing)
            setScrubbing(null)
          }}
          disabled={!current}
          aria-label="Seek"
          className="absolute -top-1.5 left-0 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-default"
        />
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Now playing */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {current ? (
            <>
              {/* Artwork and title both open the full-screen player. */}
              <button
                type="button"
                onClick={onExpand}
                className="group relative size-12 shrink-0 rounded-xl"
                aria-label="Open full player"
              >
                <Cover track={current} className="size-12" rounded="rounded-xl" />
                <span className="absolute inset-0 grid place-items-center rounded-xl bg-inverse-surface/60 text-inverse-on-surface opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ChevronUpIcon className="size-5" />
                </span>
              </button>
              <button type="button" onClick={onExpand} className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-on-surface hover:underline">
                  {current.title}
                </p>
                <p className="truncate text-xs text-on-surface-variant">{current.artist}</p>
              </button>
              <button
                type="button"
                onClick={() => toggleLike(current.id)}
                className={`ml-1 hidden size-9 place-items-center rounded-full transition hover:bg-surface-high sm:grid ${
                  current.liked ? 'text-error' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label={current.liked ? 'Unlike' : 'Like'}
                aria-pressed={current.liked}
              >
                <HeartIcon className="size-4" filled={current.liked} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl border border-dashed border-outline" />
              <p className="text-sm text-on-surface-variant">Nothing playing</p>
            </div>
          )}
        </div>

        {/* Transport */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              title="Shuffle (S)"
              className={`hidden size-9 place-items-center rounded-full transition hover:bg-surface-high sm:grid ${
                shuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-pressed={shuffle}
              aria-label="Shuffle"
            >
              <ShuffleIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={prev}
              disabled={!current}
              className="grid size-9 place-items-center rounded-full text-on-surface transition hover:bg-surface-high disabled:opacity-30"
              aria-label="Previous track"
            >
              <PrevIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              disabled={!current}
              className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-30"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5 translate-x-px" />}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!current}
              className="grid size-9 place-items-center rounded-full text-on-surface transition hover:bg-surface-high disabled:opacity-30"
              aria-label="Next track"
            >
              <NextIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              title={`Repeat: ${repeat} (R)`}
              className={`hidden size-9 place-items-center rounded-full transition hover:bg-surface-high sm:grid ${
                repeat === 'off' ? 'text-on-surface-variant hover:text-on-surface' : 'text-primary'
              }`}
              aria-label={`Repeat ${repeat}`}
            >
              {repeat === 'one' ? <RepeatOneIcon className="size-4" /> : <RepeatIcon className="size-4" />}
            </button>
          </div>
          <div className="hidden items-center gap-1.5 text-[11px] tabular-nums text-on-surface-variant lg:flex">
            <span>{formatTime(position)}</span>
            <span className="opacity-50">/</span>
            <span>{formatTime(total)}</span>
          </div>
        </div>

        {/* Secondary controls — the queue toggle stays visible at every size. */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden items-center gap-1.5 lg:flex">
            <SpeedIcon className="size-4 text-on-surface-variant" />
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-label="Playback speed"
              className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-xs text-on-surface outline-none transition focus:border-primary"
            >
              {RATES.map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleQueue}
            className={`relative grid size-10 place-items-center rounded-full transition hover:bg-surface-high ${
              queueOpen ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-label="Toggle queue"
            aria-pressed={queueOpen}
          >
            <QueueIcon className="size-4" />
            {remaining > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-on-primary">
                {remaining}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 rounded-full px-2 py-1 lg:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="text-on-surface-variant transition hover:text-on-surface"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              <VolumeGlyph className="size-4" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumeValue}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className={`h-1 w-24 cursor-pointer appearance-none rounded-full ${thumbClass}`}
              style={{
                background: `linear-gradient(to right, var(--color-primary) ${
                  volumeValue * 100
                }%, var(--color-surface-highest) ${volumeValue * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

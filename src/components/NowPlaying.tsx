import { useEffect, useState } from 'react'
import { Cover } from './Cover'
import {
  ChevronDownIcon,
  HeartIcon,
  MuteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeIcon,
  VolumeLowIcon,
} from './Icons'
import { formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'

const RATES = [0.75, 1, 1.25, 1.5, 2]

const ghostButton =
  'grid place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white'

/**
 * Full-screen player. The track's Durga image fills the backdrop — blurred and
 * slowly drifting while the music runs — with the same image as the artwork.
 */
export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    current, isPlaying, currentTime, duration, volume, muted, shuffle, repeat, rate,
    toggle, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat, setRate,
    upcoming, orderPos, jumpTo,
  } = usePlayer()
  const { toggleLike } = useLibrary()
  const [scrubbing, setScrubbing] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !current) return null

  const total = duration || current.duration || 0
  const position = scrubbing ?? currentTime
  const progress = total > 0 ? (position / total) * 100 : 0
  const VolumeGlyph = muted || volume === 0 ? MuteIcon : volume < 0.5 ? VolumeLowIcon : VolumeIcon
  const volumeValue = muted ? 0 : volume
  const rest = upcoming.filter((entry) => entry.orderPos > orderPos).slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#120a04]" role="dialog" aria-modal="true">
      {/* Backdrop — the Durga image assigned to this track. */}
      {current.backdropUrl && (
        <img
          src={current.backdropUrl}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 size-full scale-110 object-cover opacity-55 blur-2xl ${
            isPlaying ? 'animate-[drift_28s_ease-in-out_infinite_alternate]' : ''
          }`}
        />
      )}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/85"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
              Now playing
            </p>
            <p className="text-sm font-medium text-white/85">{current.album}</p>
          </div>
          <button type="button" onClick={onClose} className={`${ghostButton} size-11`} aria-label="Close player">
            <ChevronDownIcon className="size-6" />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-7 py-8">
          <Cover
            track={current}
            className="mx-auto aspect-square w-full max-w-sm"
            rounded="rounded-[2rem]"
          />

          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {current.title}
            </h2>
            <p className="mt-2 text-base text-white/70">{current.artist}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              {[current.genre, current.year, current.kind === 'bundled' ? 'Bundled' : 'Uploaded']
                .filter(Boolean)
                .map((chip) => (
                  <span key={chip} className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                    {chip}
                  </span>
                ))}
            </div>
          </div>

          {/* Scrubber */}
          <div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
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
                aria-label="Seek"
                className="absolute -top-2 left-0 h-6 w-full cursor-pointer appearance-none bg-transparent opacity-0"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-white/60">
              <span>{formatTime(position)}</span>
              <span>-{formatTime(Math.max(0, total - position))}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`${ghostButton} size-11 ${shuffle ? 'bg-white/20 text-white' : ''}`}
              aria-label="Shuffle"
              aria-pressed={shuffle}
            >
              <ShuffleIcon className="size-5" />
            </button>
            <button type="button" onClick={prev} className={`${ghostButton} size-12`} aria-label="Previous track">
              <PrevIcon className="size-7" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="grid size-[4.5rem] place-items-center rounded-full bg-white text-[#3b1f05] shadow-2xl transition hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon className="size-8" /> : <PlayIcon className="size-8 translate-x-0.5" />}
            </button>
            <button type="button" onClick={next} className={`${ghostButton} size-12`} aria-label="Next track">
              <NextIcon className="size-7" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`${ghostButton} size-11 ${repeat === 'off' ? '' : 'bg-white/20 text-white'}`}
              aria-label={`Repeat ${repeat}`}
            >
              {repeat === 'one' ? <RepeatOneIcon className="size-5" /> : <RepeatIcon className="size-5" />}
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => toggleLike(current.id)}
              className={`${ghostButton} size-10 ${current.liked ? 'text-rose-400 hover:text-rose-300' : ''}`}
              aria-label={current.liked ? 'Unlike' : 'Like'}
              aria-pressed={current.liked}
            >
              <HeartIcon className="size-5" filled={current.liked} />
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleMute} className={`${ghostButton} size-10`} aria-label={muted ? 'Unmute' : 'Mute'}>
                <VolumeGlyph className="size-5" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volumeValue}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 w-28 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, #fff ${volumeValue * 100}%, rgba(255,255,255,.25) ${
                    volumeValue * 100
                  }%)`,
                }}
              />
            </div>

            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-label="Playback speed"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white outline-none backdrop-blur transition focus:border-white/60"
            >
              {RATES.map((value) => (
                <option key={value} value={value} className="text-on-surface">
                  {value}×
                </option>
              ))}
            </select>
          </div>
        </div>

        {rest.length > 0 && (
          <section className="pb-2">
            <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Next up</p>
            <ul className="space-y-1">
              {rest.map(({ track, orderPos: pos }) => (
                <li key={`${track.id}-${pos}`}>
                  <button
                    type="button"
                    onClick={() => jumpTo(pos)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/10"
                  >
                    <Cover track={track} className="size-10 shrink-0" rounded="rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{track.title}</span>
                      <span className="block truncate text-xs text-white/60">{track.artist}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-white/60">
                      {formatTime(track.duration)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

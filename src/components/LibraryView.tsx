import { useMemo, useState } from 'react'
import { TrackCard } from './TrackCard'
import { TrackRow } from './TrackRow'
import { Cover } from './Cover'
import { GridIcon, ListIcon, MusicIcon, PlayIcon, ShuffleIcon } from './Icons'
import { Select, type SelectOption } from './Select'
import { formatCount, formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'
import { usePlayer } from '../store/playerStore'
import type { Track, ViewId } from '../types'

type SortKey = 'recent' | 'title' | 'artist' | 'duration' | 'plays'
type Layout = 'grid' | 'list'

const VIEW_META: Record<Exclude<ViewId, 'admin'>, { eyebrow: string; title: string; subtitle: string }> = {
  library: {
    eyebrow: 'Browse',
    title: 'The whole collection',
    subtitle: 'Every song in the Durga Puja library, ready to play.',
  },
  liked: {
    eyebrow: 'Liked',
    title: 'Your favourites',
    subtitle: 'The ones you keep coming back to.',
  },
  recent: {
    eyebrow: 'Recent',
    title: 'Freshly added',
    subtitle: 'The newest arrivals from the admin desk.',
  },
}

const SORT_OPTIONS: SelectOption<SortKey>[] = [
  { value: 'recent', label: 'Recently added', hint: 'Newest first' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'artist', label: 'Artist A–Z' },
  { value: 'duration', label: 'Duration', hint: 'Shortest first' },
  { value: 'plays', label: 'Most played' },
]

export function LibraryView({ view, query }: { view: Exclude<ViewId, 'admin'>; query: string }) {
  const { tracks, loading } = useLibrary()
  const { playTracks } = usePlayer()
  const [sort, setSort] = useState<SortKey>('recent')
  const [genre, setGenre] = useState('All')
  const [layout, setLayout] = useState<Layout>('grid')

  const genreOptions = useMemo<SelectOption<string>[]>(
    () =>
      ['All', ...Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean))).sort()].map(
        (option) => ({ value: option, label: option }),
      ),
    [tracks],
  )

  const scoped = useMemo(() => {
    if (view === 'liked') return tracks.filter((t) => t.liked)
    if (view === 'recent') return [...tracks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 25)
    return tracks
  }, [tracks, view])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = scoped.filter((track) => {
      if (genre !== 'All' && track.genre !== genre) return false
      if (!needle) return true
      return [track.title, track.artist, track.album, track.genre].some((field) =>
        field?.toLowerCase().includes(needle),
      )
    })
    const sorters: Record<SortKey, (a: Track, b: Track) => number> = {
      recent: (a, b) => b.createdAt - a.createdAt,
      title: (a, b) => a.title.localeCompare(b.title),
      artist: (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title),
      duration: (a, b) => a.duration - b.duration,
      plays: (a, b) => b.playCount - a.playCount,
    }
    return [...filtered].sort(sorters[sort])
  }, [scoped, query, genre, sort])

  const meta = VIEW_META[view]
  const totalSeconds = visible.reduce((sum, track) => sum + track.duration, 0)
  const featured = visible[0]

  const startAll = (shuffled: boolean) => {
    if (visible.length === 0) return
    const start = shuffled ? Math.floor(Math.random() * visible.length) : 0
    playTracks(visible, start, shuffled ? true : undefined)
  }

  return (
    <div className="space-y-8">
      {/* Featured banner — the lead track's Durga image washes over the tint. */}
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-outline-variant bg-gradient-to-br from-primary-container via-secondary-container/60 to-surface-low">
        {featured?.backdropUrl && (
          <>
            <img
              src={featured.backdropUrl}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 size-full scale-105 object-cover opacity-30 blur-[2px]"
            />
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-primary-container/90 via-primary-container/70 to-transparent"
              aria-hidden="true"
            />
          </>
        )}
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          {featured ? (
            <Cover
              track={featured}
              className="size-36 shrink-0 sm:size-44"
              rounded="rounded-3xl"
            />
          ) : (
            <div className="grid size-36 shrink-0 place-items-center rounded-3xl border border-dashed border-outline sm:size-44">
              <MusicIcon className="size-8 text-on-primary-container/60" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-primary-container">
              {meta.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-primary-container sm:text-4xl">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-md text-sm text-on-primary-container/85">{meta.subtitle}</p>
            <p className="mt-3 text-xs font-medium text-on-primary-container/70">
              {formatCount(visible.length, 'track')} · {formatTime(totalSeconds)}
              {featured ? ` · starts with ${featured.title}` : ''}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => startAll(false)}
                disabled={visible.length === 0}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlayIcon className="size-4" />
                Play all
              </button>
              <button
                type="button"
                onClick={() => startAll(true)}
                disabled={visible.length === 0}
                className="flex items-center gap-2 rounded-full border border-on-primary-container/30 bg-surface/70 px-5 py-3 text-sm font-semibold text-on-primary-container backdrop-blur transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShuffleIcon className="size-4" />
                Shuffle
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-on-surface">
          {query ? `Results for “${query}”` : 'All tracks'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={genre}
            options={genreOptions}
            onChange={setGenre}
            label="Genre"
            className="w-36"
          />
          <Select
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
            label="Sort by"
            className="w-44"
          />

          <div className="flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container p-0.5">
            {([
              ['grid', GridIcon, 'Grid view'],
              ['list', ListIcon, 'List view'],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayout(id)}
                aria-label={label}
                aria-pressed={layout === id}
                className={`grid size-9 place-items-center rounded-full transition ${
                  layout === id
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-surface-high" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-outline py-20 text-center">
          <MusicIcon className="size-9 text-on-surface-variant" />
          <p className="text-base font-semibold text-on-surface">
            {query || genre !== 'All' ? 'Nothing matches that filter' : 'No tracks here yet'}
          </p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            {query || genre !== 'All'
              ? 'Try a different search term or genre.'
              : 'Open the Admin tab to upload the first song.'}
          </p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((track, index) => (
            <TrackCard key={track.id} track={track} onPlay={() => playTracks(visible, index)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-low">
          <div className="hidden grid-cols-[2.5rem_minmax(0,2.2fr)_minmax(0,1.4fr)_auto] gap-3 border-b border-outline-variant px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant sm:grid">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="pr-1 text-right">Length</span>
          </div>
          <div className="p-2">
            {visible.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                onPlay={() => playTracks(visible, index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

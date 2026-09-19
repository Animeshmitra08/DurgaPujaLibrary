import { Cover } from './Cover'
import { CloseIcon, QueueIcon, TrashIcon } from './Icons'
import { formatTime } from '../lib/format'
import { usePlayer } from '../store/playerStore'

export function QueuePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { upcoming, orderPos, current, jumpTo, removeAt, clearQueue } = usePlayer()

  const nowPlaying = upcoming.find((entry) => entry.orderPos === orderPos)
  const rest = upcoming.filter((entry) => entry.orderPos > orderPos)

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-[22rem] max-w-[88vw] flex-col border-l border-outline-variant bg-surface-low shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      inert={!open}
    >
      <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <div className="flex items-center gap-2">
          <QueueIcon className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-on-surface">Play queue</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearQueue}
            disabled={rest.length === 0}
            title="Clear upcoming"
            className="grid size-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface disabled:opacity-30"
            aria-label="Clear upcoming tracks"
          >
            <TrashIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
            aria-label="Close queue"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {nowPlaying && current && (
          <section className="mb-5">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Now playing
            </p>
            <div className="flex items-center gap-3 rounded-2xl bg-primary-container/40 p-2 ring-1 ring-primary/30">
              <Cover track={current} className="size-11 shrink-0" rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-on-primary-container">{current.title}</p>
                <p className="truncate text-xs text-on-primary-container/80">{current.artist}</p>
              </div>
            </div>
          </section>
        )}

        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Next up {rest.length > 0 && <span className="opacity-60">({rest.length})</span>}
        </p>

        {rest.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-on-surface-variant">
            Nothing queued. Hover a track and use{' '}
            <span className="font-semibold text-on-surface">+</span> to line it up.
          </p>
        ) : (
          <ul className="space-y-1">
            {rest.map(({ track, orderPos: pos }) => (
              <li key={`${track.id}-${pos}`}>
                <div className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-high">
                  <button
                    type="button"
                    onClick={() => jumpTo(pos)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Cover track={track} className="size-10 shrink-0" rounded="rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-on-surface">
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-on-surface-variant">
                        {track.artist}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-on-surface-variant">
                      {formatTime(track.duration)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(pos)}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-on-surface-variant opacity-0 transition hover:bg-surface-highest hover:text-on-surface group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Remove ${track.title} from queue`}
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

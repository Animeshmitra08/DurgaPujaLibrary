import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CloseIcon } from './Icons'
import { useServer, type ServerStatus } from '../store/serverStore'

const DOT: Record<ServerStatus, string> = {
  checking: 'bg-outline animate-pulse',
  waking: 'bg-primary-container animate-pulse',
  online: 'bg-emerald-500',
  offline: 'bg-error',
}

const LABEL: Record<ServerStatus, string> = {
  checking: 'Connecting',
  waking: 'Waking',
  online: 'Online',
  offline: 'Offline',
}

/** "8s", "1m 12s" */
function formatWait(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** Current time, re-rendering every second while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** Top-nav indicator; opens a card with when the server woke and a manual check. */
export function ServerPill() {
  const { status, wakingSince, upSince, lastWake, wake } = useServer()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const now = useNow(status === 'waking')
  const busy = status === 'checking' || status === 'waking'

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-full px-3 text-xs font-medium text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
        aria-label={`Server ${LABEL[status].toLowerCase()}`}
        aria-expanded={open}
      >
        <span className={`size-2.5 rounded-full ${DOT[status]}`} />
        <span className="hidden tabular-nums sm:inline">
          {LABEL[status]}
          {status === 'waking' && wakingSince ? ` · ${formatWait(now - wakingSince)}` : ''}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-2xl border border-outline-variant bg-surface-low p-4 shadow-xl">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Server
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
            <span className={`size-2.5 rounded-full ${DOT[status]}`} />
            {LABEL[status]}
            {status === 'waking' && wakingSince && (
              <span className="font-normal tabular-nums text-on-surface-variant">
                for {formatWait(now - wakingSince)}
              </span>
            )}
          </p>

          <dl className="mt-3 space-y-1.5 text-xs">
            {status === 'online' && upSince && (
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Awake since</dt>
                <dd className="font-medium text-on-surface">{clock(upSince)}</dd>
              </div>
            )}
            {lastWake && (
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Last woke up</dt>
                <dd className="font-medium text-on-surface">
                  {clock(lastWake.at)} · took {formatWait(lastWake.tookMs)}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-3 text-xs text-on-surface-variant">
            The server naps after a while with no visitors. While this page is open it gets a ping
            every few minutes so it stays awake.
          </p>

          <button
            type="button"
            onClick={wake}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Spinner className="size-3.5" />}
            {status === 'waking' ? 'Waking up…' : status === 'offline' ? 'Try again' : 'Check now'}
          </button>
        </div>
      )}
    </div>
  )
}

/** Shown above the page while the server boots, if it never answers, and briefly once it does. */
export function ServerBanner() {
  const { status, wakingSince, lastWake, wake } = useServer()
  const now = useNow(status === 'waking')
  // The wake-up whose "awake" note was dismissed or timed out.
  const [hiddenWake, setHiddenWake] = useState<number | null>(null)

  useEffect(() => {
    if (!lastWake) return
    const timer = setTimeout(() => setHiddenWake(lastWake.at), 8000)
    return () => clearTimeout(timer)
  }, [lastWake])

  if (status === 'waking') {
    return (
      <div
        role="status"
        className="mb-6 flex items-center gap-3 rounded-3xl border border-primary/30 bg-primary-container/40 px-5 py-4 text-on-primary-container"
      >
        <Spinner className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Waking up the server…</p>
          <p className="text-xs opacity-80">
            It naps when nobody has visited for a while. This usually takes under a minute; the
            library loads by itself as soon as it's up.
          </p>
        </div>
        {wakingSince && (
          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
            {formatWait(now - wakingSince)}
          </span>
        )}
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <div
        role="alert"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-error-container px-5 py-4 text-on-error-container"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">The server isn't answering</p>
          <p className="text-xs opacity-80">It didn't wake up within 3 minutes.</p>
        </div>
        <button
          type="button"
          onClick={wake}
          className="rounded-full bg-error px-4 py-2 text-xs font-semibold text-on-error transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    )
  }

  if (status === 'online' && lastWake && lastWake.at !== hiddenWake) {
    return (
      <div
        role="status"
        className="mb-6 flex items-center gap-3 rounded-3xl border border-outline-variant bg-secondary-container px-5 py-3 text-on-secondary-container"
      >
        <CheckIcon className="size-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Server is awake</span> — took{' '}
          {formatWait(lastWake.tookMs)}, woke at {clock(lastWake.at)}.
        </p>
        <button
          type="button"
          onClick={() => setHiddenWake(lastWake.at)}
          className="grid size-8 shrink-0 place-items-center rounded-full transition hover:bg-on-secondary-container/10"
          aria-label="Dismiss"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    )
  }

  return null
}

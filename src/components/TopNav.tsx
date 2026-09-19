import { useEffect, useRef, useState } from 'react'
import {
  ClockIcon,
  HeartIcon,
  KeyboardIcon,
  LibraryIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UploadIcon,
} from './Icons'
import { useTheme } from '../store/themeStore'
import type { ViewId } from '../types'

const TABS: Array<{ id: ViewId; label: string; icon: typeof LibraryIcon }> = [
  { id: 'library', label: 'Browse', icon: LibraryIcon },
  { id: 'liked', label: 'Liked', icon: HeartIcon },
  { id: 'recent', label: 'Recent', icon: ClockIcon },
  { id: 'admin', label: 'Admin', icon: UploadIcon },
]

const SHORTCUTS: Array<[string, string]> = [
  ['Space', 'Play / pause'],
  ['← →', 'Seek ±5 seconds'],
  ['⇧ ← →', 'Previous / next track'],
  ['↑ ↓', 'Volume'],
  ['S', 'Shuffle'],
  ['R', 'Repeat mode'],
  ['M', 'Mute'],
]

type TopNavProps = {
  view: ViewId
  onNavigate: (view: ViewId) => void
  query: string
  onQuery: (value: string) => void
}

export function TopNav({ view, onNavigate, query, onQuery }: TopNavProps) {
  const { mode, toggle } = useTheme()
  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!helpOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!helpRef.current?.contains(event.target as Node)) setHelpOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [helpOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary-container to-primary shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="size-6 text-on-primary-container"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2.5 13.9 8h5.8l-4.7 3.4 1.8 5.6L12 13.6l-4.8 3.4L9 11.4 4.3 8h5.8Z" />
              <circle cx="12" cy="19.6" r="1.8" />
            </svg>
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-bold text-on-surface">Durga Puja</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Library
            </span>
          </span>
        </div>

        {/* Primary navigation */}
        <nav className="min-w-0 flex-1">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = view === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                      active
                        ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Search + utilities */}
        {view !== 'admin' && (
          <label className="relative hidden w-56 shrink-0 lg:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search library…"
              className="w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none transition focus:border-primary focus:bg-surface"
            />
          </label>
        )}

        <div className="relative flex shrink-0 items-center gap-1" ref={helpRef}>
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            className="hidden size-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface sm:grid"
            aria-label="Keyboard shortcuts"
            aria-expanded={helpOpen}
          >
            <KeyboardIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
          >
            {mode === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </button>

          {helpOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl border border-outline-variant bg-surface-low p-4 shadow-xl">
              <p className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Keyboard shortcuts
              </p>
              <dl className="space-y-1.5">
                {SHORTCUTS.map(([key, action]) => (
                  <div key={key} className="flex items-center justify-between gap-3 text-xs">
                    <dt className="rounded-md bg-surface-highest px-1.5 py-0.5 font-mono text-[11px] text-on-surface">
                      {key}
                    </dt>
                    <dd className="text-on-surface-variant">{action}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Search drops below the bar on narrow screens */}
      {view !== 'admin' && (
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:hidden">
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search library…"
              className="w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none transition focus:border-primary focus:bg-surface"
            />
          </label>
        </div>
      )}
    </header>
  )
}

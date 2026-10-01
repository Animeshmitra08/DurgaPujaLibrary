import { useEffect, useState } from 'react'
import { AdminView } from './components/AdminView'
import { LibraryView } from './components/LibraryView'
import { NowPlaying } from './components/NowPlaying'
import { PlayerBar } from './components/PlayerBar'
import { QueuePanel } from './components/QueuePanel'
import { ServerBanner } from './components/ServerStatus'
import { TopNav } from './components/TopNav'
import { LibraryProvider } from './store/LibraryContext'
import { PlayerProvider } from './store/PlayerContext'
import { ServerProvider } from './store/ServerContext'
import { ThemeProvider } from './store/ThemeContext'
import type { ViewId } from './types'

/** The Admin Studio has its own URL and no tab, so listeners never see it. */
const ADMIN_PATH = '/song-admin'

const viewFromUrl = (): ViewId =>
  window.location.pathname.replace(/\/+$/, '') === ADMIN_PATH ? 'admin' : 'library'

function Shell() {
  const [view, setView] = useState<ViewId>(viewFromUrl)
  const [query, setQuery] = useState('')
  const [queueOpen, setQueueOpen] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)

  // Back/forward between the library and /song-admin.
  useEffect(() => {
    const onPopState = () => setView(viewFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (next: ViewId) => {
    const path = next === 'admin' ? ADMIN_PATH : '/'
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
    setView(next)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-on-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TopNav view={view} onNavigate={navigate} query={query} onQuery={setQuery} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <ServerBanner />
          {view === 'admin' ? <AdminView /> : <LibraryView view={view} query={query} />}
        </main>
      </div>

      {queueOpen && (
        <button
          type="button"
          onClick={() => setQueueOpen(false)}
          className="fixed inset-0 z-30 bg-inverse-surface/40 lg:hidden"
          aria-label="Close queue"
        />
      )}
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />

      <PlayerBar
        queueOpen={queueOpen}
        onToggleQueue={() => setQueueOpen((open) => !open)}
        onExpand={() => setPlayerOpen(true)}
      />

      <NowPlaying open={playerOpen} onClose={() => setPlayerOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ServerProvider>
        <LibraryProvider>
          <PlayerProvider>
            <Shell />
          </PlayerProvider>
        </LibraryProvider>
      </ServerProvider>
    </ThemeProvider>
  )
}

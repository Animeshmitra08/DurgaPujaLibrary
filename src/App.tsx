import { useState } from 'react'
import { AdminView } from './components/AdminView'
import { LibraryView } from './components/LibraryView'
import { NowPlaying } from './components/NowPlaying'
import { PlayerBar } from './components/PlayerBar'
import { QueuePanel } from './components/QueuePanel'
import { TopNav } from './components/TopNav'
import { LibraryProvider } from './store/LibraryContext'
import { PlayerProvider } from './store/PlayerContext'
import { ThemeProvider } from './store/ThemeContext'
import type { ViewId } from './types'

function Shell() {
  const [view, setView] = useState<ViewId>('library')
  const [query, setQuery] = useState('')
  const [queueOpen, setQueueOpen] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-on-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TopNav view={view} onNavigate={setView} query={query} onQuery={setQuery} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
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
      <LibraryProvider>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  )
}

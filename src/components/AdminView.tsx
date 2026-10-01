import { useEffect, useMemo, useRef, useState } from 'react'
import { Cover } from './Cover'
import { CloseIcon, LockIcon, MusicIcon, TrashIcon, UploadIcon } from './Icons'
import type { DriveFolder, SyncResult } from '../lib/api'
import { formatBytes, formatTime } from '../lib/format'
import { useLibrary } from '../store/libraryStore'

/** Demo-only gate — real deployments should authenticate server-side. */
const ADMIN_PASSCODE = 'puja2025'
const SESSION_KEY = 'dpl.admin.unlocked'

/** A picked file waiting to be uploaded; `preview` is only for images. */
type Draft = { id: string; file: File; folder: DriveFolder; title: string; preview?: string }

const fieldClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none transition focus:border-primary'

const filledButton =
  'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50'

const outlinedButton =
  'rounded-full border border-outline px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-high'

const headerButton =
  'rounded-full border border-on-primary-container/30 bg-surface/70 px-4 py-2 text-xs font-semibold text-on-primary-container transition hover:bg-surface disabled:opacity-50'

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'check the console for details.'

/** Audio goes to `audios`, images to `images`; anything else is skipped. */
function folderFor(file: File): DriveFolder | null {
  if (file.type.startsWith('image/')) return 'images'
  if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(file.name)) return 'audios'
  return null
}

/** One line for the toast: folder problems first, otherwise how much came in. */
function describeSync({ totalImported, folders }: SyncResult): string {
  const missing = folders.filter((folder) => folder.error).map((folder) => folder.error)
  if (missing.length > 0) return `${missing.join('. ')}.`
  if (totalImported === 0) return 'Already up to date — no new files in Drive.'
  return `Imported ${totalImported} new file${totalImported === 1 ? '' : 's'} from Drive.`
}

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (value === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[2rem] border border-outline-variant bg-surface-low p-8 text-center shadow-sm"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary-container text-on-primary-container">
          <LockIcon className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-on-surface">Admin Studio</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Enter the passcode to upload and manage the collection.
        </p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Passcode"
          className={`${fieldClass} mt-6 text-center ${error ? 'border-error' : ''}`}
        />
        {error && <p className="mt-2 text-xs font-medium text-error">That passcode is not right.</p>}
        <button type="submit" className={`${filledButton} mt-4 w-full`}>
          Unlock
        </button>
        <p className="mt-4 text-[11px] text-on-surface-variant">
          Demo passcode: <span className="font-mono font-semibold text-on-surface">{ADMIN_PASSCODE}</span>
        </p>
      </form>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface/70 p-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-2xl font-bold text-on-surface">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p>}
    </div>
  )
}

export function AdminView() {
  const { tracks, images, upload, remove, sync } = useLibrary()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const acceptFiles = (files: FileList | null) => {
    if (!files) return
    const picked: Draft[] = []
    for (const file of Array.from(files)) {
      const folder = folderFor(file)
      if (!folder) continue
      picked.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        folder,
        title: file.name.replace(/\.[^.]+$/, ''),
        preview: folder === 'images' ? URL.createObjectURL(file) : undefined,
      })
    }
    if (picked.length < files.length) setToast('Only audio and image files can be uploaded — the rest were skipped.')
    setDrafts((prev) => [...prev, ...picked])
  }

  const dropDraft = (draft: Draft) => {
    if (draft.preview) URL.revokeObjectURL(draft.preview)
    setDrafts((prev) => prev.filter((item) => item.id !== draft.id))
  }

  const publish = async () => {
    setSaving(true)
    let uploaded = 0
    try {
      // One at a time, dropping each draft once it is in, so a retry after a
      // failure does not upload the earlier files twice.
      for (const draft of drafts) {
        await upload(draft.file, draft.folder, draft.title.trim())
        dropDraft(draft)
        uploaded++
      }
      setToast(`Uploaded ${uploaded} file${uploaded === 1 ? '' : 's'} to Google Drive.`)
    } catch (error) {
      console.error(error)
      setToast(`${uploaded ? `Uploaded ${uploaded}, then the upload` : 'Upload'} failed — ${errorText(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const runSync = async () => {
    setSyncing(true)
    try {
      setToast(describeSync(await sync()))
    } catch (error) {
      console.error(error)
      setToast(`Sync failed — ${errorText(error)}`)
    } finally {
      setSyncing(false)
    }
  }

  const deleteFile = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from the library?`)) return
    setDeletingId(id)
    try {
      await remove(id)
      setToast(`Deleted "${name}".`)
    } catch (error) {
      console.error(error)
      setToast(`Delete failed — ${errorText(error)}`)
    } finally {
      setDeletingId(null)
    }
  }

  const stats = useMemo(
    () => ({
      seconds: tracks.reduce((sum, track) => sum + track.duration, 0),
      plays: tracks.reduce((sum, track) => sum + track.playCount, 0),
    }),
    [tracks],
  )

  if (!unlocked) return <PasscodeGate onUnlock={() => setUnlocked(true)} />

  const draftBytes = drafts.reduce((sum, draft) => sum + draft.file.size, 0)

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-outline-variant bg-gradient-to-br from-secondary-container via-primary-container/70 to-surface-low p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-primary-container">Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-primary-container sm:text-4xl">
              Upload Studio
            </h1>
            <p className="mt-2 max-w-lg text-sm text-on-primary-container/85">
              Audio is uploaded to the Google Drive <span className="font-mono">audios</span> folder and
              images to <span className="font-mono">images</span>. Added files in Drive yourself? Press Sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              title="Import files added straight to the Drive audios and images folders"
              className={headerButton}
            >
              {syncing ? 'Syncing…' : 'Sync from Drive'}
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(SESSION_KEY)
                setUnlocked(false)
              }}
              className={headerButton}
            >
              Lock studio
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Audio" value={String(tracks.length)} hint="in audios" />
          <StatCard label="Images" value={String(images.length)} hint="in images" />
          <StatCard label="Runtime" value={formatTime(stats.seconds)} />
          <StatCard label="Plays" value={String(stats.plays)} hint="this browser" />
        </div>
      </header>

      {/* Dropzone */}
      <section>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            acceptFiles(e.dataTransfer.files)
          }}
          className={`grid place-items-center gap-3 rounded-[2rem] border-2 border-dashed px-6 py-14 text-center transition ${
            dragging ? 'border-primary bg-primary-container/25' : 'border-outline bg-surface-low'
          }`}
        >
          <span className="grid size-16 place-items-center rounded-3xl bg-primary-container text-on-primary-container">
            <UploadIcon className="size-7" />
          </span>
          <p className="text-base font-bold text-on-surface">Drop audio or images here</p>
          <p className="max-w-sm text-sm text-on-surface-variant">
            MP3, WAV, OGG, M4A, FLAC or AAC go to <span className="font-mono">audios</span>; JPG, PNG or
            WebP go to <span className="font-mono">images</span>.
          </p>
          <button type="button" onClick={() => fileInput.current?.click()} className={`${filledButton} mt-2`}>
            Browse files
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="audio/*,image/*"
            multiple
            hidden
            onChange={(e) => {
              acceptFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {/* Files waiting to upload */}
      {drafts.length > 0 && (
        <section className="rounded-[2rem] border border-outline-variant bg-surface-low p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Ready to upload</h2>
              <p className="text-xs text-on-surface-variant">
                {drafts.length} file{drafts.length === 1 ? '' : 's'} · {formatBytes(draftBytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => drafts.forEach(dropDraft)} className={outlinedButton}>
                Discard all
              </button>
              <button type="button" onClick={publish} disabled={saving} className={filledButton}>
                {saving ? 'Uploading…' : 'Upload to Drive'}
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-center gap-3 rounded-3xl border border-outline-variant bg-surface p-3"
              >
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-container text-on-surface-variant">
                  {draft.preview ? (
                    <img src={draft.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <MusicIcon className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {draft.folder === 'audios' ? (
                    <input
                      value={draft.title}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item) => (item.id === draft.id ? { ...item, title: e.target.value } : item)),
                        )
                      }
                      className={fieldClass}
                      placeholder="Title"
                      aria-label={`Title for ${draft.file.name}`}
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-on-surface">{draft.file.name}</p>
                  )}
                  <p className="mt-1 truncate text-xs text-on-surface-variant">
                    → <span className="font-mono">{draft.folder}</span> · {formatBytes(draft.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dropDraft(draft)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
                  aria-label={`Remove ${draft.file.name}`}
                >
                  <CloseIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* audios folder */}
      <section className="rounded-[2rem] border border-outline-variant bg-surface-low p-5 sm:p-6">
        <h2 className="pb-4 text-lg font-bold text-on-surface">
          Audio <span className="font-mono text-sm font-normal text-on-surface-variant">audios/</span>
        </h2>
        {tracks.length === 0 ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">No audio files yet.</p>
        ) : (
          <ul className="space-y-2">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center gap-3 rounded-3xl border border-outline-variant bg-surface p-3"
              >
                <Cover track={track} className="size-11 shrink-0" rounded="rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{track.title}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {track.artist} · {formatTime(track.duration)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteFile(track.id, track.title)}
                  disabled={deletingId === track.id}
                  className="grid size-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
                  aria-label={`Delete ${track.title}`}
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* images folder */}
      <section className="rounded-[2rem] border border-outline-variant bg-surface-low p-5 sm:p-6">
        <h2 className="text-lg font-bold text-on-surface">
          Images <span className="font-mono text-sm font-normal text-on-surface-variant">images/</span>
        </h2>
        <p className="pb-4 text-xs text-on-surface-variant">Dealt out at random as track artwork.</p>
        {images.length === 0 ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">No images yet.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
            {images.map((image) => (
              <li key={image.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-surface">
                <img src={image.url} alt={image.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => deleteFile(image.id, image.name)}
                  disabled={deletingId === image.id}
                  className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-inverse-surface/70 text-inverse-on-surface opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  aria-label={`Delete ${image.name}`}
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div
          role="status"
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-inverse-surface px-5 py-2.5 text-sm font-medium text-inverse-on-surface shadow-2xl"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cover } from './Cover'
import { CloseIcon, EditIcon, LockIcon, MusicIcon, TrashIcon, UploadIcon } from './Icons'
import { probeFileDuration } from '../lib/audioMeta'
import { formatBytes, formatTime, parseFilename } from '../lib/format'
import { useLibrary, type UploadDraft } from '../store/libraryStore'
import type { Track } from '../types'

/** Demo-only gate — real deployments should authenticate server-side. */
const ADMIN_PASSCODE = 'puja2025'
const SESSION_KEY = 'dpl.admin.unlocked'

type Draft = UploadDraft & { id: string; coverPreview?: string }

const fieldClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none transition focus:border-primary'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'

const filledButton =
  'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50'

const outlinedButton =
  'rounded-full border border-outline px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-high'

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
  const { tracks, addUploads, updateTrack, removeTrack } = useLibrary()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const acceptFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    const audioFiles = Array.from(files).filter(
      (file) => file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(file.name),
    )
    if (audioFiles.length === 0) {
      setToast('Those files are not audio — skipped.')
      return
    }
    const built = await Promise.all(
      audioFiles.map(async (file) => {
        const guess = parseFilename(file.name)
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          title: guess.title,
          artist: guess.artist,
          album: '',
          genre: '',
          year: new Date().getFullYear().toString(),
          duration: await probeFileDuration(file),
        } satisfies Draft
      }),
    )
    setDrafts((prev) => [...prev, ...built])
  }, [])

  const patchDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)))

  const dropDraft = (id: string) =>
    setDrafts((prev) => {
      const target = prev.find((draft) => draft.id === id)
      if (target?.coverPreview) URL.revokeObjectURL(target.coverPreview)
      return prev.filter((draft) => draft.id !== id)
    })

  const publish = async () => {
    if (drafts.length === 0) return
    setSaving(true)
    try {
      await addUploads(drafts)
      for (const draft of drafts) if (draft.coverPreview) URL.revokeObjectURL(draft.coverPreview)
      setToast(`Published ${drafts.length} track${drafts.length === 1 ? '' : 's'} to the library.`)
      setDrafts([])
    } catch (error) {
      console.error(error)
      setToast('Upload failed — check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const uploads = tracks.filter((track) => track.kind === 'upload')
    const seconds = tracks.reduce((sum, track) => sum + track.duration, 0)
    const plays = tracks.reduce((sum, track) => sum + track.playCount, 0)
    return {
      total: tracks.length,
      bundled: tracks.length - uploads.length,
      uploads: uploads.length,
      seconds,
      plays,
    }
  }, [tracks])

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
              The Durga Puja tracks ship with the app from <span className="font-mono">src/assets</span>.
              Anything you add here is stored locally in your browser, so nothing leaves this device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY)
              setUnlocked(false)
            }}
            className="rounded-full border border-on-primary-container/30 bg-surface/70 px-4 py-2 text-xs font-semibold text-on-primary-container transition hover:bg-surface"
          >
            Lock studio
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Tracks" value={String(stats.total)} />
          <StatCard label="Bundled" value={String(stats.bundled)} hint="ships with the app" />
          <StatCard label="Uploaded" value={String(stats.uploads)} hint="this browser" />
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
            void acceptFiles(e.dataTransfer.files)
          }}
          className={`grid place-items-center gap-3 rounded-[2rem] border-2 border-dashed px-6 py-14 text-center transition ${
            dragging ? 'border-primary bg-primary-container/25' : 'border-outline bg-surface-low'
          }`}
        >
          <span className="grid size-16 place-items-center rounded-3xl bg-primary-container text-on-primary-container">
            <UploadIcon className="size-7" />
          </span>
          <p className="text-base font-bold text-on-surface">Drop audio files here</p>
          <p className="max-w-sm text-sm text-on-surface-variant">
            MP3, WAV, OGG, M4A, FLAC or AAC. Drop a batch and tag them all before publishing.
          </p>
          <button type="button" onClick={() => fileInput.current?.click()} className={`${filledButton} mt-2`}>
            Browse files
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              void acceptFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {/* Draft tagging */}
      {drafts.length > 0 && (
        <section className="rounded-[2rem] border border-outline-variant bg-surface-low p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Ready to publish</h2>
              <p className="text-xs text-on-surface-variant">
                {drafts.length} file{drafts.length === 1 ? '' : 's'} · {formatBytes(draftBytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  for (const draft of drafts) if (draft.coverPreview) URL.revokeObjectURL(draft.coverPreview)
                  setDrafts([])
                }}
                className={outlinedButton}
              >
                Discard all
              </button>
              <button type="button" onClick={publish} disabled={saving} className={filledButton}>
                {saving ? 'Publishing…' : 'Publish to library'}
              </button>
            </div>
          </div>

          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.id} className="rounded-3xl border border-outline-variant bg-surface p-4">
                <div className="flex items-start gap-4">
                  <label className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
                    {draft.coverPreview ? (
                      <img src={draft.coverPreview} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-on-surface-variant">
                        <MusicIcon className="size-6" />
                      </span>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-inverse-surface/70 text-[10px] font-bold uppercase tracking-wide text-inverse-on-surface opacity-0 transition group-hover:opacity-100">
                      Cover
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (draft.coverPreview) URL.revokeObjectURL(draft.coverPreview)
                        patchDraft(draft.id, { cover: file, coverPreview: URL.createObjectURL(file) })
                      }}
                    />
                  </label>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-xs text-on-surface-variant">
                        {draft.file.name} · {formatBytes(draft.file.size)} ·{' '}
                        {draft.duration ? formatTime(draft.duration) : 'unknown length'}
                      </p>
                      <button
                        type="button"
                        onClick={() => dropDraft(draft.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
                        aria-label={`Remove ${draft.file.name}`}
                      >
                        <CloseIcon className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`title-${draft.id}`}>Title</label>
                        <input
                          id={`title-${draft.id}`}
                          value={draft.title}
                          onChange={(e) => patchDraft(draft.id, { title: e.target.value })}
                          className={`${fieldClass} mt-1`}
                          placeholder="Song title"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`artist-${draft.id}`}>Artist</label>
                        <input
                          id={`artist-${draft.id}`}
                          value={draft.artist}
                          onChange={(e) => patchDraft(draft.id, { artist: e.target.value })}
                          className={`${fieldClass} mt-1`}
                          placeholder="Artist name"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`album-${draft.id}`}>Album</label>
                        <input
                          id={`album-${draft.id}`}
                          value={draft.album}
                          onChange={(e) => patchDraft(draft.id, { album: e.target.value })}
                          className={`${fieldClass} mt-1`}
                          placeholder="Album or collection"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass} htmlFor={`genre-${draft.id}`}>Genre</label>
                          <input
                            id={`genre-${draft.id}`}
                            value={draft.genre}
                            onChange={(e) => patchDraft(draft.id, { genre: e.target.value })}
                            className={`${fieldClass} mt-1`}
                            placeholder="Devotional"
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`year-${draft.id}`}>Year</label>
                          <input
                            id={`year-${draft.id}`}
                            value={draft.year}
                            onChange={(e) => patchDraft(draft.id, { year: e.target.value })}
                            className={`${fieldClass} mt-1`}
                            placeholder="2025"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Existing catalogue */}
      <section className="rounded-[2rem] border border-outline-variant bg-surface-low p-5 sm:p-6">
        <h2 className="text-lg font-bold text-on-surface">Manage catalogue</h2>
        <p className="pb-4 text-xs text-on-surface-variant">
          Retag anything. Uploads can be deleted; bundled tracks ship with the build.
        </p>

        {tracks.length === 0 ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">The library is empty.</p>
        ) : (
          <ul className="space-y-2">
            {tracks.map((track) => (
              <li key={track.id} className="rounded-3xl border border-outline-variant bg-surface">
                <div className="flex items-center gap-3 p-3">
                  <Cover track={track} className="size-11 shrink-0" rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-on-surface">{track.title}</p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {track.artist} · {track.album} · {formatTime(track.duration)}
                    </p>
                  </div>
                  <span
                    className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:block ${
                      track.kind === 'upload'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-highest text-on-surface-variant'
                    }`}
                  >
                    {track.kind === 'upload' ? 'Uploaded' : 'Bundled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === track.id ? null : track.id)}
                    className="grid size-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
                    aria-label={`Edit ${track.title}`}
                    aria-expanded={editingId === track.id}
                  >
                    <EditIcon className="size-4" />
                  </button>
                  {track.kind === 'upload' ? (
                    <button
                      type="button"
                      onClick={() => setConfirmId(track.id)}
                      className="grid size-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container"
                      aria-label={`Delete ${track.title}`}
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  ) : (
                    // Bundled files live in the build — removing one means
                    // deleting it from src/assets/audiofiles and rebuilding.
                    <span
                      className="grid size-9 place-items-center text-on-surface-variant/40"
                      title="Bundled with the app — edit src/assets/audiofiles to remove it"
                    >
                      <LockIcon className="size-4" />
                    </span>
                  )}
                </div>

                {editingId === track.id && (
                  <EditForm
                    track={track}
                    onCancel={() => setEditingId(null)}
                    onSave={async (patch, cover) => {
                      await updateTrack(track.id, patch, cover)
                      setEditingId(null)
                      setToast('Track details updated.')
                    }}
                  />
                )}

                {confirmId === track.id && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-outline-variant bg-error-container px-4 py-3">
                    <p className="text-sm text-on-error-container">
                      Delete <span className="font-bold">{track.title}</span> permanently?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-full border border-on-error-container/40 px-3 py-1.5 text-xs font-medium text-on-error-container transition hover:bg-surface/40"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeTrack(track.id)
                          setConfirmId(null)
                          setToast('Track deleted.')
                        }}
                        className="rounded-full bg-error px-3 py-1.5 text-xs font-bold text-on-error transition hover:opacity-90"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
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

function EditForm({
  track,
  onSave,
  onCancel,
}: {
  track: Track
  onSave: (patch: Partial<Track>, cover?: File) => void | Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    year: track.year,
  })
  const [cover, setCover] = useState<File | undefined>()

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(form, cover)
      }}
      className="border-t border-outline-variant px-4 py-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title</label>
          <input value={form.title} onChange={set('title')} className={`${fieldClass} mt-1`} />
        </div>
        <div>
          <label className={labelClass}>Artist</label>
          <input value={form.artist} onChange={set('artist')} className={`${fieldClass} mt-1`} />
        </div>
        <div>
          <label className={labelClass}>Album</label>
          <input value={form.album} onChange={set('album')} className={`${fieldClass} mt-1`} />
        </div>
        <div>
          <label className={labelClass}>Genre</label>
          <input value={form.genre} onChange={set('genre')} className={`${fieldClass} mt-1`} />
        </div>
        <div>
          <label className={labelClass}>Year</label>
          <input value={form.year} onChange={set('year')} className={`${fieldClass} mt-1`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {track.kind === 'upload' ? (
          <label className="cursor-pointer">
            <span className={`${outlinedButton} inline-block text-xs`}>
              {cover ? `Cover: ${cover.name}` : 'Replace cover art'}
            </span>
            <input type="file" accept="image/*" hidden onChange={(e) => setCover(e.target.files?.[0])} />
          </label>
        ) : (
          <p className="text-xs text-on-surface-variant">
            Artwork is dealt at random from <span className="font-mono">src/assets/durgaImages</span>.
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={`${outlinedButton} text-xs`}>
            Cancel
          </button>
          <button type="submit" className={`${filledButton} px-4 py-2 text-xs`}>
            Save changes
          </button>
        </div>
      </div>
    </form>
  )
}

/**
 * Client for the Google Drive storage API. The server is configured with one
 * Drive folder id; `audios` and `images` are the two folders inside it.
 */

const ORIGIN = (import.meta.env.VITE_API_URL ?? 'https://durgapujaapi-bd4ef.containers.snapdeploy.app').replace(/\/+$/, '')
const BASE = `${ORIGIN}/api/files`

/** Write routes need this once the server sets API_KEY; reads are always open. */
const API_KEY = import.meta.env.VITE_API_KEY

export type DriveFolder = 'audios' | 'images'

/** A file record from the API — Drive holds the bytes. */
export type RemoteFile = {
  _id: string
  title: string
  originalName: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export type SyncResult = {
  totalImported: number
  folders: Array<{ folderName: string; imported: number; error?: string }>
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.method && init.method !== 'GET' && API_KEY) headers.set('x-api-key', API_KEY)

  const response = await fetch(`${BASE}${path}`, { ...init, headers })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(json?.message || `${init.method ?? 'GET'} ${path || '/'} failed with ${response.status}`)
  }
  return json as T
}

/** GET /api/files?folderName=… — every file in one folder (the server caps a page at 100). */
export async function listFolder(folder: DriveFolder, signal?: AbortSignal): Promise<RemoteFile[]> {
  const all: RemoteFile[] = []
  for (let page = 1; ; page++) {
    const json = await request<{ data: RemoteFile[]; pagination: { hasNextPage: boolean } }>(
      `?folderName=${folder}&page=${page}&limit=100`,
      { signal },
    )
    all.push(...json.data)
    if (!json.pagination.hasNextPage) return all
  }
}

/** POST /api/files/upload — puts the file in the given folder. */
export async function uploadFile(file: File, folder: DriveFolder, title?: string): Promise<RemoteFile> {
  const form = new FormData()
  form.set('folderName', folder)
  if (title) form.set('title', title)
  form.set('file', file) // last, so the text fields are parsed first
  return (await request<{ data: RemoteFile }>('/upload', { method: 'POST', body: form })).data
}

/** POST /api/files/sync — registers files added to `audios` and `images` in Drive by hand. */
export async function syncDrive(): Promise<SyncResult> {
  return (await request<{ data: SyncResult }>('/sync', { method: 'POST' })).data
}

/** DELETE /api/files/:id */
export async function deleteFile(id: string): Promise<void> {
  await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type Health = { status: string; uptime: number; database: string }

/**
 * GET /health — resolves only once the server is up with its database connected.
 * A sleeping host may hang, answer 502/503 or serve an HTML holding page; all of
 * those reject, as does running past `timeoutMs`.
 */
export async function checkHealth(timeoutMs: number, signal?: AbortSignal): Promise<Health> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const response = await fetch(`${ORIGIN}/health`, {
    cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) throw new Error(`GET /health failed with ${response.status}`)
  if (json.database !== 'connected') throw new Error(`Database is ${json.database}`)
  return json as Health
}

/** GET /api/files/:id/stream — used directly as <audio src> / <img src>. */
export const streamUrl = (id: string) => `${BASE}/${encodeURIComponent(id)}/stream`

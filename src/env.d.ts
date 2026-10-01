interface ImportMetaEnv {
  /** Base URL of the Google Drive storage API, e.g. http://localhost:5000 */
  readonly VITE_API_URL?: string
  /** Sent as x-api-key on write routes; only needed once the server sets API_KEY */
  readonly VITE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

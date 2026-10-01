import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { checkHealth, type Health } from '../lib/api'
import { ServerContext, type ServerStatus, type ServerValue } from './serverStore'

/** An awake server answers well inside this; slower means it is booting. */
const QUICK_TIMEOUT = 6_000
/** Each probe while waking may wait this long — some hosts hold the request until boot. */
const PROBE_TIMEOUT = 20_000
const RETRY_EVERY = 3_000
const GIVE_UP_AFTER = 3 * 60_000
/** Pings while the tab is visible, so the host never idles out under a listener. */
const KEEP_ALIVE_EVERY = 4 * 60_000

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(timer), resolve()), { once: true })
  })

export function ServerProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServerStatus>('checking')
  const [wakingSince, setWakingSince] = useState<number | null>(null)
  const [upSince, setUpSince] = useState<number | null>(null)
  const [lastWake, setLastWake] = useState<ServerValue['lastWake']>(null)
  // The probe loop in flight, if any.
  const loop = useRef<AbortController | null>(null)

  const probe = useCallback(() => {
    if (loop.current) return
    const controller = new AbortController()
    loop.current = controller
    const { signal } = controller

    const markOnline = (health: Health, tookMs: number | null) => {
      const now = Date.now()
      setStatus('online')
      setWakingSince(null)
      setUpSince(now - health.uptime * 1000)
      if (tookMs !== null) setLastWake({ at: now, tookMs })
    }

    void (async () => {
      const started = Date.now()
      try {
        markOnline(await checkHealth(QUICK_TIMEOUT, signal), null)
        return
      } catch {
        if (signal.aborted) return
      }

      // No quick answer: the host is asleep (or down). Keep knocking until it boots.
      setStatus('waking')
      setWakingSince(started)
      while (!signal.aborted && Date.now() - started < GIVE_UP_AFTER) {
        try {
          markOnline(await checkHealth(PROBE_TIMEOUT, signal), Date.now() - started)
          return
        } catch {
          await pause(RETRY_EVERY, signal)
        }
      }
      if (!signal.aborted) {
        setStatus('offline')
        setWakingSince(null)
      }
    })().finally(() => {
      if (loop.current === controller) loop.current = null
    })
  }, [])

  useEffect(() => {
    probe()

    const onVisible = () => {
      if (document.visibilityState === 'visible') probe()
    }
    const keepAlive = setInterval(onVisible, KEEP_ALIVE_EVERY)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', probe)

    return () => {
      clearInterval(keepAlive)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', probe)
      loop.current?.abort()
      loop.current = null
    }
  }, [probe])

  const wake = useCallback(() => {
    setStatus((current) => (current === 'offline' ? 'checking' : current))
    probe()
  }, [probe])

  const value = useMemo<ServerValue>(
    () => ({ status, wakingSince, upSince, lastWake, wake }),
    [status, wakingSince, upSince, lastWake, wake],
  )

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
}

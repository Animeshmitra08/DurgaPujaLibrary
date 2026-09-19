import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialMode, ThemeContext, THEME_KEY, type ThemeMode, type ThemeValue } from './themeStore'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.documentElement.style.colorScheme = mode
    localStorage.setItem(THEME_KEY, mode)
  }, [mode])

  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeValue>(() => ({ mode, toggle }), [mode, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

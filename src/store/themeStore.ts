import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark'

export const THEME_KEY = 'dpl.theme'

export type ThemeValue = {
  mode: ThemeMode
  toggle: () => void
}

export const ThemeContext = createContext<ThemeValue | null>(null)

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}

/** Reads the mode chosen earlier, falling back to the OS preference. */
export function initialMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

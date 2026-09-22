import { useEffect, useId, useRef, useState, type ReactElement } from 'react'
import { CheckIcon, ChevronDownIcon } from './Icons'

export type SelectOption<T extends string | number> = {
  value: T
  label: string
  /** Optional second line, e.g. what a sort order actually does. */
  hint?: string
}

/** `inverse` is for the now-playing screen, where the panel sits over artwork. */
type Tone = 'surface' | 'inverse'

type SelectProps<T extends string | number> = {
  value: T
  options: ReadonlyArray<SelectOption<T>>
  onChange: (value: T) => void
  /** Accessible name, also used as the panel heading. */
  label: string
  icon?: (props: { className?: string }) => ReactElement
  tone?: Tone
  size?: 'sm' | 'md'
  /** Applied to the wrapper, so callers control width and responsive display. */
  className?: string
}

const TONES: Record<Tone, Record<'trigger' | 'panel' | 'heading' | 'option' | 'active' | 'selected', string>> = {
  surface: {
    trigger:
      'border-outline-variant bg-surface-container text-on-surface hover:bg-surface-high focus-visible:border-primary',
    panel: 'border-outline-variant bg-surface-low shadow-2xl',
    heading: 'text-on-surface-variant',
    option: 'text-on-surface',
    active: 'bg-surface-high',
    selected: 'text-primary',
  },
  inverse: {
    trigger: 'border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:border-white/70',
    panel: 'border-white/15 bg-[#1b120a]/95 shadow-2xl backdrop-blur-xl',
    heading: 'text-white/50',
    option: 'text-white/85',
    active: 'bg-white/15',
    selected: 'text-amber-300',
  },
}

const SIZES = {
  sm: 'gap-1.5 px-2.5 py-1.5 text-xs',
  md: 'gap-2 px-3 py-2 text-sm',
}

/**
 * Themed replacement for `<select>`. Native dropdowns render with OS chrome
 * that ignores the app's palette — unreadable over the now-playing artwork in
 * particular — so this draws its own listbox and follows the ARIA combobox
 * pattern: focus stays on the trigger and `aria-activedescendant` tracks the
 * highlighted option.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  icon: Icon,
  tone = 'surface',
  size = 'md',
  className = '',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [drop, setDrop] = useState<'down' | 'up'>('down')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const styles = TONES[tone]

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const selected = options[selectedIndex]

  const show = () => {
    // Flip upwards when the trigger is near the bottom edge — the player bar
    // lives there, and a panel dropped downwards would fall off-screen.
    const rect = triggerRef.current?.getBoundingClientRect()
    const needed = Math.min(options.length * 42 + 40, 300)
    setDrop(rect && window.innerHeight - rect.bottom < needed && rect.top > needed ? 'up' : 'down')
    setActive(selectedIndex)
    setOpen(true)
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  const commit = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Space and the arrow keys are bound globally for playback. While this
    // control has focus they belong to it, so they must not reach window.
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key)) {
      event.stopPropagation()
    }

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        show()
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        setActive((i) => (i + 1) % options.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((i) => (i - 1 + options.length) % options.length)
        break
      case 'Home':
        event.preventDefault()
        setActive(0)
        break
      case 'End':
        event.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        commit(active)
        break
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-label={label}
        onClick={() => (open ? close(false) : show())}
        className={`flex w-full items-center rounded-full border outline-none transition ${SIZES[size]} ${styles.trigger}`}
      >
        {Icon && <Icon className="size-4 shrink-0 opacity-70" />}
        <span className="flex-1 truncate text-left font-medium">{selected?.label ?? ''}</span>
        <ChevronDownIcon
          className={`size-4 shrink-0 opacity-60 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 min-w-full max-w-[min(18rem,80vw)] rounded-2xl border p-1.5 ${
            drop === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${styles.panel}`}
        >
          <p
            className={`px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] ${styles.heading}`}
          >
            {label}
          </p>
          <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <li
                  key={String(option.value)}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={index === active}
                  onPointerEnter={() => setActive(index)}
                  onClick={() => commit(index)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition ${
                    index === active ? styles.active : ''
                  } ${isSelected ? styles.selected : styles.option}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.hint && (
                      <span className={`block truncate text-[11px] ${styles.heading}`}>{option.hint}</span>
                    )}
                  </span>
                  {isSelected && <CheckIcon className="size-4 shrink-0" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

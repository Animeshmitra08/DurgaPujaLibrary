type IconProps = {
  className?: string
  filled?: boolean
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function PlayIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

export function PauseIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4.5" width="4" height="15" rx="1.4" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.4" />
    </svg>
  )
}

export function NextIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 5.6v12.8a1 1 0 0 0 1.54.84l9.2-6.4a1 1 0 0 0 0-1.68l-9.2-6.4A1 1 0 0 0 5 5.6Z" />
      <rect x="17.4" y="4.8" width="2.6" height="14.4" rx="1.3" />
    </svg>
  )
}

export function PrevIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 5.6v12.8a1 1 0 0 1-1.54.84l-9.2-6.4a1 1 0 0 1 0-1.68l9.2-6.4A1 1 0 0 1 19 5.6Z" />
      <rect x="4" y="4.8" width="2.6" height="14.4" rx="1.3" />
    </svg>
  )
}

export function ShuffleIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M16 4h4v4" />
      <path d="M4 20 20 4" />
      <path d="M16 20h4v-4" />
      <path d="M4 4l5 5" />
      <path d="m14.5 14.5 5.5 5.5" />
    </svg>
  )
}

export function RepeatIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M17 2.5 20.5 6 17 9.5" />
      <path d="M3 11.5V10a4 4 0 0 1 4-4h13.5" />
      <path d="M7 21.5 3.5 18 7 14.5" />
      <path d="M21 12.5V14a4 4 0 0 1-4 4H3.5" />
    </svg>
  )
}

export function RepeatOneIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M17 2.5 20.5 6 17 9.5" />
      <path d="M3 11.5V10a4 4 0 0 1 4-4h13.5" />
      <path d="M7 21.5 3.5 18 7 14.5" />
      <path d="M21 12.5V14a4 4 0 0 1-4 4H3.5" />
      <path d="M11.4 10.6 13 9.6v5" strokeWidth="2" />
    </svg>
  )
}

export function HeartIcon({ className = 'size-5', filled = false }: IconProps) {
  return (
    <svg className={className} {...base} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7Z" />
    </svg>
  )
}

export function VolumeIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M11 5 6.5 8.6H3.5v6.8h3L11 19Z" fill="currentColor" />
      <path d="M15.2 9.3a3.8 3.8 0 0 1 0 5.4" />
      <path d="M18 6.5a7.7 7.7 0 0 1 0 11" />
    </svg>
  )
}

export function VolumeLowIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M11 5 6.5 8.6H3.5v6.8h3L11 19Z" fill="currentColor" />
      <path d="M15.2 9.3a3.8 3.8 0 0 1 0 5.4" />
    </svg>
  )
}

export function MuteIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M11 5 6.5 8.6H3.5v6.8h3L11 19Z" fill="currentColor" />
      <path d="m15.5 9.5 5 5" />
      <path d="m20.5 9.5-5 5" />
    </svg>
  )
}

export function QueueIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M3 6h12" />
      <path d="M3 12h12" />
      <path d="M3 18h8" />
      <path d="M17 10.5v8.2" />
      <circle cx="15" cy="18.7" r="2" />
      <path d="M17 10.5 21 9v3l-4 1.5" />
    </svg>
  )
}

export function SearchIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function LibraryIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="3" y="4" width="4" height="16" rx="1.2" />
      <rect x="9" y="4" width="4" height="16" rx="1.2" />
      <path d="m15.6 5.4 3.4-.9 3 11.6-3.4.9Z" />
    </svg>
  )
}

export function ClockIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function UploadIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  )
}

export function TrashIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      <path d="M10.5 10v6.5M13.5 10v6.5" />
    </svg>
  )
}

export function CloseIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function LockIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14.5v2.5" />
    </svg>
  )
}

export function MusicIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M9 18V6.2l10-2.2V16" />
      <circle cx="6.5" cy="18" r="2.6" />
      <circle cx="16.5" cy="16" r="2.6" />
    </svg>
  )
}

export function SpeedIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4.5 18a8.5 8.5 0 1 1 15 0" />
      <path d="m14.5 9.5-3 4.2" />
      <circle cx="11" cy="14.6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CheckIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function ChevronUpIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="m6 14.5 6-6 6 6" />
    </svg>
  )
}

export function ChevronDownIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

export function MenuIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function EditIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z" />
      <path d="m15.5 6.5 3 3" />
    </svg>
  )
}

export function PlusIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function SunIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.4 6.4 4.9 4.9M19.1 19.1l-1.5-1.5M17.6 6.4l1.5-1.5M4.9 19.1l1.5-1.5" />
    </svg>
  )
}

export function MoonIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4Z" />
    </svg>
  )
}

export function GridIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  )
}

export function ListIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
      <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function KeyboardIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="2.2" />
      <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 14.5h12" />
    </svg>
  )
}

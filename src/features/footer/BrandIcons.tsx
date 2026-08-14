/**
 * Social marks, drawn here because `lucide-react` v1 removed brand icons entirely.
 *
 * Built in lucide's own idiom — 24×24 box, `currentColor` stroke, 2px width, round caps —
 * so they sit correctly beside the stroked icons used everywhere else in the app rather
 * than arriving as four filled blobs from a different family.
 *
 * These are recognisable geometric marks, not exact trademark reproductions. Each link
 * carries a real text label on its `aria-label`, so recognition never depends on the glyph
 * alone. Swap in official assets before this goes anywhere near production branding.
 */

interface BrandIconProps {
  readonly className?: string
}

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function LinkedInMark({ className }: BrandIconProps) {
  return (
    <svg {...BASE} className={className} aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-11h4v1.5A6 6 0 0 1 16 8z" />
      <rect x="2" y="9" width="4" height="12" rx="0.5" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function InstagramMark({ className }: BrandIconProps) {
  return (
    <svg {...BASE} className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  )
}

export function XMark({ className }: BrandIconProps) {
  return (
    <svg {...BASE} className={className} aria-hidden>
      {/* The two strokes of the X wordmark, at its characteristic angles. */}
      <path d="M3 3l7.5 9.5L3.5 21" />
      <path d="M20.5 3L13 12.5 21 21" />
      <path d="M10.5 12.5L13 12.5" />
    </svg>
  )
}

export function YouTubeMark({ className }: BrandIconProps) {
  return (
    <svg {...BASE} className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" fill="currentColor" />
    </svg>
  )
}

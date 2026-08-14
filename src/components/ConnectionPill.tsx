import type { FeedHealth } from '../types/bess'
import { CONNECTION_VISUALS } from './statusVisuals'
import { formatAge, formatClock } from '../utils/format'
import { cn } from '../utils/cn'

/**
 * The most important component in the console.
 *
 * It answers "can I believe this screen?", and it is the one badge that must never lie.
 * The age is always shown, including while LIVE, so the operator can see the clock
 * ticking rather than trusting a word. When the feed stops, the age keeps counting up —
 * that visibly moving number is the proof the page has not simply frozen.
 */

interface ConnectionPillProps {
  readonly health: FeedHealth
  readonly className?: string
}

export function ConnectionPill({ health, className }: ConnectionPillProps) {
  const visual = CONNECTION_VISUALS[health.connection]
  const Icon = visual.icon
  const hasFrame = health.lastFrameAt !== null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full border px-3 py-1.5',
        visual.bg,
        visual.border,
        className,
      )}
      /* A live region: when the feed drops, a screen-reader user is told, rather than
         being left reading numbers that stopped updating half a minute ago. */
      role="status"
      aria-live="polite"
      title={visual.meaning}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            visual.dot,
            /* Only a genuinely live feed is allowed to pulse. A pulsing dot reads as
               "something is happening", so a stale feed must be still. */
            visual.animated && 'animate-pulse-live',
          )}
        />
      </span>

      <Icon className={cn('h-3.5 w-3.5 shrink-0', visual.text)} aria-hidden />

      <span className={cn('font-mono text-eyebrow font-semibold uppercase', visual.text)}>
        {visual.label}
      </span>

      <span className="font-mono text-caption text-ink-400">
        {hasFrame ? `${formatAge(health.ageMs)} ago · ${formatClock(health.lastFrameAt)}` : 'no data yet'}
      </span>
    </div>
  )
}

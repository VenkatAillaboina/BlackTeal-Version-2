import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

/**
 * The project's panel surface.
 *
 * Deliberately thin: a background, a hairline, a radius, and an optional heading. It
 * does not accept twenty-five props for every variation it might one day need
 * (Rule 24) — a panel that needs to look different composes different children instead.
 */

interface GlassCardProps {
  readonly children: ReactNode
  /** Rendered as the panel's eyebrow. Omit for an unlabelled surface. */
  readonly title?: string
  /** Sits opposite the title — a badge, a count, a control. */
  readonly action?: ReactNode
  readonly className?: string
  /** Removes the inner padding, for panels whose child manages its own edges. */
  readonly flush?: boolean
}

export function GlassCard({ children, title, action, className, flush = false }: GlassCardProps) {
  const hasHeader = title !== undefined || action !== undefined

  return (
    <section
      /* No backdrop-blur. Rule 11 bans heavy filters, and here it was pure cost: these
         panels sit on an opaque page, so there was never anything behind them to blur.
         The surface is an opaque fill instead of a translucent one for the same reason. */
      className={cn('rounded-panel border border-ink-800 bg-ink-950 shadow-panel', className)}
    >
      {hasHeader ? (
        <header className="flex items-center justify-between gap-4 border-b border-ink-800 px-4 py-3">
          {title !== undefined ? <h2 className="eyebrow">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

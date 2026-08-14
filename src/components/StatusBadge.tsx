import type { AssetStatus } from '../types/bess'
import { STATUS_VISUALS } from './statusVisuals'
import { describeStatus } from '../utils/assetStatus'
import { cn } from '../utils/cn'

/**
 * An asset's status, shown four ways at once: colour, icon, word, and a description on
 * the accessible label. Rule 15 in a single component — there is no prop that turns the
 * text off, because a colour-only badge is the thing this component exists to prevent.
 */

interface StatusBadgeProps {
  readonly status: AssetStatus
  /** Hides the word for tight rows. The icon and the title text still carry it. */
  readonly compact?: boolean
  readonly className?: string
}

export function StatusBadge({ status, compact = false, className }: StatusBadgeProps) {
  const visual = STATUS_VISUALS[status]
  const Icon = visual.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5',
        visual.bg,
        visual.border,
        visual.text,
        className,
      )}
      title={describeStatus(status)}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className={cn('font-mono text-eyebrow font-medium', compact && 'sr-only')}>
        {visual.label}
      </span>
    </span>
  )
}

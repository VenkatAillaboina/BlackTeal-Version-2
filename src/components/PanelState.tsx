import { CircleSlash, Loader2, TriangleAlert, WifiOff } from 'lucide-react'
import { cn } from '../utils/cn'

/**
 * The states a data panel can be in when it has nothing useful to draw.
 *
 * Rule 14 lists seven states every data-driven view must handle. Four of them —
 * loading, empty, error, disconnected — replace the content entirely, so they are one
 * component rather than four copies of the same centred layout in four features. The
 * other three (live, stale, offline) render real content and are handled where the data
 * is drawn.
 *
 * Each state says what happened *and* what it means. "No alarms" is good news;
 * "no data" is not; the two must not look alike.
 */

type PanelStateKind = 'loading' | 'empty' | 'error' | 'disconnected'

interface PanelStateProps {
  readonly kind: PanelStateKind
  readonly title: string
  /** One sentence saying what the operator should conclude or do. */
  readonly detail: string
  readonly className?: string
}

const KIND_VISUALS = {
  loading: { icon: Loader2, tone: 'text-ink-400', spin: true },
  empty: { icon: CircleSlash, tone: 'text-ink-400', spin: false },
  error: { icon: TriangleAlert, tone: 'text-status-fault', spin: false },
  disconnected: { icon: WifiOff, tone: 'text-status-stale', spin: false },
} as const

export function PanelState({ kind, title, detail, className }: PanelStateProps) {
  const visual = KIND_VISUALS[kind]
  const Icon = visual.icon

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <Icon
        className={cn('h-6 w-6', visual.tone, visual.spin && 'animate-spin')}
        aria-hidden
      />
      <div>
        <p className={cn('font-mono text-caption font-semibold uppercase tracking-wider', visual.tone)}>
          {title}
        </p>
        <p className="mt-1.5 max-w-xs text-caption text-ink-400">{detail}</p>
      </div>
    </div>
  )
}

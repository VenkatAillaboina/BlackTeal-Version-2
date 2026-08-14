import { cn } from '../utils/cn'

/**
 * How much of a skid's nameplate power is actually available right now.
 *
 * The gap between the fill and the track is the derate, and it is the single most
 * useful thing on a skid card: it turns "output is lower than expected" into "the pack
 * will not allow more than this".
 *
 * The fill is animated with `scaleX`, not `width`. Animating width forces layout on
 * every frame for every bar on screen; a transform is composited and stays at 60 FPS
 * with a dozen of them ticking at once (Rule 11).
 */

interface HeadroomBarProps {
  readonly label: string
  /** What the asset will currently allow, in kW. Null when it is not reporting. */
  readonly availableKW: number | null
  readonly nameplateKW: number
  readonly className?: string
}

export function HeadroomBar({ label, availableKW, nameplateKW, className }: HeadroomBarProps) {
  const isKnown = availableKW !== null && nameplateKW > 0
  const ratio = isKnown ? Math.min(1, Math.max(0, availableKW / nameplateKW)) : 0
  const percent = Math.round(ratio * 100)
  const isDerated = isKnown && ratio < 0.995

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow truncate">{label}</span>
        <span
          className={cn(
            'shrink-0 font-mono text-caption tabular-nums',
            !isKnown ? 'text-ink-500' : isDerated ? 'text-status-warning' : 'text-ink-200',
          )}
        >
          {isKnown ? `${String(percent)} %` : 'unknown'}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-800"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isKnown ? percent : undefined}
        aria-label={
          isKnown
            ? `${label}: ${String(percent)} percent of nameplate available`
            : `${label}: not reporting`
        }
      >
        <div
          className={cn(
            'h-full w-full origin-left rounded-full transition-transform duration-settle ease-apple',
            !isKnown ? 'bg-ink-700' : isDerated ? 'bg-status-warning' : 'bg-teal-core',
          )}
          style={{ transform: `scaleX(${String(ratio)})` }}
        />
      </div>

      {/* The reason, in words. A shortened bar on its own does not explain itself. */}
      {isDerated ? (
        <p className="mt-1.5 text-caption text-status-warning">
          Derated — {String(Math.round(availableKW))} kW of {String(nameplateKW)} kW available
        </p>
      ) : null}
    </div>
  )
}

import type { FormattedValue } from '../utils/format'
import { NO_VALUE, joinValue } from '../utils/format'
import { cn } from '../utils/cn'

/**
 * One labelled number.
 *
 * The unit is typeset separately from the value so it can be smaller without the two
 * ever disagreeing — both come from the same `FormattedValue`, which the formatters in
 * `utils/format.ts` produce. This component does no arithmetic and no unit conversion
 * (Rule 4); it is handed a formatted value and lays it out.
 *
 * When the value is unknown it renders an em dash in muted ink and drops the unit's
 * emphasis. A missing reading must look missing, not look like zero.
 */

interface MetricReadoutProps {
  readonly label: string
  readonly value: FormattedValue
  /** Applied to the number only, e.g. to colour a temperature that is too high. */
  readonly toneClassName?: string
  readonly size?: 'md' | 'lg'
  /** Dims the whole readout, for values the feed can no longer vouch for. */
  readonly untrusted?: boolean
  readonly className?: string
}

export function MetricReadout({
  label,
  value,
  toneClassName,
  size = 'md',
  untrusted = false,
  className,
}: MetricReadoutProps) {
  const isMissing = value.text === NO_VALUE

  return (
    <div className={cn('min-w-0', untrusted && 'opacity-60', className)}>
      <p className="eyebrow truncate">{label}</p>
      <p
        className={cn(
          'mt-1.5 font-mono tabular-nums',
          size === 'lg' ? 'text-readout-lg' : 'text-readout',
          isMissing ? 'text-ink-500' : (toneClassName ?? 'text-ink-50'),
        )}
        /* The visible text splits the number from its unit for typography; the label
           puts them back together so assistive tech reads "41.2 degrees Celsius". */
        aria-label={`${label}: ${isMissing ? 'no reading' : joinValue(value)}`}
      >
        {value.text}
        {value.unit === '' ? null : (
          <span className={cn('ml-1.5 text-caption', isMissing ? 'text-ink-600' : 'text-ink-400')}>
            {value.unit}
          </span>
        )}
      </p>
    </div>
  )
}

/**
 * The dense variant: a label on the left, a value on the right, one line. Used in
 * detail lists where a dozen readings sit together and the grid form would be wasteful.
 */
interface MetricRowProps {
  readonly label: string
  readonly value: FormattedValue
  readonly toneClassName?: string
  readonly className?: string
}

export function MetricRow({ label, value, toneClassName, className }: MetricRowProps) {
  const isMissing = value.text === NO_VALUE

  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <span className="truncate text-caption text-ink-300">{label}</span>
      <span
        className={cn(
          'shrink-0 font-mono text-caption tabular-nums',
          isMissing ? 'text-ink-500' : (toneClassName ?? 'text-ink-100'),
        )}
      >
        {value.text}
        {value.unit === '' ? null : <span className="ml-1 text-ink-400">{value.unit}</span>}
      </span>
    </div>
  )
}

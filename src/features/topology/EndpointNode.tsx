import type { AssetStatus, TopologyAsset } from '../../types/bess'
import type { FormattedValue } from '../../utils/format'
import { NODE_BOXES, boxOrigin } from './geometry'
import { STATUS_VISUALS } from '../../components/statusVisuals'
import { describeStatus } from '../../utils/assetStatus'
import { cn } from '../../utils/cn'

/**
 * The two ends of the site: the grid substation and the data centre it feeds.
 *
 * One component for both because they genuinely are the same object — a box with a
 * name, one headline number and a secondary line — and not because they happened to
 * look similar once (Rule 24). Everything that differs between them arrives as a prop;
 * there is no `variant` branch inside.
 */

interface EndpointNodeProps {
  readonly asset: TopologyAsset
  readonly status: AssetStatus
  readonly headline: FormattedValue
  /** Colour class for the headline number, e.g. copper while importing. */
  readonly headlineToneClass: string
  readonly caption: string
  readonly isSelected: boolean
  readonly onSelect: (asset: TopologyAsset) => void
}

export function EndpointNode({
  asset,
  status,
  headline,
  headlineToneClass,
  caption,
  isSelected,
  onSelect,
}: EndpointNodeProps) {
  const box = NODE_BOXES[asset.kind]
  const { x, y } = boxOrigin(asset.kind, asset.x, asset.y)
  const visual = STATUS_VISUALS[status]
  const centreX = x + box.width / 2

  return (
    <g
      className="group cursor-pointer focus:outline-none"
      role="button"
      tabIndex={0}
      aria-label={`${asset.label}. ${visual.label}. ${headline.text} ${headline.unit}. ${caption}.`}
      onClick={() => {
        onSelect(asset)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(asset)
        }
      }}
    >
      <title>{`${asset.label} — ${describeStatus(status)}`}</title>

      <rect
        x={x - 4}
        y={y - 4}
        width={box.width + 8}
        height={box.height + 8}
        rx={18}
        fill="none"
        strokeWidth={2}
        className="stroke-teal-live opacity-0 transition-opacity duration-instant group-focus-visible:opacity-100"
      />

      <rect
        x={x}
        y={y}
        width={box.width}
        height={box.height}
        rx={14}
        className={cn(
          'fill-ink-900 transition-[stroke] duration-quick ease-apple',
          isSelected ? 'stroke-teal-core' : 'stroke-ink-700 group-hover:stroke-ink-500',
        )}
        strokeWidth={isSelected ? 1.75 : 1}
      />

      <circle cx={x + 15} cy={y + 18} r={3.5} className={visual.fill} />

      <text x={centreX} y={y + 22} textAnchor="middle" className="fill-ink-200 font-sans text-[12px] font-medium">
        {asset.kind === 'substation' ? 'Grid substation' : 'Data centre'}
      </text>

      <text x={centreX} y={y + 56} textAnchor="middle" className={cn('font-mono text-[24px] font-medium', headlineToneClass)}>
        {headline.text}
        <tspan className="fill-ink-400 text-[11px]"> {headline.unit}</tspan>
      </text>

      <text x={centreX} y={y + 78} textAnchor="middle" className="fill-ink-400 font-mono text-[10px]">
        {caption}
      </text>
    </g>
  )
}

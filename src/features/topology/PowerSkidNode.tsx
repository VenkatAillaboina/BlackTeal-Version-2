import type { SkidFrame, TopologyAsset } from '../../types/bess'
import { NODE_BOXES, boxOrigin } from './geometry'
import { STATUS_VISUALS } from '../../components/statusVisuals'
import { formatPower, powerDirection } from '../../utils/format'
import { describeStatus } from '../../utils/assetStatus'
import { cn } from '../../utils/cn'

/**
 * One power skid on the schematic.
 *
 * Focusable and operable from the keyboard, because the site map is the primary way to
 * open an asset and a mouse-only diagram would lock out anyone who cannot use one
 * (Rule 16). SVG does not take a CSS ring, so the focus indicator is a real rect drawn
 * inside the node and revealed by `group-focus-visible`.
 *
 * An offline skid renders no numbers at all — not stale ones, not zeroes. The box goes
 * quiet and says "no data", which is the honest picture (Rule 13).
 */

interface PowerSkidNodeProps {
  readonly asset: TopologyAsset
  /** Undefined when the id is absent from the frame entirely. */
  readonly frame: SkidFrame | undefined
  readonly isSelected: boolean
  readonly onSelect: (asset: TopologyAsset) => void
}

export function PowerSkidNode({ asset, frame, isSelected, onSelect }: PowerSkidNodeProps) {
  const box = NODE_BOXES.skid
  const { x, y } = boxOrigin(asset.kind, asset.x, asset.y)

  const status = frame?.status ?? 'OFFLINE'
  const visual = STATUS_VISUALS[status]
  const powerKW = frame?.pcs?.power_kW ?? null
  const socPct = frame?.battery?.soc_pct ?? null
  const isReporting = frame !== undefined && frame.pcs !== null

  const power = formatPower(powerKW)
  const direction = powerDirection(powerKW)
  const powerToneClass =
    direction === 'charging'
      ? 'fill-copper'
      : direction === 'discharging'
        ? 'fill-teal-live'
        : 'fill-ink-400'

  const accessibleName = isReporting
    ? `${asset.label}. ${visual.label}. ${power.text} ${power.unit}. State of charge ${socPct === null ? 'unknown' : `${String(Math.round(socPct))} percent`}.`
    : `${asset.label}. ${visual.label}. No telemetry.`

  return (
    <g
      className="group cursor-pointer focus:outline-none"
      role="button"
      tabIndex={0}
      aria-label={accessibleName}
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

      {/* Focus indicator. Sits outside the box so it never covers the readings. */}
      <rect
        x={x - 4}
        y={y - 4}
        width={box.width + 8}
        height={box.height + 8}
        rx={14}
        fill="none"
        strokeWidth={2}
        className="stroke-teal-live opacity-0 transition-opacity duration-instant group-focus-visible:opacity-100"
      />

      <rect
        x={x}
        y={y}
        width={box.width}
        height={box.height}
        rx={11}
        className={cn(
          'fill-ink-950 transition-[stroke,fill] duration-quick ease-apple',
          isSelected ? 'stroke-teal-core' : 'stroke-ink-700 group-hover:stroke-ink-500',
        )}
        strokeWidth={isSelected ? 1.75 : 1}
      />

      {/* Status is a dot AND a word in the accessible name AND the colour of the value
          below — never the colour alone. */}
      <circle cx={x + 15} cy={y + 17} r={3.5} className={visual.fill} />

      <text
        x={x + 27}
        y={y + 21}
        className="fill-ink-200 font-sans text-[12px] font-medium"
      >
        {asset.label.replace('Power skid', 'Skid')}
      </text>

      {isReporting ? (
        <>
          <text x={x + 15} y={y + 42} className={cn('font-mono text-[17px] font-medium', powerToneClass)}>
            {power.text}
            <tspan className="fill-ink-400 text-[10px]"> {power.unit}</tspan>
          </text>

          <text x={x + box.width - 15} y={y + 42} textAnchor="end" className="fill-ink-300 font-mono text-[11px]">
            {socPct === null ? '—' : `${String(Math.round(socPct))}%`}
          </text>

          {/* State of charge. Scaled with a transform rather than a width so it is
              composited like every other bar in the app. */}
          <rect x={x + 15} y={y + 48} width={box.width - 30} height={3} rx={1.5} className="fill-ink-800" />
          <rect
            x={x + 15}
            y={y + 48}
            width={box.width - 30}
            height={3}
            rx={1.5}
            className="origin-left fill-teal-deep transition-transform duration-settle ease-apple"
            style={{
              transform: `scaleX(${String((socPct ?? 0) / 100)})`,
              transformOrigin: `${String(x + 15)}px ${String(y + 48)}px`,
            }}
          />
        </>
      ) : (
        <text x={x + 15} y={y + 41} className="fill-ink-500 font-mono text-[12px]">
          no data
        </text>
      )}
    </g>
  )
}

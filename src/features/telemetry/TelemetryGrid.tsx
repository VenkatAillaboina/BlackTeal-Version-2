import type { AssetId, SiteFrame } from '../../types/bess'
import { GlassCard } from '../../components/GlassCard'
import { StatusBadge } from '../../components/StatusBadge'
import { PanelState } from '../../components/PanelState'
import { SKID_IDS, assetLabel } from '../../simulation/siteTopology'
import { NO_VALUE, formatKilowatts, formatPercent, formatTemperature, powerDirection } from '../../utils/format'
import { cn } from '../../utils/cn'

/**
 * The fleet as a table.
 *
 * Deliberately a different reading of the same data as the site diagram: the map answers
 * "where is the problem", this answers "compare all six". Six aligned rows of tabular
 * figures can be scanned in a way six boxes scattered across a diagram cannot.
 *
 * Four things were wrong with the first version and are fixed here:
 *
 *  1. **Five columns stretched across a wide panel.** The skid name ended up a long way
 *     from its own numbers, so following a row meant tracking across empty space.
 *     Explicit `<colgroup>` widths now hold the numeric columns together on the right.
 *  2. **Status was stranded in the far column.** Health is part of an asset's identity,
 *     not a trailing statistic, so the badge now sits with the name.
 *  3. **Every cell repeated its unit** — `kW`, `%`, `°C` on all six rows — while the
 *     header said the same thing. The units live in the headers alone now, which is what
 *     lets the numbers line up as a single readable column.
 *  4. **State of charge was a bare number.** It carries a bar now, because "which pack is
 *     lowest" should be answerable without reading six numbers.
 *
 * The whole row is the target, not just the label. One click handler on the row; the
 * button inside has none and relies on its click bubbling, so mouse and keyboard run the
 * same path with no nested interactive element.
 */

interface TelemetryGridProps {
  readonly frame: SiteFrame | null
  readonly selectedAssetId: AssetId
  readonly onSelect: (assetId: AssetId) => void
}

/**
 * The unit inside a column heading.
 *
 * `normal-case` because the heading style uppercases everything, and an uppercased unit
 * is simply the wrong unit — kW is not KW, and °C is not °c. Dimmer than the label so the
 * eye reads the measure first and the unit only when it needs to.
 */
function UnitLabel({ children }: { children: string }) {
  return <span className="normal-case text-ink-600">{children}</span>
}

export function TelemetryGrid({ frame, selectedAssetId, onSelect }: TelemetryGridProps) {
  if (frame === null) {
    return (
      <GlassCard title="Fleet">
        <PanelState kind="loading" title="Connecting" detail="Skid readings appear with the first frame." />
      </GlassCard>
    )
  }

  return (
    <GlassCard title="Fleet" flush>
      <table className="w-full border-collapse text-caption">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[18%]" />
          <col className="w-[26%]" />
          {/* Hidden below `sm`; the column still has to be declared to keep widths sane. */}
          <col className="w-[18%]" />
        </colgroup>

        <thead>
          <tr className="border-b border-ink-800">
            <th scope="col" className="eyebrow py-2.5 pl-4 pr-3 text-left">Skid</th>
            <th scope="col" className="eyebrow py-2.5 pl-3 pr-3 text-right">
              Power <UnitLabel>kW</UnitLabel>
            </th>
            <th scope="col" className="eyebrow py-2.5 pl-3 pr-3 text-right">
              Charge <UnitLabel>%</UnitLabel>
            </th>
            <th scope="col" className="eyebrow hidden py-2.5 pl-3 pr-4 text-right sm:table-cell">
              Hottest <UnitLabel>°C</UnitLabel>
            </th>
          </tr>
        </thead>

        <tbody>
          {SKID_IDS.map((id) => {
            const asset = frame.assets[id]
            const skid = asset?.kind === 'skid' ? asset : undefined
            const powerKW = skid?.pcs?.power_kW ?? null
            const power = formatKilowatts(powerKW)
            const direction = powerDirection(powerKW)
            const socPct = skid?.battery?.soc_pct ?? null
            const tempC = skid?.battery?.cell_temp_max_C ?? null
            const isSelected = selectedAssetId === id
            const status = skid?.status ?? 'OFFLINE'

            return (
              <tr
                key={id}
                onClick={() => {
                  onSelect(id)
                }}
                aria-selected={isSelected}
                className={cn(
                  'group cursor-pointer border-b border-ink-800/50 transition-colors duration-instant last:border-b-0',
                  isSelected ? 'bg-teal-core/[0.07]' : 'hover:bg-ink-850',
                )}
              >
                <th scope="row" className="py-2.5 pl-0 pr-3 text-left font-normal">
                  <span className="flex items-center gap-3">
                    {/* Selected is a teal bar AND a tinted row, so it survives greyscale. */}
                    <span
                      className={cn('h-9 w-0.5 shrink-0 rounded-r-full', isSelected ? 'bg-teal-core' : 'bg-transparent')}
                      aria-hidden
                    />
                    {/* The badge sits with the name, not pushed to the far edge. Health is
                        part of the asset's identity; a gap between them makes the eye do
                        work for nothing. */}
                    <button
                      type="button"
                      className="shrink-0 truncate rounded-sm text-ink-100 group-hover:text-teal-live"
                    >
                      {assetLabel(id).replace('Power skid', 'Skid')}
                    </button>
                    <StatusBadge status={status} className="shrink-0" />
                  </span>
                </th>

                <td
                  className={cn(
                    'py-2.5 pl-3 pr-3 text-right font-mono tabular-nums',
                    power.text === NO_VALUE
                      ? 'text-ink-600'
                      : direction === 'charging'
                        ? 'text-copper'
                        : direction === 'discharging'
                          ? 'text-teal-live'
                          : 'text-ink-300',
                  )}
                >
                  {power.text}
                </td>

                {/* Bar and number on one line, bar first. Stacking the number above a
                    full-width bar left it floating over the bar's right end, reading as two
                    unrelated marks; side by side it reads as a gauge with its value. */}
                <td className="py-2.5 pl-3 pr-3">
                  <span className="flex items-center justify-end gap-2.5">
                    <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-ink-800" aria-hidden>
                      <span
                        className="block h-full w-full origin-left rounded-full bg-teal-deep transition-transform duration-settle ease-apple"
                        style={{ transform: `scaleX(${String((socPct ?? 0) / 100)})` }}
                      />
                    </span>
                    <span
                      className={cn(
                        'w-7 text-right font-mono tabular-nums',
                        socPct === null ? 'text-ink-600' : 'text-ink-100',
                      )}
                    >
                      {formatPercent(socPct).text}
                    </span>
                  </span>
                </td>

                <td
                  className={cn(
                    'hidden py-2.5 pl-3 pr-4 text-right font-mono tabular-nums sm:table-cell',
                    tempC === null
                      ? 'text-ink-600'
                      : tempC > 50
                        ? 'text-status-fault'
                        : tempC > 40
                          ? 'text-status-warning'
                          : 'text-ink-100',
                  )}
                >
                  {formatTemperature(tempC).text}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </GlassCard>
  )
}

import type { ReactNode } from 'react'
import type { AssetFrame, AssetId, SkidFrame, SubstationFrame, LoadFrame } from '../../types/bess'
import { GlassCard } from '../../components/GlassCard'
import { MetricRow } from '../../components/MetricReadout'
import { HeadroomBar } from '../../components/HeadroomBar'
import { StatusBadge } from '../../components/StatusBadge'
import { PanelState } from '../../components/PanelState'
import { assetLabel } from '../../simulation/siteTopology'
import { describeStatus } from '../../utils/assetStatus'
import {
  describeDirection,
  formatAmps,
  formatCRate,
  formatFrequency,
  formatKilovolts,
  formatMegawatts,
  formatPercent,
  formatPower,
  formatRatio,
  formatResistance,
  formatTemperature,
  formatVolts,
  powerDirection,
} from '../../utils/format'

/**
 * Everything known about one asset.
 *
 * Split by sub-system — pack, inverter, transformer — because that is how the equipment
 * is maintained and how a fault is diagnosed. A single flat list of thirty numbers is
 * technically the same information and practically useless.
 *
 * A sub-system that is not reporting is stated as absent rather than omitted. A missing
 * section reads as "nothing to say"; an explicit "not reporting" reads as "you are
 * blind here", which is the true meaning.
 */

interface AssetDetailPanelProps {
  /* Never null. The console always has an asset open, so this panel is always doing work
     rather than occupying a third of the column with an empty state. */
  readonly assetId: AssetId
  readonly frame: AssetFrame | undefined
}

export function AssetDetailPanel({ assetId, frame }: AssetDetailPanelProps) {
  const title = assetLabel(assetId)

  if (frame === undefined) {
    return (
      <GlassCard title="Asset detail">
        <PanelState
          kind="disconnected"
          title={`${title} is not in this frame`}
          detail="The feed did not include this asset. Its state is unknown."
        />
      </GlassCard>
    )
  }

  return (
    <GlassCard title="Asset detail" action={<StatusBadge status={frame.status} />}>
      <header className="mb-4 border-b border-ink-800 pb-3">
        <h3 className="text-ink-50">{title}</h3>
        <p className="mt-1 text-caption text-ink-400">{describeStatus(frame.status)}</p>
      </header>

      {frame.kind === 'skid' ? <SkidDetail frame={frame} /> : null}
      {frame.kind === 'substation' ? <SubstationDetail frame={frame} /> : null}
      {frame.kind === 'load' ? <LoadDetail frame={frame} /> : null}
    </GlassCard>
  )
}

/* ─────────────────────────────────────────────────────────────── sections ── */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="eyebrow mb-1.5">{title}</h4>
      <div className="divide-y divide-ink-800/60">{children}</div>
    </div>
  )
}

function AbsentSection({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="eyebrow mb-1.5">{title}</h4>
      <p className="py-2 text-caption text-status-stale">{reason}</p>
    </div>
  )
}

function SkidDetail({ frame }: { frame: SkidFrame }) {
  const { battery, pcs, transformer } = frame

  return (
    <>
      {battery === null ? (
        <AbsentSection title="Battery pack" reason="Not reporting. Charge state and temperatures are unknown." />
      ) : (
        <Section title="Battery pack">
          <MetricRow label="State of charge" value={formatPercent(battery.soc_pct, 1)} />
          <MetricRow
            label="State of health"
            value={formatPercent(battery.soh_pct, 1)}
            toneClassName={battery.soh_pct < 90 ? 'text-status-warning' : undefined}
          />
          <MetricRow label="DC bus" value={formatVolts(battery.dc_bus_V)} />
          <MetricRow label="Pack current" value={formatAmps(battery.current_A)} />
          <MetricRow label="C-rate" value={formatCRate(battery.c_rate)} />
          <MetricRow label="Cell voltage min" value={formatVolts(battery.cell_v_min)} />
          <MetricRow label="Cell voltage max" value={formatVolts(battery.cell_v_max)} />
          <MetricRow
            label="Hottest cell"
            value={formatTemperature(battery.cell_temp_max_C)}
            toneClassName={
              battery.cell_temp_max_C > 50
                ? 'text-status-fault'
                : battery.cell_temp_max_C > 40
                  ? 'text-status-warning'
                  : undefined
            }
          />
          <MetricRow label="Cell spread" value={formatTemperature(battery.cell_temp_delta_C)} />
          <MetricRow
            label="Insulation to earth"
            value={formatResistance(battery.insulation_MOhm)}
            toneClassName={battery.insulation_MOhm < 1 ? 'text-status-fault' : undefined}
          />
          <MetricRow
            label="Strings online"
            value={{ text: `${String(battery.strings_online)}/${String(battery.strings_total)}`, unit: '' }}
            toneClassName={
              battery.strings_online < battery.strings_total ? 'text-status-warning' : undefined
            }
          />

          <div className="pt-3">
            <HeadroomBar
              label="Discharge available"
              availableKW={battery.envelope.max_discharge_kW}
              nameplateKW={battery.envelope.nameplate_kW}
            />
          </div>
        </Section>
      )}

      {pcs === null ? (
        <AbsentSection title="Inverter" reason="Not reporting. Output power is unknown." />
      ) : (
        <Section title="Inverter">
          <MetricRow label="Mode" value={{ text: pcs.mode, unit: '' }} />
          <MetricRow label="Direction" value={{ text: describeDirection(powerDirection(pcs.power_kW)), unit: '' }} />
          <MetricRow
            label="Output power"
            value={formatPower(pcs.power_kW)}
            toneClassName={powerDirection(pcs.power_kW) === 'charging' ? 'text-copper' : 'text-teal-live'}
          />
          {/* These three are null on this site's older skids. The formatter renders an
              em dash, so the row still appears and the gap is visible. */}
          <MetricRow label="AC voltage" value={formatVolts(pcs.ac_voltage_V)} />
          <MetricRow label="AC current" value={formatAmps(pcs.ac_current_A)} />
          <MetricRow label="Efficiency" value={formatPercent(pcs.efficiency_pct, 1)} />
          <MetricRow label="DC voltage" value={formatVolts(pcs.dc_voltage_V)} />
          <MetricRow
            label="IGBT temperature"
            value={formatTemperature(pcs.igbt_temp_C, 0)}
            toneClassName={pcs.igbt_temp_C > 80 ? 'text-status-warning' : undefined}
          />
        </Section>
      )}

      {transformer === null ? (
        <AbsentSection title="Transformer" reason="Not reporting." />
      ) : (
        <Section title="Transformer">
          <MetricRow
            label="Winding temperature"
            value={formatTemperature(transformer.temp_C, 0)}
            toneClassName={transformer.temp_C > 95 ? 'text-status-warning' : undefined}
          />
          <MetricRow label="Loading" value={formatPercent(transformer.loading_pct)} />
        </Section>
      )}
    </>
  )
}

function SubstationDetail({ frame }: { frame: SubstationFrame }) {
  const metrics = frame.metrics
  if (metrics === null) {
    return <AbsentSection title="Grid connection" reason="Not reporting. Grid state is unknown." />
  }

  return (
    <Section title="Grid connection">
      <MetricRow label="Bus voltage" value={formatKilovolts(metrics.voltage_kV)} />
      <MetricRow
        label="Frequency"
        value={formatFrequency(metrics.frequency_Hz)}
        toneClassName={
          metrics.frequency_Hz < 59.95 || metrics.frequency_Hz > 60.05 ? 'text-status-warning' : undefined
        }
      />
      <MetricRow
        label="Net import"
        value={formatMegawatts(metrics.import_MW)}
        toneClassName={metrics.import_MW > 0 ? 'text-copper' : 'text-teal-live'}
      />
      <MetricRow label="Power factor" value={formatRatio(metrics.power_factor)} />
      <MetricRow label="Main transformer oil" value={formatTemperature(metrics.tx_oil_temp_C, 0)} />
      <MetricRow label="Main transformer loading" value={formatPercent(metrics.tx_loading_pct)} />
    </Section>
  )
}

function LoadDetail({ frame }: { frame: LoadFrame }) {
  const metrics = frame.metrics
  if (metrics === null) {
    return <AbsentSection title="Facility" reason="Not reporting. Demand is unknown." />
  }

  return (
    <Section title="Facility">
      <MetricRow label="Total demand" value={formatMegawatts(metrics.power_MW)} />
      <MetricRow label="IT load" value={formatMegawatts(metrics.it_load_MW)} />
      <MetricRow label="Power usage effectiveness" value={formatRatio(metrics.pue, 2)} />
      <MetricRow label="Supply voltage" value={formatKilovolts(metrics.voltage_kV)} />
    </Section>
  )
}

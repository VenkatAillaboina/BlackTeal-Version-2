import type { TelemetryState } from '../../types/bess'
import { GlassCard } from '../../components/GlassCard'
import { MetricReadout } from '../../components/MetricReadout'
import { HeadroomBar } from '../../components/HeadroomBar'
import { StatusBadge } from '../../components/StatusBadge'
import { PanelState } from '../../components/PanelState'
import { isFeedTrustworthy } from '../../components/statusVisuals'
import { calculatePowerBalance, summarizeFleet } from '../../utils/powerBalance'
import { formatEnergy, formatMegawatts, formatPercent } from '../../utils/format'

/**
 * The site in six numbers.
 *
 * The power balance row is the honest one: grid plus batteries should equal the load,
 * and when it does not the panel says so rather than hiding the discrepancy. A console
 * that always claims to balance is a console nobody checks.
 *
 * Everything here is computed by `utils/powerBalance.ts`. This component reads the
 * result and lays it out (Rule 20) — there is no arithmetic below.
 */

interface SiteOverviewProps {
  readonly telemetry: TelemetryState
}

export function SiteOverview({ telemetry }: SiteOverviewProps) {
  const { frame, health, error } = telemetry

  if (error !== null) {
    return (
      <GlassCard title="Site overview">
        <PanelState kind="error" title="Telemetry source failed" detail={error} />
      </GlassCard>
    )
  }

  if (frame === null) {
    return (
      <GlassCard title="Site overview">
        <PanelState
          kind="loading"
          title="Connecting"
          detail="No frame has arrived yet. Figures appear once the feed is up."
        />
      </GlassCard>
    )
  }

  const balance = calculatePowerBalance(frame)
  const fleet = summarizeFleet(frame)
  /* Once the feed is not LIVE these are last-known values, so they are dimmed
     everywhere at once rather than each panel deciding for itself. */
  const untrusted = !isFeedTrustworthy(health.connection)

  /* A bare green "Normal" while the feed is dead is a claim the console cannot support:
     the site was normal when the last frame arrived, and nothing since is known. The
     badge is kept — the last known state is still useful — but it is labelled as such
     and dimmed, so it reads as history rather than as a live assertion. */
  const statusAction = untrusted ? (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-eyebrow uppercase text-status-stale">Last known</span>
      <StatusBadge status={fleet.worstStatus} className="opacity-60" />
    </span>
  ) : (
    <StatusBadge status={fleet.worstStatus} />
  )

  return (
    <GlassCard title="Site overview" action={statusAction}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
        <MetricReadout
          label="Grid import"
          value={formatMegawatts(balance.gridImportMW)}
          toneClassName={
            balance.gridImportMW !== null && balance.gridImportMW > 0 ? 'text-copper' : 'text-teal-live'
          }
          untrusted={untrusted}
        />
        <MetricReadout
          label="Battery net"
          value={formatMegawatts(balance.batteryNetMW)}
          toneClassName={
            balance.batteryNetMW !== null && balance.batteryNetMW < 0 ? 'text-copper' : 'text-teal-live'
          }
          untrusted={untrusted}
        />
        <MetricReadout label="Facility load" value={formatMegawatts(balance.loadMW)} untrusted={untrusted} />
        <MetricReadout
          label="Average state of charge"
          value={formatPercent(fleet.averageSocPct, 1)}
          untrusted={untrusted}
        />
        <MetricReadout label="Stored energy" value={formatEnergy(fleet.storedEnergyMWh)} untrusted={untrusted} />
        <MetricReadout
          label="Skids reporting"
          value={{ text: `${String(fleet.reportingSkids)}/${String(fleet.totalSkids)}`, unit: '' }}
          toneClassName={fleet.reportingSkids < fleet.totalSkids ? 'text-status-warning' : 'text-ink-50'}
          untrusted={untrusted}
        />
      </div>

      <div className="mt-6 border-t border-ink-800 pt-5">
        <HeadroomBar
          label="Fleet discharge available"
          availableKW={fleet.availableDischargeKW}
          nameplateKW={fleet.nameplateKW}
        />
      </div>

      {/* The reconciliation check, stated in words. It is the panel's own audit of
          itself, and it must be visible when it fails. */}
      <p className="mt-4 font-mono text-caption text-ink-400">
        {balance.residualMW === null ? (
          'Power balance cannot be checked — one or more assets are not reporting.'
        ) : balance.isBalanced ? (
          <>
            Power balance reconciles to{' '}
            <span className="text-ink-200">{balance.residualMW.toFixed(1)} MW</span> residual.
          </>
        ) : (
          <span className="text-status-warning">
            Power balance does not reconcile — {balance.residualMW.toFixed(1)} MW unaccounted for.
          </span>
        )}
      </p>
    </GlassCard>
  )
}

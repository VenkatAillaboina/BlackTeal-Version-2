import { useMemo, useRef, useState } from 'react'
import { Gauge, LayoutGrid, Network, Siren } from 'lucide-react'
import type { AssetId, TelemetryState, TopologyAsset } from '../../types/bess'
import type { SimulatorControls } from '../../simulation/telemetrySimulator'
import { GlassCard } from '../../components/GlassCard'
import { TabBar } from '../../components/TabBar'
import type { TabDefinition } from '../../components/TabBar'
import { CONNECTION_VISUALS, isFeedTrustworthy } from '../../components/statusVisuals'
import { TopologyMap } from '../topology/TopologyMap'
import { SiteOverview } from '../site-overview/SiteOverview'
import { TelemetryGrid } from '../telemetry/TelemetryGrid'
import { AssetDetailPanel } from '../telemetry/AssetDetailPanel'
import { AlarmTable } from '../alarms/AlarmTable'
import { DemoControls } from './DemoControls'
import { SUBSTATION } from '../../simulation/siteTopology'
import { groupAlarms, tallyAlarms } from '../../utils/alarmGrouping'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * The operator console.
 *
 * Rebuilt around tabs because the single-screen version showed six panels at once and was
 * genuinely hard to read — every panel competed, and on anything narrower than a desktop
 * the two columns stacked into an endless scroll. One section is visible at a time now.
 *
 * The alarm count stays on its tab even while that tab is closed. Hiding a panel is only
 * defensible if the operator can still tell, without switching, that something is waiting
 * in it — otherwise tabs trade clutter for danger.
 *
 * Selection lives here because three sections care about it: the diagram, the fleet table
 * and the detail panel. Lifting it to their nearest common parent is the whole of the
 * state management this screen needs (Rule 25).
 */

type ConsoleTabId = 'overview' | 'diagram' | 'fleet' | 'alarms'

interface OperatorConsoleProps {
  readonly telemetry: TelemetryState
  readonly controls: SimulatorControls | null
}

export function OperatorConsole({ telemetry, controls }: OperatorConsoleProps) {
  const [activeTab, setActiveTab] = useState<ConsoleTabId>('overview')
  /* Opens on the grid connection rather than on nothing, so the detail panel always shows
     real telemetry instead of an empty state. */
  const [selectedAssetId, setSelectedAssetId] = useState<AssetId>(SUBSTATION)

  const { frame, health } = telemetry
  const untrusted = !isFeedTrustworthy(health.connection)
  const selectedFrame = frame?.assets[selectedAssetId]

  const alarmTally = useMemo(() => tallyAlarms(groupAlarms(frame)), [frame])

  const handleSelectAsset = (asset: TopologyAsset): void => {
    setSelectedAssetId(asset.id)
  }

  const rootRef = useRef<HTMLDivElement>(null)
  useScrollReveal(rootRef)

  const tabs: readonly TabDefinition<ConsoleTabId>[] = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'diagram', label: 'Diagram', icon: Network },
    { id: 'fleet', label: 'Fleet', icon: LayoutGrid },
    {
      id: 'alarms',
      label: 'Alarms',
      icon: Siren,
      count: alarmTally.total,
      countToneClass:
        alarmTally.critical > 0
          ? 'bg-status-fault/20 text-status-fault'
          : alarmTally.warning > 0
            ? 'bg-status-warning/20 text-status-warning'
            : 'bg-ink-800 text-ink-200',
    },
  ]

  const panelProps = (id: ConsoleTabId) => ({
    role: 'tabpanel' as const,
    id: `console-panel-${id}`,
    'aria-labelledby': `console-tab-${id}`,
    hidden: activeTab !== id,
  })

  return (
    <div ref={rootRef} className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 lg:py-8">
      <header data-reveal className="mb-5">
        <h1 className="text-xl font-semibold text-ink-50">Operator console</h1>
        <p className="mt-0.5 text-caption text-ink-400">Bantry Ridge · 15 MW / 30 MWh · grid-connected</p>
      </header>

      {/* One banner, once, at the top — rather than a warning stamped on every card. */}
      {untrusted && health.lastFrameAt !== null ? (
        <div className="mb-5 rounded-panel border border-status-stale/40 bg-status-stale/10 px-4 py-3">
          <p className="font-mono text-eyebrow font-semibold uppercase text-status-stale">
            {CONNECTION_VISUALS[health.connection].label} — readings below are not current
          </p>
          <p className="mt-1 text-caption text-ink-300">
            {CONNECTION_VISUALS[health.connection].meaning} Values are dimmed to show they are the last
            ones received, not live measurements.
          </p>
        </div>
      ) : null}

      <div data-reveal className="mb-5">
        <TabBar tabs={tabs} activeId={activeTab} onChange={setActiveTab} idPrefix="console" />
      </div>

      <div data-reveal>
        <div {...panelProps('overview')}>
          <SiteOverview telemetry={telemetry} />
        </div>

        <div {...panelProps('diagram')}>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <GlassCard title="Site single-line diagram">
              <TopologyMap
                frame={frame}
                selectedAssetId={selectedAssetId}
                onSelect={handleSelectAsset}
                isUntrusted={untrusted}
              />
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-caption text-ink-400">
                <LegendSwatch className="bg-teal-live" label="discharging to load" />
                <LegendSwatch className="bg-copper" label="charging from grid" />
                <LegendSwatch className="bg-ink-700" label="no flow" />
                <span className="text-ink-500">Click or press Enter on an asset to open it.</span>
              </p>
            </GlassCard>
            <AssetDetailPanel assetId={selectedAssetId} frame={selectedFrame} />
          </div>
        </div>

        <div {...panelProps('fleet')}>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <TelemetryGrid frame={frame} selectedAssetId={selectedAssetId} onSelect={setSelectedAssetId} />
            <AssetDetailPanel assetId={selectedAssetId} frame={selectedFrame} />
          </div>
        </div>

        <div {...panelProps('alarms')}>
          <AlarmTable telemetry={telemetry} />
        </div>
      </div>

      {/* Scenario controls stay outside the tabs and always visible. They are how anyone
          discovers what this console does under failure, and a demo tool nobody finds is
          the same as one that does not exist. */}
      <div data-reveal className="mt-5">
        <DemoControls controls={controls} />
      </div>
    </div>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-0.5 w-5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  )
}

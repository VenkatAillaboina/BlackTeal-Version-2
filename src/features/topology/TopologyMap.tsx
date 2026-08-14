import { useMemo } from 'react'
import type { AssetId, SiteFrame, TopologyAsset } from '../../types/bess'
import { siteTopology, findAsset, LOAD, SUBSTATION } from '../../simulation/siteTopology'
import { TopologyConnection } from './TopologyConnection'
import { PowerSkidNode } from './PowerSkidNode'
import { EndpointNode } from './EndpointNode'
import { describeLinkFlow } from './linkFlow'
import { formatMegawatts } from '../../utils/format'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { PanelState } from '../../components/PanelState'
import { cn } from '../../utils/cn'

/**
 * The site, drawn from the topology.
 *
 * Nothing here hard-codes a position: assets, links and the viewBox all come from
 * `simulation/siteTopology.ts`, so the diagram is a rendering of the site model rather
 * than a picture that happens to resemble it. Add a seventh skid there and it appears
 * here, wired up, with no change to this file.
 *
 * The SVG scales to its container with `preserveAspectRatio`, which is what keeps the
 * layout readable from 1440 px down to 768 px without a second mobile diagram
 * (Rule 17).
 */

interface TopologyMapProps {
  readonly frame: SiteFrame | null
  readonly selectedAssetId: AssetId
  readonly onSelect: (asset: TopologyAsset) => void
  /** Dims everything that is not live, when the feed can no longer be trusted. */
  readonly isUntrusted: boolean
  readonly className?: string
}

export function TopologyMap({
  frame,
  selectedAssetId,
  onSelect,
  isUntrusted,
  className,
}: TopologyMapProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const substationAsset = findAsset(SUBSTATION)
  const loadAsset = findAsset(LOAD)

  /* Recomputed only when the frame changes, not on every hover or selection — the flow
     for twelve cables is cheap but it is pure work that has no reason to repeat. */
  const linkFlows = useMemo(
    () => siteTopology.links.map((link) => ({ link, flow: describeLinkFlow(link.from, link.to, frame) })),
    [frame],
  )

  const substationFrame = frame?.assets[SUBSTATION]
  const loadFrame = frame?.assets[LOAD]

  const gridImportMW = substationFrame?.kind === 'substation' ? (substationFrame.metrics?.import_MW ?? null) : null
  const loadMW = loadFrame?.kind === 'load' ? (loadFrame.metrics?.power_MW ?? null) : null

  /* A negative import means the site is exporting to the grid, which is a different
     event entirely and gets the teal treatment rather than copper. */
  const isImporting = gridImportMW !== null && gridImportMW > 0

  /* Nothing is ever dimmed by selection. An earlier version faded every asset except the
     open one, which looked good and was wrong: this is a monitoring screen, and a skid
     going amber in the corner must be visible whether or not it happens to be selected.
     The open asset is marked by a teal outline instead — added emphasis, not removed
     information. */

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${String(siteTopology.viewBoxWidth)} ${String(siteTopology.viewBoxHeight)}`}
        preserveAspectRatio="xMidYMid meet"
        className={cn('h-auto w-full transition-opacity duration-settle ease-apple', isUntrusted && 'opacity-45')}
        role="group"
        aria-label="Site single-line diagram. Each asset can be focused and opened."
      >
        {/* Cables first so nodes paint over their endpoints. */}
        {linkFlows.map(({ link, flow }) => {
          const from = findAsset(link.from)
          const to = findAsset(link.to)
          if (from === undefined || to === undefined) return null

          return (
            <TopologyConnection
              key={`${link.from}->${link.to}`}
              from={from}
              to={to}
              flow={flow}
              prefersReducedMotion={prefersReducedMotion || isUntrusted}
            />
          )
        })}

        {substationAsset === undefined ? null : (
          <EndpointNode
            asset={substationAsset}
            status={substationFrame?.status ?? 'OFFLINE'}
            headline={formatMegawatts(gridImportMW === null ? null : Math.abs(gridImportMW))}
            headlineToneClass={gridImportMW === null ? 'fill-ink-500' : isImporting ? 'fill-copper' : 'fill-teal-live'}
            caption={gridImportMW === null ? 'no data' : isImporting ? 'importing' : 'exporting'}
            isSelected={selectedAssetId === SUBSTATION}
            onSelect={onSelect}
          />
        )}

        {siteTopology.assets
          .filter((asset) => asset.kind === 'skid')
          .map((asset) => {
            const assetFrame = frame?.assets[asset.id]
            return (
              <PowerSkidNode
                key={asset.id}
                asset={asset}
                frame={assetFrame?.kind === 'skid' ? assetFrame : undefined}
                isSelected={selectedAssetId === asset.id}
                onSelect={onSelect}
              />
            )
          })}

        {loadAsset === undefined ? null : (
          <EndpointNode
            asset={loadAsset}
            status={loadFrame?.status ?? 'OFFLINE'}
            headline={formatMegawatts(loadMW)}
            headlineToneClass={loadMW === null ? 'fill-ink-500' : 'fill-ink-50'}
            caption={loadMW === null ? 'no data' : 'facility demand'}
            isSelected={selectedAssetId === LOAD}
            onSelect={onSelect}
          />
        )}
      </svg>

      {frame === null ? (
        <div className="absolute inset-0 grid place-items-center bg-ink-void/70">
          <PanelState
            kind="loading"
            title="Connecting to site"
            detail="Waiting for the first telemetry frame. No readings are shown until one arrives."
          />
        </div>
      ) : null}
    </div>
  )
}

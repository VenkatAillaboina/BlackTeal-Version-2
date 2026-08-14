/**
 * What is actually flowing down each cable.
 *
 * Kept out of the components (Rule 20) because the answer is not obvious and must be
 * consistent: the substation-to-skid cable carries power only while that skid is
 * *charging*, and the skid-to-load cable carries power only while it is *discharging*.
 * A skid cannot do both at once, so exactly one of its two cables is ever energised —
 * which is what makes the diagram readable at a glance instead of a wall of moving
 * dashes.
 */

import type { AssetId, AssetStatus, PowerDirection, SiteFrame } from '../../types/bess'
import { SKID_NAMEPLATE_KW, SUBSTATION } from '../../simulation/siteTopology'

export interface LinkFlow {
  readonly direction: PowerDirection
  /** Absolute power on this cable, or null when the skid is not reporting. */
  readonly magnitudeKW: number | null
  /** 0–1, against a single skid's nameplate. Drives dash speed and stroke weight. */
  readonly intensity: number
  readonly status: AssetStatus
  /** False for an idle, offline or unknown cable — nothing should move on it. */
  readonly isEnergised: boolean
}

const IDLE_KW = 20

const DEAD_LINK: LinkFlow = {
  direction: 'idle',
  magnitudeKW: null,
  intensity: 0,
  status: 'OFFLINE',
  isEnergised: false,
}

/**
 * `from`/`to` are the link's endpoints. The skid is whichever end is not the
 * substation or the load, and its power decides everything about the cable.
 */
export function describeLinkFlow(
  from: AssetId,
  to: AssetId,
  frame: SiteFrame | null,
): LinkFlow {
  if (frame === null) return DEAD_LINK

  const isGridSide = from === SUBSTATION
  const skidId = isGridSide ? to : from
  const skid = frame.assets[skidId]

  if (skid === undefined || skid.kind !== 'skid') return DEAD_LINK
  if (skid.pcs === null) return { ...DEAD_LINK, status: skid.status }

  const powerKW = skid.pcs.power_kW
  const isCharging = powerKW < -IDLE_KW
  const isDischarging = powerKW > IDLE_KW

  /* The grid-side cable only carries power while charging; the load-side cable only
     while discharging. The other one is quiet, not merely dimmer. */
  const carries = isGridSide ? isCharging : isDischarging
  const magnitudeKW = Math.abs(powerKW)

  return {
    direction: isCharging ? 'charging' : isDischarging ? 'discharging' : 'idle',
    magnitudeKW,
    intensity: carries ? Math.min(1, magnitudeKW / SKID_NAMEPLATE_KW) : 0,
    status: skid.status,
    isEnergised: carries && skid.status !== 'OFFLINE',
  }
}

/**
 * Stroke colour class for a cable. Teal is power leaving the batteries, copper is power
 * going into them — the same two-colour convention the tokens were built around, so
 * direction never depends on reading an arrowhead.
 */
export function linkStrokeClass(flow: LinkFlow): string {
  if (flow.status === 'OFFLINE') return 'stroke-ink-800'
  if (!flow.isEnergised) return 'stroke-ink-700'
  return flow.direction === 'charging' ? 'stroke-copper' : 'stroke-teal-live'
}

/**
 * Dash cycle time. More power means a faster cycle, bounded so a lightly loaded cable
 * still visibly moves and a fully loaded one does not strobe.
 */
export function linkFlowDurationMs(flow: LinkFlow): number {
  const FASTEST = 550
  const SLOWEST = 1900
  return Math.round(SLOWEST - (SLOWEST - FASTEST) * flow.intensity)
}

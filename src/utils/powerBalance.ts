/**
 * Site-level arithmetic. The console displays these numbers; it does not compute them
 * (Rule 20).
 *
 * Every function here tolerates a missing or partial frame and returns `null` for a
 * figure it cannot honestly produce, rather than substituting zero. A site with three
 * skids offline has an *unknown* stored energy, not 0 MWh.
 */

import type { AssetStatus, SiteFrame, SkidFrame } from '../types/bess'
import { worstOf } from './assetStatus'
import { LOAD, SKID_CAPACITY_MWH, SKID_IDS, SUBSTATION } from '../simulation/siteTopology'

/** Pull the skid frames out of a site frame, skipping ids that are absent entirely. */
function skidFramesOf(frame: SiteFrame): SkidFrame[] {
  const frames: SkidFrame[] = []
  for (const id of SKID_IDS) {
    const asset = frame.assets[id]
    if (asset?.kind === 'skid') frames.push(asset)
  }
  return frames
}

/* ─────────────────────────────────────────────────────────── power balance ── */

export interface PowerBalance {
  /** Positive means the site is drawing from the grid. */
  readonly gridImportMW: number | null
  /** Positive means the batteries are discharging towards the load. */
  readonly batteryNetMW: number | null
  readonly loadMW: number | null
  /** load − (grid + battery). Should sit near zero on a consistent frame. */
  readonly residualMW: number | null
  /** False when the three figures do not reconcile, e.g. mid-outage. */
  readonly isBalanced: boolean
}

const BALANCE_TOLERANCE_MW = 0.6

export function calculatePowerBalance(frame: SiteFrame | null): PowerBalance {
  if (frame === null) {
    return { gridImportMW: null, batteryNetMW: null, loadMW: null, residualMW: null, isBalanced: false }
  }

  const substation = frame.assets[SUBSTATION]
  const load = frame.assets[LOAD]

  const gridImportMW = substation?.kind === 'substation' ? (substation.metrics?.import_MW ?? null) : null
  const loadMW = load?.kind === 'load' ? (load.metrics?.power_MW ?? null) : null

  /* Only reporting skids contribute. An offline skid is excluded rather than counted
     as zero, which is why `batteryNetMW` stays meaningful during a partial outage. */
  let batteryNetMW: number | null = null
  for (const skid of skidFramesOf(frame)) {
    const power = skid.pcs?.power_kW
    if (power === undefined) continue
    batteryNetMW = (batteryNetMW ?? 0) + power / 1000
  }
  const roundedBattery = batteryNetMW === null ? null : Math.round(batteryNetMW * 10) / 10

  const residualMW =
    gridImportMW === null || loadMW === null || roundedBattery === null
      ? null
      : Math.round((loadMW - (gridImportMW + roundedBattery)) * 10) / 10

  return {
    gridImportMW,
    batteryNetMW: roundedBattery,
    loadMW,
    residualMW,
    isBalanced: residualMW !== null && Math.abs(residualMW) <= BALANCE_TOLERANCE_MW,
  }
}

/* ────────────────────────────────────────────────────────────── fleet roll-up ── */

export interface FleetSummary {
  readonly reportingSkids: number
  readonly totalSkids: number
  /** Mean SoC across reporting skids only. Null when nothing is reporting. */
  readonly averageSocPct: number | null
  /** Energy in the packs that are actually talking to us. */
  readonly storedEnergyMWh: number | null
  /** What the fleet could deliver right now, after derates. */
  readonly availableDischargeKW: number | null
  /** What it could deliver if nothing were derated or offline. */
  readonly nameplateKW: number
  readonly worstStatus: AssetStatus
}

export function summarizeFleet(frame: SiteFrame | null): FleetSummary {
  const totalSkids = SKID_IDS.length
  const nameplateKW = totalSkids * 2500

  if (frame === null) {
    return {
      reportingSkids: 0,
      totalSkids,
      averageSocPct: null,
      storedEnergyMWh: null,
      availableDischargeKW: null,
      nameplateKW,
      worstStatus: 'OFFLINE',
    }
  }

  const skids = skidFramesOf(frame)
  const statuses: AssetStatus[] = skids.map((skid) => skid.status)

  let socSum = 0
  let socCount = 0
  let availableKW: number | null = null

  for (const skid of skids) {
    if (skid.battery !== null) {
      socSum += skid.battery.soc_pct
      socCount += 1
      availableKW = (availableKW ?? 0) + skid.battery.envelope.max_discharge_kW
    }
  }

  const averageSocPct = socCount === 0 ? null : Math.round((socSum / socCount) * 10) / 10

  return {
    reportingSkids: socCount,
    totalSkids,
    averageSocPct,
    storedEnergyMWh:
      averageSocPct === null ? null : Math.round(((averageSocPct / 100) * SKID_CAPACITY_MWH * socCount) * 10) / 10,
    availableDischargeKW: availableKW,
    nameplateKW,
    worstStatus: statuses.length === 0 ? 'OFFLINE' : worstOf(statuses),
  }
}

/**
 * The simulated site.
 *
 * A plain module driven by a timer — no React anywhere in this file, and nothing here
 * imports a component (Rule 12, Rule 19). It owns a small physical model of the site
 * and projects that model into an immutable `SiteFrame` on every tick.
 *
 * Two behaviours matter more than the numbers themselves:
 *
 *  • Values *drift* toward targets rather than jumping. A pack that starts derating has
 *    to be watchable, or the console cannot demonstrate anything.
 *
 *  • `dropFeed()` stops emitting frames entirely instead of emitting a frame that says
 *    "disconnected". Silence is what a real dead feed looks like, and it forces the UI
 *    to notice on its own rather than being told (Rule 13).
 */

import type {
  AlarmInstance,
  AssetFrame,
  AssetId,
  BatteryTelemetry,
  PcsTelemetry,
  SiteFrame,
  SkidFrame,
  TransformerTelemetry,
} from '../types/bess'
import { ALARM_DEFINITIONS } from './alarmCatalog'
import { statusFromAlarms } from '../utils/assetStatus'
import {
  LOAD,
  SKID_2,
  SKID_5,
  SKID_IDS,
  SKID_NAMEPLATE_KW,
  SUBSTATION,
} from './siteTopology'

/** How often the source produces a frame. The UI's staleness limits derive from this. */
export const FRAME_INTERVAL_MS = 1000

/** How much faster than real time the packs charge and discharge. See `advanceSkid`. */
const SOC_TIME_COMPRESSION = 6

/* ────────────────────────────────────────────────────────────────  helpers ── */

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Proportional jitter, ±pct. */
function jitter(value: number, pct: number): number {
  return value * (1 + randomBetween(-pct, pct))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Ease a value toward a target. Used wherever a change must be visible, not instant. */
function approach(value: number, target: number, rate: number): number {
  return value + (target - value) * rate
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/* ──────────────────────────────────────────────────────────── the model ── */

/** What the site is being asked to do. Drives the sign of every skid's power. */
export type SiteCommand = 'discharge' | 'charge' | 'idle'

interface SkidModel {
  readonly id: AssetId
  /** False means the skid is not talking to us at all. */
  reporting: boolean
  socPct: number
  sohPct: number
  cellTempMaxC: number
  /** Where the pack temperature is heading. Raising it derates the skid gradually. */
  targetTempC: number
  hvacFault: boolean
  igbtTempC: number
  txTempC: number
  powerKW: number
  insulationMOhm: number
  /** Some skids on this site are an older revision that does not report AC metrics. */
  readonly reportsAcMetrics: boolean
}

function createSkidModel(id: AssetId, index: number): SkidModel {
  return {
    id,
    reporting: true,
    socPct: randomBetween(52, 78),
    /* One pack is deliberately aged so the SOH_DEGRADED info alarm has something to
       fire on, and so the fleet is not unrealistically uniform. */
    sohPct: index === 3 ? 88.4 : randomBetween(96, 99.2),
    cellTempMaxC: randomBetween(28, 33),
    targetTempC: 31,
    hvacFault: false,
    igbtTempC: randomBetween(38, 52),
    txTempC: randomBetween(52, 64),
    powerKW: 0,
    insulationMOhm: randomBetween(2.4, 4.6),
    reportsAcMetrics: index !== 2 && index !== 5,
  }
}

interface SiteModel {
  readonly skids: readonly SkidModel[]
  command: SiteCommand
  loadMW: number
  gridFrequencyHz: number
  gridVoltageKV: number
  txOilTempC: number
  /** When true the simulator emits nothing at all. */
  feedDropped: boolean
}

function createSiteModel(): SiteModel {
  return {
    skids: SKID_IDS.map(createSkidModel),
    command: 'discharge',
    loadMW: 37.4,
    gridFrequencyHz: 60.01,
    gridVoltageKV: 138.2,
    txOilTempC: 58,
    feedDropped: false,
  }
}

/* ──────────────────────────────────────────────────────────────── physics ── */

/**
 * The discharge power the pack will currently allow.
 *
 * This is the whole point of the temperature model: a hot pack cannot deliver
 * nameplate, so the operator sees output fall *and* sees the reason next to it.
 */
function dischargeLimitKW(skid: SkidModel): number {
  if (skid.cellTempMaxC > 50) return 0
  if (skid.cellTempMaxC > 40) return SKID_NAMEPLATE_KW * 0.4
  if (skid.socPct < 8) return 0
  return SKID_NAMEPLATE_KW
}

function chargeLimitKW(skid: SkidModel): number {
  if (skid.cellTempMaxC > 45) return 0
  if (skid.socPct > 95) return 0
  return SKID_NAMEPLATE_KW
}

function advanceSkid(skid: SkidModel, command: SiteCommand): void {
  if (!skid.reporting) return

  /* A failed HVAC unit pushes the pack toward a temperature that trips the derate,
     rather than setting the alarm directly. The alarm is then a consequence of the
     physics, which is what makes the transition watchable. */
  const target = skid.hvacFault ? 53 : skid.targetTempC
  skid.cellTempMaxC = round(approach(skid.cellTempMaxC, target, 0.05) + randomBetween(-0.06, 0.06), 1)

  const wantedKW =
    command === 'discharge'
      ? dischargeLimitKW(skid) * randomBetween(0.72, 0.94)
      : command === 'charge'
        ? -chargeLimitKW(skid) * randomBetween(0.5, 0.8)
        : 0

  // Ramp, never step. Inverters have slew limits and the flow animation reads better.
  skid.powerKW = round(approach(skid.powerKW, wantedKW, 0.18))

  /* SoC follows the energy actually moved: kW for one tick, over pack capacity.
     5 MWh at 2500 kW is a 2 h pack, so one real second moves SoC by ~0.014 %.
     `SOC_TIME_COMPRESSION` speeds that up enough to be watchable without draining the
     site during a demo — at 6× a full pack lasts about twenty minutes, so SoC visibly
     falls within a minute but never bottoms out and triggers a false SOC_LOW cascade. */
  const socDelta =
    (-skid.powerKW / (5 * 1000)) * (FRAME_INTERVAL_MS / 3600_000) * 100 * SOC_TIME_COMPRESSION
  skid.socPct = clamp(skid.socPct + socDelta, 4, 99)

  skid.igbtTempC = round(
    clamp(approach(skid.igbtTempC, 34 + Math.abs(skid.powerKW) / 90, 0.08), 28, 92),
  )
  skid.txTempC = round(
    clamp(approach(skid.txTempC, 46 + Math.abs(skid.powerKW) / 70, 0.06), 40, 105),
  )
  skid.insulationMOhm = round(clamp(jitter(skid.insulationMOhm, 0.01), 0.4, 6), 2)
}

/* ───────────────────────────────────────────────────────────────── alarms ── */

function makeAlarm(
  code: keyof typeof ALARM_DEFINITIONS,
  assetId: AssetId,
  detail: string,
  raisedAt: number,
): AlarmInstance {
  const definition = ALARM_DEFINITIONS[code]
  return {
    code: definition.code,
    severity: definition.severity,
    assetId,
    message: `${definition.title} — ${detail}`,
    raisedAt,
  }
}

/**
 * Alarms are recomputed from the current readings every tick rather than latched, so
 * a cleared condition clears its alarm. `raisedAt` is preserved across ticks by the
 * caller so the age column does not reset every second.
 */
function skidAlarms(skid: SkidModel, now: number): AlarmInstance[] {
  const alarms: AlarmInstance[] = []

  if (!skid.reporting) {
    alarms.push(makeAlarm('COMMS_LOST', skid.id, 'no telemetry received', now))
    return alarms
  }

  if (skid.cellTempMaxC > 50) {
    alarms.push(
      makeAlarm('TEMP_CRIT', skid.id, `hottest cell ${skid.cellTempMaxC.toFixed(1)} °C`, now),
    )
  } else if (skid.cellTempMaxC > 40) {
    alarms.push(
      makeAlarm('TEMP_HIGH', skid.id, `hottest cell ${skid.cellTempMaxC.toFixed(1)} °C`, now),
    )
  }

  if (skid.hvacFault) {
    alarms.push(makeAlarm('HVAC_FAULT', skid.id, 'cooling unit not responding', now))
  }

  if (skid.socPct < 12) {
    alarms.push(makeAlarm('SOC_LOW', skid.id, `${skid.socPct.toFixed(0)} % remaining`, now))
  }

  if (skid.sohPct < 90) {
    alarms.push(makeAlarm('SOH_DEGRADED', skid.id, `${skid.sohPct.toFixed(1)} % of original`, now))
  }

  if (skid.insulationMOhm < 1) {
    alarms.push(
      makeAlarm('INSULATION_LOW', skid.id, `${skid.insulationMOhm.toFixed(2)} MΩ to earth`, now),
    )
  }

  if (skid.txTempC > 95) {
    alarms.push(makeAlarm('TX_TEMP_HIGH', skid.id, `winding ${skid.txTempC.toFixed(0)} °C`, now))
  }

  /* Only report a derate when the skid is actually being asked for power it cannot
     give. An idle skid is not derated, it is simply idle. */
  const limit = dischargeLimitKW(skid)
  if (limit < SKID_NAMEPLATE_KW && limit > 0 && skid.powerKW > 50) {
    alarms.push(
      makeAlarm(
        'PCS_DERATE',
        skid.id,
        `limited to ${String(Math.round(limit))} kW of ${String(SKID_NAMEPLATE_KW)} kW`,
        now,
      ),
    )
  }

  return alarms
}

/* ───────────────────────────────────────────────────────────── projection ── */

function projectSkidFrame(skid: SkidModel, alarms: readonly AlarmInstance[]): SkidFrame {
  if (!skid.reporting) {
    /* Everything null rather than last-known values. Showing a frozen reading next to
       an OFFLINE badge is precisely the lie Rule 13 forbids. */
    return { kind: 'skid', status: 'OFFLINE', pcs: null, battery: null, transformer: null, alarms }
  }

  const limit = dischargeLimitKW(skid)
  const battery: BatteryTelemetry = {
    soc_pct: round(skid.socPct, 1),
    soh_pct: round(skid.sohPct, 1),
    dc_bus_V: round(1180 + (skid.socPct / 100) * 240),
    current_A: round(Math.abs(skid.powerKW) * 1000 / (1180 + (skid.socPct / 100) * 240)),
    power_kW: round(skid.powerKW),
    c_rate: round(Math.abs(skid.powerKW) / SKID_NAMEPLATE_KW / 2, 2),
    cell_v_min: round(3.05 + (skid.socPct / 100) * 0.5, 3),
    cell_v_max: round(3.09 + (skid.socPct / 100) * 0.5, 3),
    cell_temp_min_C: round(skid.cellTempMaxC - randomBetween(1.5, 3.2), 1),
    cell_temp_max_C: round(skid.cellTempMaxC, 1),
    cell_temp_delta_C: round(randomBetween(1.5, 3.2), 1),
    insulation_MOhm: skid.insulationMOhm,
    strings_online: skid.hvacFault ? 11 : 12,
    strings_total: 12,
    envelope: {
      max_charge_kW: round(chargeLimitKW(skid)),
      max_discharge_kW: round(limit),
      nameplate_kW: SKID_NAMEPLATE_KW,
    },
  }

  const pcs: PcsTelemetry = {
    mode:
      skid.cellTempMaxC > 50
        ? 'FAULT'
        : skid.powerKW > 50
          ? 'DISCHARGE'
          : skid.powerKW < -50
            ? 'CHARGE'
            : 'IDLE',
    power_kW: round(skid.powerKW),
    ac_voltage_V: skid.reportsAcMetrics ? round(jitter(690, 0.004)) : null,
    ac_current_A: skid.reportsAcMetrics ? round(Math.abs(skid.powerKW) / 0.69 / 1.732) : null,
    dc_voltage_V: battery.dc_bus_V,
    efficiency_pct: skid.reportsAcMetrics ? round(jitter(97.8, 0.003), 1) : null,
    igbt_temp_C: skid.igbtTempC,
  }

  const transformer: TransformerTelemetry = {
    temp_C: skid.txTempC,
    loading_pct: round(clamp((Math.abs(skid.powerKW) / SKID_NAMEPLATE_KW) * 100, 0, 100)),
  }

  return { kind: 'skid', status: statusFromAlarms(alarms), pcs, battery, transformer, alarms }
}

/* ───────────────────────────────────────────────────────────── the engine ── */

/** Controls the demo panel uses to make each edge case reachable on purpose. */
export interface SimulatorControls {
  start: () => void
  stop: () => void
  /** Stop emitting frames entirely, so the UI has to detect the silence itself. */
  dropFeed: () => void
  restoreFeed: () => void
  isFeedDropped: () => boolean
  /** Take one skid's telemetry away without stopping the rest of the site. */
  toggleSkidComms: (id: AssetId) => void
  /** Fail cooling on skid 2 — the pack heats, derates, then trips. */
  toggleHeatEvent: () => void
  /** Fail cooling on every reporting skid at once, to test alarm flood handling. */
  fireAlarmBurst: () => void
  clearAllFaults: () => void
  setCommand: (command: SiteCommand) => void
  getCommand: () => SiteCommand
}

export function createTelemetrySimulator(
  onFrame: (frame: SiteFrame) => void,
): SimulatorControls {
  const site = createSiteModel()
  let timer: ReturnType<typeof setInterval> | null = null

  /* Alarm identity is (code, asset). Keeping first-seen times here means an alarm that
     persists across ticks keeps its original age instead of resetting to 0s every
     second, which would make the age column useless. */
  const firstSeenAt = new Map<string, number>()

  function stampRaisedAt(alarms: readonly AlarmInstance[], now: number): AlarmInstance[] {
    const active = new Set<string>()
    const stamped = alarms.map((alarm) => {
      const key = `${alarm.code}:${alarm.assetId}`
      active.add(key)
      const seen = firstSeenAt.get(key) ?? now
      firstSeenAt.set(key, seen)
      return { ...alarm, raisedAt: seen }
    })
    return stamped
  }

  function pruneClearedAlarms(activeKeys: ReadonlySet<string>): void {
    for (const key of firstSeenAt.keys()) {
      if (!activeKeys.has(key)) firstSeenAt.delete(key)
    }
  }

  function step(): void {
    if (site.feedDropped) return // deliberate silence

    const now = Date.now()
    const assets: Partial<Record<AssetId, AssetFrame>> = {}
    const activeKeys = new Set<string>()

    let totalDischargeMW = 0

    for (const skid of site.skids) {
      advanceSkid(skid, site.command)
      const stamped = stampRaisedAt(skidAlarms(skid, now), now)
      for (const alarm of stamped) activeKeys.add(`${alarm.code}:${alarm.assetId}`)
      assets[skid.id] = projectSkidFrame(skid, stamped)
      if (skid.reporting) totalDischargeMW += skid.powerKW / 1000
    }

    // The facility's own demand wanders; it does not depend on the batteries.
    site.loadMW = round(clamp(jitter(site.loadMW, 0.003), 33.5, 41), 1)
    const itLoadMW = round(site.loadMW / 1.32, 1)

    assets[LOAD] = {
      kind: 'load',
      status: 'NORMAL',
      metrics: {
        power_MW: site.loadMW,
        it_load_MW: itLoadMW,
        pue: round(site.loadMW / itLoadMW, 2),
        voltage_kV: round(jitter(34.5, 0.002), 1),
      },
      alarms: [],
    }

    /* The books have to balance: whatever the batteries are not supplying, the grid
       is. This is why the substation figure moves the instant a skid trips. */
    const gridImportMW = round(site.loadMW - totalDischargeMW, 1)

    site.gridFrequencyHz = round(clamp(jitter(site.gridFrequencyHz, 0.0002), 59.9, 60.1), 2)
    site.gridVoltageKV = round(clamp(jitter(site.gridVoltageKV, 0.0015), 134, 142), 1)
    site.txOilTempC = round(clamp(approach(site.txOilTempC, 48 + Math.abs(gridImportMW), 0.05), 45, 92))

    const substationAlarms: AlarmInstance[] = []
    if (site.gridFrequencyHz < 59.95 || site.gridFrequencyHz > 60.05) {
      substationAlarms.push(
        makeAlarm('GRID_FREQ', SUBSTATION, `${site.gridFrequencyHz.toFixed(2)} Hz`, now),
      )
    }
    const stampedSubstation = stampRaisedAt(substationAlarms, now)
    for (const alarm of stampedSubstation) activeKeys.add(`${alarm.code}:${alarm.assetId}`)

    assets[SUBSTATION] = {
      kind: 'substation',
      status: statusFromAlarms(stampedSubstation),
      metrics: {
        voltage_kV: site.gridVoltageKV,
        frequency_Hz: site.gridFrequencyHz,
        import_MW: gridImportMW,
        power_factor: round(jitter(0.993, 0.002), 3),
        tx_oil_temp_C: site.txOilTempC,
        tx_loading_pct: round(clamp((Math.abs(gridImportMW) / 60) * 100, 0, 100)),
      },
      alarms: stampedSubstation,
    }

    pruneClearedAlarms(activeKeys)
    onFrame({ timestamp: now, sourceStale: false, assets })
  }

  function findSkid(id: AssetId): SkidModel | undefined {
    return site.skids.find((skid) => skid.id === id)
  }

  return {
    start(): void {
      if (timer !== null) return
      step() // emit immediately so the console is not empty for a whole second
      timer = setInterval(step, FRAME_INTERVAL_MS)
    },
    stop(): void {
      if (timer !== null) clearInterval(timer)
      timer = null
    },
    dropFeed(): void {
      site.feedDropped = true
    },
    restoreFeed(): void {
      site.feedDropped = false
    },
    isFeedDropped: (): boolean => site.feedDropped,
    toggleSkidComms(id: AssetId): void {
      const skid = findSkid(id)
      if (skid !== undefined) skid.reporting = !skid.reporting
    },
    toggleHeatEvent(): void {
      const skid = findSkid(SKID_2)
      if (skid !== undefined) skid.hvacFault = !skid.hvacFault
    },
    fireAlarmBurst(): void {
      for (const skid of site.skids) {
        if (skid.reporting) skid.hvacFault = true
      }
    },
    clearAllFaults(): void {
      for (const skid of site.skids) {
        skid.hvacFault = false
        skid.reporting = true
      }
      site.feedDropped = false
    },
    setCommand(command: SiteCommand): void {
      site.command = command
    },
    getCommand: (): SiteCommand => site.command,
  }
}

/** Exported for the demo panel so it can offer "take skid 5 offline" by name. */
export const DEMO_OFFLINE_SKID = SKID_5

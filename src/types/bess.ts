/**
 * The vocabulary of the whole system. Nothing in this file imports React — the
 * simulation, the hooks, the SVG topology and the console all speak these types.
 *
 * Two rules shape everything below:
 *
 *  1. A value that can genuinely be absent is typed `| null`, never marked optional.
 *     `strictNullChecks` then forces every read site to decide what to show when the
 *     number is missing, so "offline skid renders 0 kW" becomes impossible to write by
 *     accident rather than something you have to remember not to do.
 *
 *  2. Identifiers are branded. An `AssetId` cannot be passed where an `AlarmCode` is
 *     expected even though both are strings once compiled.
 */

/* ───────────────────────────────────────────────────────────── identifiers ── */

/** A site asset identifier, e.g. `SUBSTATION`, `SKID-3`, `LOAD`. */
export type AssetId = string & { readonly __brand: 'AssetId' }

/** Narrow a raw string to an AssetId. Only the topology module should call this. */
export function asAssetId(value: string): AssetId {
  return value as AssetId
}

/* ───────────────────────────────────────────────────────────────── status ── */

const ASSET_STATUSES = ['NORMAL', 'WARNING', 'FAULT', 'OFFLINE'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

/**
 * Used to reconcile a reported status against a derived one: the worse of the two wins.
 *
 * OFFLINE outranks WARNING deliberately. A known small problem is less serious than an
 * asset you cannot see at all — with no telemetry you do not know whether it is idling
 * or on fire.
 */
export const STATUS_SEVERITY: Readonly<Record<AssetStatus, number>> = {
  NORMAL: 0,
  WARNING: 1,
  OFFLINE: 2,
  FAULT: 3,
}

/* ───────────────────────────────────────────────────────────────── alarms ── */

const ALARM_SEVERITIES = ['info', 'warning', 'critical'] as const
export type AlarmSeverity = (typeof ALARM_SEVERITIES)[number]

export const SEVERITY_RANK: Readonly<Record<AlarmSeverity, number>> = {
  info: 0,
  warning: 1,
  critical: 2,
}

const ALARM_CODES = [
  'CELL_OV',
  'CELL_UV',
  'TEMP_HIGH',
  'TEMP_CRIT',
  'TEMP_DELTA',
  'SOC_LOW',
  'SOH_DEGRADED',
  'INSULATION_LOW',
  'DC_OVERCURRENT',
  'PCS_DERATE',
  'HVAC_FAULT',
  'COMMS_LOST',
  'GRID_FREQ',
  'TX_TEMP_HIGH',
] as const
export type AlarmCode = (typeof ALARM_CODES)[number]

/** The static half of an alarm: what this code means, regardless of when it fired. */
export interface AlarmDefinition {
  readonly code: AlarmCode
  readonly severity: AlarmSeverity
  /** Short operator-facing name, e.g. "Cell over-temperature". */
  readonly title: string
  /** What the operator should actually do about it. */
  readonly guidance: string
}

/** One alarm as it arrives on an asset, carrying the measured value that tripped it. */
export interface AlarmInstance {
  readonly code: AlarmCode
  readonly severity: AlarmSeverity
  readonly assetId: AssetId
  /** Includes the reading, so the row is useful without opening the asset. */
  readonly message: string
  /** Epoch ms when this alarm first appeared in an unbroken run of frames. */
  readonly raisedAt: number
}

/**
 * Many identical alarms collapsed into one row. An over-temperature event across six
 * skids is one problem, not six — Rule 15 requires the console not to flood.
 */
export interface AlarmGroup {
  readonly code: AlarmCode
  readonly severity: AlarmSeverity
  readonly title: string
  readonly guidance: string
  readonly assetIds: readonly AssetId[]
  /** The earliest `raisedAt` in the group. */
  readonly since: number
  readonly sample: AlarmInstance
}

/* ─────────────────────────────────────────────────────────────── topology ── */

export type AssetKind = 'substation' | 'skid' | 'load'

export interface TopologyAsset {
  readonly id: AssetId
  readonly kind: AssetKind
  readonly label: string
  /** Coordinates in the schematic's own 1000 × 520 viewBox space. */
  readonly x: number
  readonly y: number
}

export interface TopologyLink {
  readonly from: AssetId
  readonly to: AssetId
}

export interface SiteTopology {
  readonly assets: readonly TopologyAsset[]
  readonly links: readonly TopologyLink[]
  readonly viewBoxWidth: number
  readonly viewBoxHeight: number
}

/* ────────────────────────────────────────────────────────────── telemetry ── */

/**
 * Sign convention, applied everywhere without exception:
 *   power_kW > 0  → discharging, delivering power towards the load
 *   power_kW < 0  → charging, absorbing power from the grid
 *
 * Stated once here so no component has to guess, and so the topology can colour a
 * conductor teal or copper from the sign alone.
 */
export type PowerDirection = 'discharging' | 'charging' | 'idle'

const PCS_MODES = ['DISCHARGE', 'CHARGE', 'IDLE', 'FAULT'] as const
type PcsMode = (typeof PCS_MODES)[number]

interface SubstationMetrics {
  readonly voltage_kV: number
  readonly frequency_Hz: number
  /** Net import from the grid. Positive means the site is drawing from the grid. */
  readonly import_MW: number
  readonly power_factor: number
  readonly tx_oil_temp_C: number
  readonly tx_loading_pct: number
}

/** The inverter. Nullable fields are ones this site's older skids do not report. */
export interface PcsTelemetry {
  readonly mode: PcsMode
  readonly power_kW: number
  readonly ac_voltage_V: number | null
  readonly ac_current_A: number | null
  readonly dc_voltage_V: number
  readonly efficiency_pct: number | null
  readonly igbt_temp_C: number
}

/**
 * What the pack will allow right now. Sits below nameplate when derated, which is the
 * number an operator actually needs — it explains *why* a skid cannot deliver full
 * power instead of just showing a smaller output.
 */
interface OperatingEnvelope {
  readonly max_charge_kW: number
  readonly max_discharge_kW: number
  readonly nameplate_kW: number
}

export interface BatteryTelemetry {
  readonly soc_pct: number
  readonly soh_pct: number
  readonly dc_bus_V: number
  readonly current_A: number
  readonly power_kW: number
  readonly c_rate: number
  readonly cell_v_min: number
  readonly cell_v_max: number
  readonly cell_temp_min_C: number
  readonly cell_temp_max_C: number
  readonly cell_temp_delta_C: number
  readonly insulation_MOhm: number
  readonly strings_online: number
  readonly strings_total: number
  readonly envelope: OperatingEnvelope
}

export interface TransformerTelemetry {
  readonly temp_C: number
  readonly loading_pct: number
}

interface LoadMetrics {
  readonly power_MW: number
  readonly it_load_MW: number
  /** Power usage effectiveness — total facility power over IT power. */
  readonly pue: number
  readonly voltage_kV: number
}

/* ───────────────────────────────────────────────────────────────── frames ── */

interface FrameBase {
  readonly status: AssetStatus
  readonly alarms: readonly AlarmInstance[]
}

export interface SubstationFrame extends FrameBase {
  readonly kind: 'substation'
  readonly metrics: SubstationMetrics | null
}

export interface SkidFrame extends FrameBase {
  readonly kind: 'skid'
  readonly pcs: PcsTelemetry | null
  readonly battery: BatteryTelemetry | null
  readonly transformer: TransformerTelemetry | null
}

export interface LoadFrame extends FrameBase {
  readonly kind: 'load'
  readonly metrics: LoadMetrics | null
}

/**
 * Discriminated on `kind`, so `switch (frame.kind)` narrows automatically and
 * `noFallthroughCasesInSwitch` plus an exhaustive default breaks the build if a new
 * asset kind is added without being handled everywhere.
 */
export type AssetFrame = SubstationFrame | SkidFrame | LoadFrame

/** One complete tick of the feed. */
export interface SiteFrame {
  /** Epoch ms the source produced this frame. */
  readonly timestamp: number
  /** Set by the source when it knows its own data is already out of date. */
  readonly sourceStale: boolean
  readonly assets: Readonly<Partial<Record<AssetId, AssetFrame>>>
}

/* ──────────────────────────────────────────────────────── feed connection ── */

/**
 * Rule 13. These are reported separately from asset status because they answer a
 * different question: not "is the equipment healthy" but "can I believe this screen".
 *
 *   CONNECTING   — no frame has arrived yet
 *   LIVE         — a frame arrived within the expected interval
 *   STALE        — frames have stopped, but not long enough to call it dead
 *   DISCONNECTED — the feed is gone
 */
const FEED_CONNECTIONS = ['CONNECTING', 'LIVE', 'STALE', 'DISCONNECTED'] as const
export type FeedConnection = (typeof FEED_CONNECTIONS)[number]

export interface FeedHealth {
  readonly connection: FeedConnection
  /** Epoch ms of the last frame that actually arrived, or null before the first. */
  readonly lastFrameAt: number | null
  /** Milliseconds since that frame. Zero before the first frame. */
  readonly ageMs: number
}

/**
 * What a data-driven view receives. Every one of Rule 14's states is reachable from
 * this shape: no frame yet (loading), a frame plus LIVE (live), a frame plus
 * STALE/DISCONNECTED, an asset missing from `assets` (offline), an empty alarm list
 * (empty), and `error` set (error).
 */
export interface TelemetryState {
  readonly frame: SiteFrame | null
  readonly health: FeedHealth
  readonly error: string | null
}

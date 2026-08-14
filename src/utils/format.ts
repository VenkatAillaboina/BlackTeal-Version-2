/**
 * Every number the operator reads passes through here.
 *
 * The single most important behaviour in this file is that `null` formats as an em
 * dash, never as `0`. A missing reading and a reading of zero mean opposite things on
 * a power system — one says "I have no idea", the other says "nothing is flowing" —
 * and a formatter that quietly turns the first into the second is exactly the kind of
 * fake-live-data the console must not produce (Rule 13).
 */

import type { PowerDirection } from '../types/bess'

/** Shown wherever a value is genuinely unknown. */
export const NO_VALUE = '—'

/** Below this many kW, a power reading is treated as no meaningful flow. */
const IDLE_THRESHOLD_KW = 20

function fixed(value: number, decimals: number): string {
  /* toFixed rather than Intl: telemetry wants a fixed column width far more than it
     wants locale grouping, and grouping separators change width between values. */
  return value.toFixed(decimals)
}

/* ────────────────────────────────────────────────────────────────── power ── */

/**
 * Power in kW, promoted to MW once it stops being readable in kW. The unit is returned
 * separately so the UI can typeset it smaller than the number without parsing a string.
 */
export interface FormattedValue {
  readonly text: string
  readonly unit: string
}

export function formatPower(kW: number | null): FormattedValue {
  if (kW === null) return { text: NO_VALUE, unit: 'kW' }
  const magnitude = Math.abs(kW)
  if (magnitude >= 1000) return { text: fixed(kW / 1000, 2), unit: 'MW' }
  return { text: fixed(kW, 0), unit: 'kW' }
}

/**
 * kW with no promotion to MW, for columns.
 *
 * `formatPower` switches unit at 1000, which is right for a single headline figure and
 * wrong for a table: "2.05 MW" above "14 kW" cannot be compared without doing arithmetic
 * in your head. A fixed unit down a column can.
 */
export function formatKilowatts(kW: number | null): FormattedValue {
  return { text: kW === null ? NO_VALUE : fixed(kW, 0), unit: 'kW' }
}

export function formatMegawatts(MW: number | null, decimals = 1): FormattedValue {
  return { text: MW === null ? NO_VALUE : fixed(MW, decimals), unit: 'MW' }
}

export function formatEnergy(MWh: number | null): FormattedValue {
  return { text: MWh === null ? NO_VALUE : fixed(MWh, 1), unit: 'MWh' }
}

/**
 * Direction from the sign, using the convention declared in `types/bess.ts`.
 * Derived here rather than in a component so the topology, the cards and the overview
 * cannot disagree about which way the power is going.
 */
export function powerDirection(kW: number | null): PowerDirection {
  if (kW === null || Math.abs(kW) < IDLE_THRESHOLD_KW) return 'idle'
  return kW > 0 ? 'discharging' : 'charging'
}

/** Plain words for the direction, for the text half of a colour-plus-text status. */
export function describeDirection(direction: PowerDirection): string {
  switch (direction) {
    case 'discharging':
      return 'Discharging to load'
    case 'charging':
      return 'Charging from grid'
    case 'idle':
      return 'Idle'
  }
}

/* ─────────────────────────────────────────────────────────── other units ── */

export function formatPercent(pct: number | null, decimals = 0): FormattedValue {
  return { text: pct === null ? NO_VALUE : fixed(pct, decimals), unit: '%' }
}

export function formatTemperature(celsius: number | null, decimals = 1): FormattedValue {
  return { text: celsius === null ? NO_VALUE : fixed(celsius, decimals), unit: '°C' }
}

export function formatFrequency(hz: number | null): FormattedValue {
  return { text: hz === null ? NO_VALUE : fixed(hz, 2), unit: 'Hz' }
}

export function formatKilovolts(kV: number | null): FormattedValue {
  return { text: kV === null ? NO_VALUE : fixed(kV, 1), unit: 'kV' }
}

export function formatVolts(volts: number | null): FormattedValue {
  return { text: volts === null ? NO_VALUE : fixed(volts, 0), unit: 'V' }
}

export function formatAmps(amps: number | null): FormattedValue {
  return { text: amps === null ? NO_VALUE : fixed(amps, 0), unit: 'A' }
}

export function formatResistance(mOhm: number | null): FormattedValue {
  return { text: mOhm === null ? NO_VALUE : fixed(mOhm, 2), unit: 'MΩ' }
}

export function formatRatio(value: number | null, decimals = 3): FormattedValue {
  return { text: value === null ? NO_VALUE : fixed(value, decimals), unit: '' }
}

export function formatCRate(rate: number | null): FormattedValue {
  return { text: rate === null ? NO_VALUE : fixed(rate, 2), unit: 'C' }
}

/* ─────────────────────────────────────────────────────────────────── time ── */

/**
 * How long ago something happened, in the shortest form that is still unambiguous.
 * Used for alarm age and for the feed's own "last update" line, which is the one piece
 * of text that must stay honest when everything else on screen has frozen.
 */
export function formatAge(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return NO_VALUE
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${String(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${String(minutes)}m ${String(seconds % 60)}s`
  const hours = Math.floor(minutes / 60)
  return `${String(hours)}h ${String(minutes % 60)}m`
}

/** Wall-clock time to the second. Deliberately 24-hour: control rooms do not use am/pm. */
export function formatClock(epochMs: number | null): string {
  if (epochMs === null) return NO_VALUE
  const d = new Date(epochMs)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* ──────────────────────────────────────────────────────────────── helpers ── */

/** `12.4` + `MW` → `12.4 MW`, for aria-labels and any single-string context. */
export function joinValue(value: FormattedValue): string {
  return value.unit === '' ? value.text : `${value.text} ${value.unit}`
}

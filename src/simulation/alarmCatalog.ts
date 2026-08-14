/**
 * What each alarm code means, and what the operator should do about it.
 *
 * Severity lives here, not at the point the alarm is raised, so the same code can never
 * arrive as `warning` from one skid and `critical` from another. `guidance` exists
 * because Rule 15 requires text alongside colour — a red row that only says
 * "TEMP_CRIT" tells a night-shift operator nothing.
 */

import type { AlarmCode, AlarmDefinition } from '../types/bess'

/* Typed as a total Record, so adding a code to ALARM_CODES without describing it here
   is a compile error rather than an alarm that renders blank. */
export const ALARM_DEFINITIONS: Readonly<Record<AlarmCode, AlarmDefinition>> = {
  CELL_OV: {
    code: 'CELL_OV',
    severity: 'critical',
    title: 'Cell over-voltage',
    guidance: 'Charging is blocked on this pack. Check the balancing circuit before re-enabling.',
  },
  CELL_UV: {
    code: 'CELL_UV',
    severity: 'critical',
    title: 'Cell under-voltage',
    guidance: 'Discharge is blocked. The pack needs a maintenance charge.',
  },
  TEMP_HIGH: {
    code: 'TEMP_HIGH',
    severity: 'warning',
    title: 'Pack temperature elevated',
    guidance: 'Output is derated while the pack is warm. Verify HVAC airflow on this skid.',
  },
  TEMP_CRIT: {
    code: 'TEMP_CRIT',
    severity: 'critical',
    title: 'Pack over-temperature',
    guidance: 'Output has been stopped. Do not re-enable until the pack is below 40 °C.',
  },
  TEMP_DELTA: {
    code: 'TEMP_DELTA',
    severity: 'warning',
    title: 'Cell temperature spread',
    guidance: 'Uneven cooling across the pack. Inspect for a blocked duct or a failed fan.',
  },
  SOC_LOW: {
    code: 'SOC_LOW',
    severity: 'warning',
    title: 'State of charge low',
    guidance: 'Little energy left to deliver. Schedule a charge window.',
  },
  SOH_DEGRADED: {
    code: 'SOH_DEGRADED',
    severity: 'info',
    title: 'State of health degraded',
    guidance: 'Usable capacity has fallen below 90 %. Plan pack replacement.',
  },
  INSULATION_LOW: {
    code: 'INSULATION_LOW',
    severity: 'critical',
    title: 'Insulation resistance low',
    guidance: 'Possible earth fault on the DC side. Isolate the skid and inspect.',
  },
  DC_OVERCURRENT: {
    code: 'DC_OVERCURRENT',
    severity: 'critical',
    title: 'DC over-current',
    guidance: 'The pack tripped on current. Check the inverter current limit setting.',
  },
  PCS_DERATE: {
    code: 'PCS_DERATE',
    severity: 'warning',
    title: 'Inverter derated',
    guidance: 'The inverter cannot reach nameplate power. Usually follows a hot pack.',
  },
  HVAC_FAULT: {
    code: 'HVAC_FAULT',
    severity: 'warning',
    title: 'HVAC fault',
    guidance: 'Cooling has failed on this skid. Pack temperature will rise.',
  },
  COMMS_LOST: {
    code: 'COMMS_LOST',
    severity: 'critical',
    title: 'Communication lost',
    guidance: 'No telemetry from this asset. Its real state is unknown — treat as unsafe.',
  },
  GRID_FREQ: {
    code: 'GRID_FREQ',
    severity: 'warning',
    title: 'Grid frequency excursion',
    guidance: 'Frequency is outside the normal band. Frequency response may engage.',
  },
  TX_TEMP_HIGH: {
    code: 'TX_TEMP_HIGH',
    severity: 'warning',
    title: 'Transformer temperature high',
    guidance: 'Winding temperature is elevated. Reduce loading if it keeps climbing.',
  },
}

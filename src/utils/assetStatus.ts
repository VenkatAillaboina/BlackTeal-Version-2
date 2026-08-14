/**
 * Turning alarms into a single status, and combining statuses.
 *
 * Kept out of both the simulator and the components (Rule 20) because three different
 * places need the same answer: the feed derives an asset's status, the topology colours
 * a node from it, and the site overview rolls the whole fleet up into one badge. One
 * implementation means those three can never disagree.
 */

import type { AlarmInstance, AssetStatus } from '../types/bess'
import { STATUS_SEVERITY } from '../types/bess'

/** The worse of two statuses, using the ordering declared in `types/bess.ts`. */
function worstStatus(a: AssetStatus, b: AssetStatus): AssetStatus {
  return STATUS_SEVERITY[a] >= STATUS_SEVERITY[b] ? a : b
}

/** The worst status in a list. An empty fleet is NORMAL, not OFFLINE. */
export function worstOf(statuses: readonly AssetStatus[]): AssetStatus {
  return statuses.reduce<AssetStatus>(worstStatus, 'NORMAL')
}

/**
 * An asset's status implied by the alarms currently on it.
 *
 * A critical alarm means FAULT, a warning means WARNING, and info alarms do not change
 * the status at all — an ageing pack is worth telling someone about, but it is not a
 * reason to light up the site map.
 */
export function statusFromAlarms(alarms: readonly AlarmInstance[]): AssetStatus {
  let status: AssetStatus = 'NORMAL'
  for (const alarm of alarms) {
    if (alarm.severity === 'critical') return 'FAULT'
    if (alarm.severity === 'warning') status = 'WARNING'
  }
  return status
}

/** Plain-language explanation, so a badge is never colour and a code alone (Rule 15). */
export function describeStatus(status: AssetStatus): string {
  switch (status) {
    case 'NORMAL':
      return 'Reporting normally, inside all limits.'
    case 'WARNING':
      return 'Reporting, but at least one value is outside a soft limit.'
    case 'FAULT':
      return 'Reporting a fault. Output is stopped or blocked.'
    case 'OFFLINE':
      return 'No telemetry. The real state of this asset is unknown.'
  }
}

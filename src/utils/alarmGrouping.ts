/**
 * Collapsing an alarm flood into something a human can act on.
 *
 * When cooling fails across the site, six skids raise the same code within one second.
 * Six rows is not six problems — it is one problem with six victims, and a list that
 * scrolls is a list nobody reads. Rule 15 requires grouping, so alarms are keyed by
 * code and the affected assets are carried as a list on the single row.
 *
 * Ordering is severity first, then oldest first. The oldest critical alarm is almost
 * always the root cause; the newer ones are usually its consequences.
 */

import type { AlarmGroup, AlarmInstance, SiteFrame } from '../types/bess'
import { SEVERITY_RANK } from '../types/bess'
import { ALARM_DEFINITIONS } from '../simulation/alarmCatalog'

/** Every alarm on the frame, flattened out of the per-asset lists. */
function collectAlarms(frame: SiteFrame | null): AlarmInstance[] {
  if (frame === null) return []
  const alarms: AlarmInstance[] = []
  for (const asset of Object.values(frame.assets)) {
    if (asset === undefined) continue
    alarms.push(...asset.alarms)
  }
  return alarms
}

export function groupAlarms(frame: SiteFrame | null): AlarmGroup[] {
  const byCode = new Map<string, AlarmInstance[]>()

  for (const alarm of collectAlarms(frame)) {
    const existing = byCode.get(alarm.code)
    if (existing === undefined) byCode.set(alarm.code, [alarm])
    else existing.push(alarm)
  }

  const groups: AlarmGroup[] = []
  for (const instances of byCode.values()) {
    const sample = instances[0]
    /* `noUncheckedIndexedAccess` makes this check mandatory. A map value is only ever
       created with one element already in it, so this cannot happen — but the compiler
       is right to insist, and skipping is safer than asserting. */
    if (sample === undefined) continue

    const definition = ALARM_DEFINITIONS[sample.code]
    groups.push({
      code: sample.code,
      severity: definition.severity,
      title: definition.title,
      guidance: definition.guidance,
      assetIds: instances.map((instance) => instance.assetId),
      since: Math.min(...instances.map((instance) => instance.raisedAt)),
      sample,
    })
  }

  return groups.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    return bySeverity !== 0 ? bySeverity : a.since - b.since
  })
}

/** Counts for the console header, so "3 critical" can be shown without re-grouping. */
export interface AlarmTally {
  readonly critical: number
  readonly warning: number
  readonly info: number
  readonly total: number
}

export function tallyAlarms(groups: readonly AlarmGroup[]): AlarmTally {
  let critical = 0
  let warning = 0
  let info = 0

  for (const group of groups) {
    /* Counting affected assets, not rows. "2 critical" when two skids are on fire is
       the honest number; the grouping is a display convenience, not a discount. */
    const count = group.assetIds.length
    if (group.severity === 'critical') critical += count
    else if (group.severity === 'warning') warning += count
    else info += count
  }

  return { critical, warning, info, total: critical + warning + info }
}

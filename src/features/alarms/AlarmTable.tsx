import { useMemo } from 'react'
import type { TelemetryState } from '../../types/bess'
import { GlassCard } from '../../components/GlassCard'
import { PanelState } from '../../components/PanelState'
import { AlarmRow } from './AlarmRow'
import { groupAlarms, tallyAlarms } from '../../utils/alarmGrouping'
import { cn } from '../../utils/cn'

/**
 * The alarm console.
 *
 * Grouped by code, worst first, oldest first within a severity — the ordering that puts
 * the probable root cause at the top. Grouping happens in `utils/alarmGrouping.ts`; this
 * component only renders the result (Rule 20).
 *
 * "No active alarms" and "the feed is dead" are drawn as different things on purpose.
 * A silent alarm list during a disconnection is not good news, and a console that draws
 * both as an empty list is actively misleading.
 */

interface AlarmTableProps {
  readonly telemetry: TelemetryState
}

export function AlarmTable({ telemetry }: AlarmTableProps) {
  const { frame, health } = telemetry

  const groups = useMemo(() => groupAlarms(frame), [frame])
  const tally = useMemo(() => tallyAlarms(groups), [groups])

  const isDisconnected = health.connection === 'DISCONNECTED'

  return (
    <GlassCard
      title="Alarms"
      flush
      action={
        /* Once the feed is gone the counts describe a moment that has passed. Greying
           them stops "0 critical" being read as reassurance about right now. */
        <div className={cn('flex items-center gap-2 font-mono text-eyebrow', isDisconnected && 'opacity-40')}>
          <Tally count={tally.critical} label="critical" className="text-status-fault" />
          <Tally count={tally.warning} label="warning" className="text-status-warning" />
          <Tally count={tally.info} label="info" className="text-teal-live" />
        </div>
      }
    >
      {isDisconnected ? (
        <PanelState
          kind="disconnected"
          title="Alarm feed lost"
          detail="This list is not being updated. New alarms raised now would not appear here."
        />
      ) : frame === null ? (
        <PanelState
          kind="loading"
          title="Connecting"
          detail="The alarm list appears once the first frame arrives."
        />
      ) : groups.length === 0 ? (
        <PanelState
          kind="empty"
          title="No active alarms"
          detail="Every reporting asset is inside its limits."
        />
      ) : (
        <ul className="max-h-[26rem] divide-y divide-ink-800/60 overflow-y-auto scrollbar-thin">
          {groups.map((group) => (
            <AlarmRow key={group.code} group={group} now={frame.timestamp} />
          ))}
        </ul>
      )}
    </GlassCard>
  )
}

/** A count that stays visible at zero, so "0 critical" is a statement, not an absence. */
function Tally({ count, label, className }: { count: number; label: string; className: string }) {
  return (
    <span className={cn('tabular-nums', count === 0 ? 'text-ink-600' : className)}>
      {count} <span className="text-ink-500">{label}</span>
    </span>
  )
}

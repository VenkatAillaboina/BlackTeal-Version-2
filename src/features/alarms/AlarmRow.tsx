import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AlarmGroup } from '../../types/bess'
import { SEVERITY_VISUALS } from '../../components/statusVisuals'
import { assetLabel } from '../../simulation/siteTopology'
import { formatAge } from '../../utils/format'
import { cn } from '../../utils/cn'

/**
 * One alarm, however many assets it is affecting.
 *
 * Four independent signals carry the severity: a coloured left edge, an icon, the word
 * ("Critical"), and the ordering. Remove the colour entirely and the row still reads
 * correctly — which is the test Rule 15 is really asking for.
 *
 * The guidance line is collapsed by default because a console showing fifteen alarms
 * with three lines of advice each is unusable, but it is one keystroke away because an
 * alarm nobody knows how to act on is not much better than no alarm.
 */

interface AlarmRowProps {
  readonly group: AlarmGroup
  readonly now: number
}

export function AlarmRow({ group, now }: AlarmRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visual = SEVERITY_VISUALS[group.severity]
  const Icon = visual.icon
  const affectedCount = group.assetIds.length

  return (
    <li className={cn('border-l-2 transition-colors duration-quick', visual.border, visual.bg)}>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-ink-800/40"
        onClick={() => {
          setIsExpanded((open) => !open)
        }}
        aria-expanded={isExpanded}
      >
        <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', visual.text)} aria-hidden />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn('font-mono text-eyebrow font-semibold uppercase', visual.text)}>
              {visual.label}
            </span>
            <span className="font-mono text-caption text-ink-500">{group.code}</span>
          </span>

          <span className="mt-1 block text-caption text-ink-100">{group.title}</span>

          <span className="mt-1 block font-mono text-caption text-ink-400">
            {/* Named assets, not just a count. "6 assets" sends an operator hunting. */}
            {group.assetIds.map((id) => assetLabel(id)).join(', ')}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {affectedCount > 1 ? (
            <span className="rounded-full bg-ink-800 px-2 py-0.5 font-mono text-eyebrow text-ink-200">
              ×{affectedCount}
            </span>
          ) : null}
          <span className="font-mono text-caption tabular-nums text-ink-400">
            {formatAge(Math.max(0, now - group.since))}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-ink-500 transition-transform duration-quick ease-apple',
              isExpanded && 'rotate-180',
            )}
            aria-hidden
          />
        </span>
      </button>

      {isExpanded ? (
        <p className="border-t border-ink-800/60 px-3 py-2.5 pl-[2.1rem] text-caption text-ink-300">
          {group.guidance}
        </p>
      ) : null}
    </li>
  )
}

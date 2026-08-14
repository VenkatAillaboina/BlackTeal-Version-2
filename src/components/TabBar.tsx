import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

/**
 * The console's section switcher.
 *
 * A real ARIA tablist, not a row of buttons: roving `tabindex` so Tab enters and leaves
 * the group once rather than stepping through every tab, and Left/Right/Home/End to move
 * between them. That is the behaviour a screen-reader user is told to expect the moment
 * the word "tab" is announced, and it is the whole reason to use the role at all.
 *
 * A tab can carry a count — the alarm tab does — because the reason to hide the alarm
 * list behind a tab is only defensible if the operator can still see, without switching,
 * that something is waiting there.
 */

export interface TabDefinition<Id extends string> {
  readonly id: Id
  readonly label: string
  readonly icon: LucideIcon
  /** Rendered as a badge. Omit or pass 0 for no badge. */
  readonly count?: number
  /** Colour class for the badge, so a critical alarm count can read as critical. */
  readonly countToneClass?: string
}

interface TabBarProps<Id extends string> {
  readonly tabs: readonly TabDefinition<Id>[]
  readonly activeId: Id
  readonly onChange: (id: Id) => void
  readonly idPrefix: string
  readonly className?: string
}

export function TabBar<Id extends string>({
  tabs,
  activeId,
  onChange,
  idPrefix,
  className,
}: TabBarProps<Id>) {
  const listRef = useRef<HTMLDivElement>(null)

  const focusTab = (index: number): void => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    const target = buttons?.[(index + (buttons.length || 1)) % (buttons?.length ?? 1)]
    target?.focus()
    const id = target?.dataset['tabId']
    if (id !== undefined) onChange(id as Id)
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Console sections"
      className={cn(
        'flex items-center gap-1 overflow-x-auto rounded-full border border-ink-800 bg-ink-950 p-1 scrollbar-thin',
        className,
      )}
      onKeyDown={(event) => {
        const index = tabs.findIndex((tab) => tab.id === activeId)
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          focusTab(index + 1)
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          focusTab(index - 1)
        } else if (event.key === 'Home') {
          event.preventDefault()
          focusTab(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          focusTab(tabs.length - 1)
        }
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            /* Roving tabindex: only the active tab is in the tab order. */
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              onChange(tab.id)
            }}
            /* The label is the accessible name at every size; below `sm` it is only
               visually hidden. Four labelled tabs measured 471 px wide in a 390 px
               viewport, so the strip was cut off on phones. */
            aria-label={tab.label}
            title={tab.label}
            className={cn(
              'inline-flex flex-1 shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors duration-quick ease-apple sm:flex-none sm:px-3.5',
              isActive ? 'bg-teal-core text-ink-void' : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="hidden font-mono text-eyebrow font-semibold uppercase sm:inline">
              {tab.label}
            </span>

            {tab.count !== undefined && tab.count > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 font-mono text-eyebrow tabular-nums',
                  isActive ? 'bg-ink-void/25 text-ink-void' : (tab.countToneClass ?? 'bg-ink-800 text-ink-200'),
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

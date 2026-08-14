import { ArrowDown, ArrowUp } from 'lucide-react'
import type { FeedHealth } from '../types/bess'
import { ConnectionPill } from '../components/ConnectionPill'
import { cn } from '../utils/cn'

/**
 * One logo and exactly one link.
 *
 * The Showcase / Console toggle is gone. There is only one page now, so a segmented
 * control would be offering a choice that no longer exists. What remains is a single
 * link that points wherever the viewer is not: down to the console while they are
 * reading the story, back to the top once they are in it. An operator opening this daily
 * gets to the live data in one click rather than four screens of scrolling.
 *
 * Feed health appears only once the console is actually on screen. Above it there is no
 * live claim being made, and a LIVE badge next to marketing copy would be decoration —
 * which is the one thing this badge is never allowed to be.
 */

interface AppHeaderProps {
  readonly health: FeedHealth
  readonly isConsoleInView: boolean
  readonly onJumpToConsole: () => void
  readonly onBackToTop: () => void
}

export function AppHeader({
  health,
  isConsoleInView,
  onJumpToConsole,
  onBackToTop,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-void/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-x-4 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onBackToTop}
          className="flex shrink-0 items-center gap-2.5 rounded-sm"
          aria-label="BlackTeal, back to top"
        >
          {/* A bus bar with one tap — the same device the hero is built on. */}
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
            <path d="M2 11 H20" strokeWidth="2" strokeLinecap="round" className="stroke-teal-core" />
            <path d="M11 11 V19" strokeWidth="2" strokeLinecap="round" className="stroke-teal-live" />
            <circle cx="11" cy="19" r="2.2" className="fill-teal-live" />
          </svg>
          <span className="font-semibold tracking-tight text-ink-50">BlackTeal</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          {isConsoleInView ? <ConnectionPill health={health} className="hidden sm:inline-flex" /> : null}

          <button
            type="button"
            onClick={isConsoleInView ? onBackToTop : onJumpToConsole}
            className={cn(
              'group inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5',
              'font-mono text-eyebrow uppercase transition-colors duration-quick ease-apple',
              isConsoleInView
                ? 'border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100'
                : 'border-teal-core text-teal-live hover:bg-teal-core hover:text-ink-void',
            )}
          >
            {isConsoleInView ? (
              <>
                <ArrowUp className="h-3 w-3 transition-transform duration-quick ease-apple group-hover:-translate-y-0.5" aria-hidden />
                Back to top
              </>
            ) : (
              <>
                Live console
                <ArrowDown className="h-3 w-3 transition-transform duration-quick ease-apple group-hover:translate-y-0.5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

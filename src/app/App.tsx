import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppHeader } from './AppHeader'
import { CinematicShowcase } from '../features/showcase/CinematicShowcase'
import { OperatorConsole } from '../features/operator/OperatorConsole'
import { ConsolePlaceholder } from '../features/operator/ConsolePlaceholder'
import { ConsoleStage } from '../features/operator/ConsoleStage'
import { SiteFooter } from '../features/footer/SiteFooter'
import { useLiveTelemetry } from '../hooks/useLiveTelemetry'
import { useViewportPresence } from '../hooks/useViewportPresence'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { animateScrollTo, jumpScrollTo } from '../utils/animatedScroll'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * One page: the story, then the live site, in a single scroll.
 *
 * There is no mode switch any more. The showcase and the console were never two
 * applications — they draw the same topology from the same file — so they are now two
 * sections of one document, and the transition between them is scrolling.
 *
 * The telemetry feed still starts here, above both, so it runs continuously from first
 * paint. That was the original reason the shell owned it and it still holds: the feed
 * must not restart, and the state of charge must not reset, just because the viewer
 * moved around the page.
 *
 * The console UI mounts only once the viewer approaches it. Keeping a dense dashboard
 * mounted and re-rendering at 1 Hz while somebody reads the hero would spend the scroll
 * budget on work nobody can see.
 */

/** Clearance below the sticky header. Must match `scroll-mt-16` on the console section. */
const CONSOLE_SCROLL_OFFSET_PX = 64

export function App() {
  const { telemetry, controls } = useLiveTelemetry()
  const consoleRef = useRef<HTMLElement>(null)
  const { hasApproached, isInView } = useViewportPresence(consoleRef)
  const prefersReducedMotion = usePrefersReducedMotion()

  /* The console mounts on approach, so a jump from the top would otherwise begin while
     the placeholder was still being swapped out. Forcing the mount first and scrolling on
     the next layout means the destination exists before the travel starts. */
  const [isMountForced, setIsMountForced] = useState(false)
  const shouldMountConsole = hasApproached || isMountForced
  const isScrollPending = useRef(false)

  /* Held so an in-flight scroll can be cancelled if the component unmounts (Rule 18). */
  const cancelScrollRef = useRef<(() => void) | null>(null)

  const scrollToConsole = useCallback(() => {
    /* Prefer the deck — the console proper. The section starts at the stage headline,
       which has already parallaxed out of the way by the time you arrive, so landing there
       shows a band of empty page. Falls back to the section before the console mounts. */
    const element = document.getElementById('console-deck') ?? consoleRef.current
    if (element === null) return

    cancelScrollRef.current?.()
    if (prefersReducedMotion) {
      jumpScrollTo(element, CONSOLE_SCROLL_OFFSET_PX)
      return
    }
    cancelScrollRef.current = animateScrollTo(element, CONSOLE_SCROLL_OFFSET_PX)
  }, [prefersReducedMotion])

  useEffect(() => () => cancelScrollRef.current?.(), [])

  const handleJumpToConsole = useCallback(() => {
    if (shouldMountConsole) {
      scrollToConsole()
      return
    }
    isScrollPending.current = true
    setIsMountForced(true)
  }, [shouldMountConsole, scrollToConsole])

  useLayoutEffect(() => {
    if (!isScrollPending.current || !shouldMountConsole) return
    isScrollPending.current = false
    scrollToConsole()
  }, [shouldMountConsole, scrollToConsole])

  const handleBackToTop = useCallback(() => {
    cancelScrollRef.current?.()
    /* Zero is a fixed destination that no layout change can move, so the native smooth
       scroll is reliable in this direction and does not need the tween. */
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }, [prefersReducedMotion])

  return (
    <>
      <a
        href="#console"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-teal-core focus:px-4 focus:py-2 focus:font-medium focus:text-ink-void"
      >
        Skip to live console
      </a>

      <AppHeader
        health={telemetry.health}
        isConsoleInView={isInView}
        onJumpToConsole={handleJumpToConsole}
        onBackToTop={handleBackToTop}
      />

      {/* Each half is wrapped separately so a failure in the cinematic layer cannot take
          the console down with it, and vice versa (Rule 21). */}
      <ErrorBoundary
        title="The showcase failed to render"
        detail="The live console below is unaffected."
      >
        <CinematicShowcase />
      </ErrorBoundary>

      <section id="console" ref={consoleRef} className="scroll-mt-16 border-t border-ink-800">
        <ErrorBoundary
          title="The console failed to render"
          detail="Telemetry may still be arriving. Reload to try again."
        >
          {shouldMountConsole ? (
            <ConsoleStage>
              <OperatorConsole telemetry={telemetry} controls={controls} />
            </ConsoleStage>
          ) : (
            <ConsolePlaceholder />
          )}
        </ErrorBoundary>
      </section>

      <SiteFooter onBackToTop={handleBackToTop} />
    </>
  )
}

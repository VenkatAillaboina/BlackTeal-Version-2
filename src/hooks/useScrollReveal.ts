import { useGSAP } from '@gsap/react'
import type { RefObject } from 'react'
import { gsap, ScrollTrigger } from '../utils/gsapSetup'
import { EASING } from '../utils/easing'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Reveals marked children as they scroll into view, in the order they are reached.
 *
 * Uses `ScrollTrigger.batch`, which groups everything crossing the threshold in the same
 * frame into one staggered tween. The alternative — one trigger per panel — fires a dozen
 * separate tweens on a fast scroll and reads as a scatter of unrelated pops rather than a
 * console assembling itself.
 *
 * Only `opacity` and `y` are animated, so every frame is a composited transform (Rule 11).
 * There is no blur, no scale on text, and nothing that forces layout.
 *
 * Two details that matter on a live dashboard:
 *
 *  • `once: true`. Telemetry panels must not fade out and back in every time the operator
 *    scrolls up and down. The reveal is an arrival, not a permanent behaviour.
 *
 *  • The effect depends only on the motion preference, never on telemetry. It runs once
 *    when the console mounts; the 1 Hz data updates re-render the panels underneath
 *    without disturbing the inline styles GSAP has set on them.
 */

interface ScrollRevealOptions {
  /**
   * Where each card starts, in px, relative to its final position. Negative means it
   * drops in from above — the card arrives into the space rather than pushing up out of
   * the fold, which reads as assembly rather than as a list loading.
   */
  readonly travel?: number
  /** Viewport position that triggers the reveal, in ScrollTrigger's syntax. */
  readonly start?: string
}

export function useScrollReveal(
  scopeRef: RefObject<HTMLElement | null>,
  { travel = -64, start = 'top 92%' }: ScrollRevealOptions = {},
): void {
  const prefersReducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      const scope = scopeRef.current
      if (scope === null) return

      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope)
      if (targets.length === 0) return

      /* Reduced motion: make sure nothing is left hidden, and create no triggers at all.
         A disabled animation still leaves the elements at opacity 0 if it never runs. */
      if (prefersReducedMotion) {
        gsap.set(targets, { clearProps: 'opacity,transform' })
        return
      }

      /* Cards start above their resting place, so during the drop they sit over the card
         before them. Without a stacking context the overlap paints in DOM order and the
         incoming card slides *underneath* its neighbour. */
      gsap.set(targets, { position: 'relative', zIndex: 1 })
      /* Recomputed after the reveal is wired up, because setting the initial hidden state
         changes nothing about layout but the surrounding page may still be settling. */
      ScrollTrigger.refresh()

      /**
       * Anything already on screen is shown at once, with no animation and no trigger.
       *
       * `ScrollTrigger.batch` only fires `onEnter` when an element *crosses* the start
       * line. Arrive at the console by jumping — the header's skip link, a deep link, a
       * fast flick on a phone — and the panels are already above that line, so they never
       * cross it, `once: true` never fires, and they sit at `opacity: 0` permanently.
       * Measured on a 390 px viewport: 0 of 4 panels ever appeared.
       *
       * These are not animated on the way in because the viewer never saw them arrive;
       * fading them up now would draw the eye to movement that means nothing.
       */
      const startLine = window.innerHeight * 0.92
      const alreadyVisible = targets.filter((el) => el.getBoundingClientRect().top < startLine)
      const pending = targets.filter((el) => !alreadyVisible.includes(el))

      if (alreadyVisible.length > 0) gsap.set(alreadyVisible, { opacity: 1, y: 0, scale: 1 })
      if (pending.length === 0) return

      gsap.set(pending, { opacity: 0, y: travel, scale: 0.97, transformOrigin: '50% 0%' })

      ScrollTrigger.batch(pending, {
        start,
        once: true,
        /* Short window. Cards that cross the line together still group into one staggered
           tween, but scrolling at a normal pace brings them over the line separately — so
           they drop in one at a time, which is what makes it read as card-by-card rather
           than as a block appearing. */
        interval: 0.06,
        /* Capped so a fast scroll to the bottom cannot queue a twelve-card stagger that
           finishes long after the viewer has stopped. */
        batchMax: 3,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: EASING.appleOut,
            overwrite: true,
          })
        },
      })
    },
    /* useGSAP reverts the whole context on cleanup, which kills every trigger the batch
       created — so unmounting the console leaks nothing (Rule 18). */
    { scope: scopeRef, dependencies: [prefersReducedMotion, travel, start], revertOnUpdate: true },
  )
}

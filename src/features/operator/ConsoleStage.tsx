import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../../utils/gsapSetup'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/**
 * The product reveal: the console tilts up and locks into place as you scroll into it.
 *
 * This is the Apple hardware-launch move applied to software — the device starts laid
 * back and small, and the scroll stands it up to face you. It earns its place here
 * because the console genuinely is the product, and because the whole page has been
 * building to it since the hero.
 *
 * Everything is scrubbed rather than played on entry, so the viewer drives it and can
 * scroll back to watch it lay down again. Two layers move at different rates — the
 * headline drifts up and out while the console rises — which is what gives the sequence
 * depth rather than making it one block sliding.
 *
 * Performance notes, because a 3-D transform wrapping a live dashboard is exactly the
 * kind of thing that tanks a frame budget:
 *
 *  • Only `rotateX`, `scale`, `y` and `opacity` are touched. No layout, no filters.
 *  • `force3D` keeps the subtree on its own compositor layer for the duration.
 *  • The transform resolves to identity by the time the console is properly on screen, so
 *    the steady state an operator works in has no transform on it at all — no permanent
 *    layer, no permanently re-rasterised text.
 */

interface ConsoleStageProps {
  readonly children: ReactNode
}

export function ConsoleStage({ children }: ConsoleStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  /**
   * The single most important line in this file.
   *
   * The console mounts on approach and adds thousands of pixels of height — on a phone
   * the single-column layout took the document from ~2,900 px to 7,829 px. Every
   * ScrollTrigger below that point had already measured its start and end against the
   * shorter page, so they simply never fired: measured on a 390 px viewport, only 1 of 7
   * panels ever revealed and the console stayed stuck at `rotateX(26deg)` forever.
   *
   * GSAP auto-refreshes on load and resize, but a React mount is neither. Dispatching a
   * resize by hand fixed it completely in testing (1 → 7 panels), which is what confirmed
   * the diagnosis; this does the same thing properly.
   *
   * Deferred a frame so the refresh measures the settled layout, not the one mid-commit.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion) return

      /* The headline leaves before the console arrives — they share the scroll, they do
         not share the moment. */
      gsap.fromTo(
        '[data-stage-title]',
        { y: 0, opacity: 1 },
        {
          y: -70,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: stageRef.current,
            start: 'top 62%',
            end: 'top 12%',
            scrub: 0.5,
          },
        },
      )

      gsap.fromTo(
        deckRef.current,
        /**
         * No `rotateX`. The tilt had to go, and the reason is arithmetic rather than taste.
         *
         * The console deck is roughly 2,500 px tall. Rotating that around its top edge
         * swings the bottom *toward* the camera, and perspective magnifies whatever comes
         * closer: at 26° the bottom sat about 1,096 px in front of the plane, and against a
         * 1,900 px perspective that is a magnification of 1900 / (1900 − 1096) ≈ **2.36×**.
         *
         * Measured on a 1366 px window, the deck bulged to 1,627 px — 138 px past *each*
         * edge — and `overflow-hidden` sliced it. That is the "cut off on the right side".
         * The bug was invisible to a scrollWidth check precisely because the clip absorbed
         * it, which is why it survived earlier passes.
         *
         * Any rotateX flares an element this tall; reducing the angle only reduces the
         * slice. So the deck now rises and settles with scale, travel and opacity — which
         * never exceeds its own width — and the sense of arrival comes from the headline
         * parallax above it instead.
         */
        { scale: 0.94, y: 84, opacity: 0.3 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            /* Triggered by the deck, not the section. The headline sits above the deck, so
               anchoring to the section top ran the whole tilt while the console was still
               below the fold — the move finished before anyone could see it. */
            trigger: deckRef.current,
            start: 'top bottom',
            /* Ends while the console is still arriving, so it is upright and untransformed
               before anyone tries to read a number off it. */
            end: 'top 25%',
            /* Tighter than the headline's. Scrub is a deliberate lag between your finger
               and the movement; on the deck, more than a fraction of a second reads as the
               page struggling to keep up rather than as smoothing. */
            scrub: 0.3,
            /**
             * A one-way door.
             *
             * Scrolling back up used to run the tilt in reverse, so an operator who
             * scrolled up to re-read something watched their live dashboard fold away and
             * fade out. That is what "laggy on the way back" actually was — not dropped
             * frames (the frame rate going up measures 16.7 ms median), but the whole
             * console visibly coming apart under a scrub delay.
             *
             * Once the reveal has played, the trigger is destroyed and the transform
             * cleared. The console is then plain, untransformed, permanently upright — and
             * scrolling up does nothing to it at all.
             */
            onLeave: (self) => {
              self.animation?.progress(1)
              self.kill()
              gsap.set(deckRef.current, { clearProps: 'transform,opacity' })
            },
          },
        },
      )
    },
    { scope: stageRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  return (
    <div ref={stageRef} className="relative">
      {/* The closing section above already carries its own bottom padding; stacking a tall
          top padding here left a screen of dead black between them. */}
      <div className="mx-auto max-w-[1400px] px-4 pb-12 pt-10 md:px-6 md:pt-14">
        <div data-stage-title className="max-w-3xl">
          <p className="eyebrow text-teal-core">The console</p>
          <h2 className="mt-4 text-display font-semibold tracking-tight text-ink-50">
            Now watch it run.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-ink-300">
            Six skids, one grid connection, one facility that cannot go dark — updating every second.
            Break something with the controls and watch what the screen is willing to claim.
          </p>
        </div>
      </div>

      {/* No perspective any more — nothing rotates in 3-D, so a camera space would only be
          dead weight. `overflow-hidden` stays as a guard: the deck never exceeds its own
          width now, but a future transform that did would be clipped rather than pushing a
          horizontal scrollbar onto the whole page. */}
      <div className="overflow-hidden">
        {/* No permanent `will-change`. On an element this tall it would hold a compositor
            layer for the life of the page; `force3D` promotes it only while it moves. */}
        {/* `id` so the header's skip link can land on the console itself rather than on the
            stage headline, which by that scroll position has already parallaxed away and
            would leave the viewer looking at an empty band. */}
        <div id="console-deck" ref={deckRef} className="origin-top">
          {children}
        </div>
      </div>
    </div>
  )
}

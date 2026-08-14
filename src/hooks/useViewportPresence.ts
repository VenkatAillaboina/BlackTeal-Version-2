/**
 * Where an element sits relative to the viewport, answered two ways.
 *
 * `isInView` is live and flips both directions — the header uses it to decide which way
 * its single link should point.
 *
 * `hasApproached` latches on and never resets. It exists because the console is now part
 * of the same page as the marketing story, so without it the whole dashboard would sit
 * mounted and re-rendering at 1 Hz while the viewer is still four screens away reading
 * the hero. Deferring the mount until they are near costs nothing and keeps the scroll
 * budget for the reveal.
 */

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface ViewportPresence {
  /** True once the element has come within `approachMargin` — never goes back to false. */
  readonly hasApproached: boolean
  /** True while any part of the element is on screen. */
  readonly isInView: boolean
}

export function useViewportPresence(
  ref: RefObject<Element | null>,
  approachMargin = '900px',
): ViewportPresence {
  const [hasApproached, setHasApproached] = useState(false)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    const approachObserver = new IntersectionObserver(
      (entries) => {
        /* Latching, so scrolling back up never unmounts the console and restarts its
           panels mid-session. */
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasApproached(true)
          approachObserver.disconnect()
        }
      },
      { rootMargin: approachMargin },
    )

    const viewObserver = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry !== undefined) setIsInView(entry.isIntersecting)
    })

    approachObserver.observe(element)
    viewObserver.observe(element)

    return () => {
      approachObserver.disconnect()
      viewObserver.disconnect()
    }
  }, [ref, approachMargin])

  return { hasApproached, isInView }
}

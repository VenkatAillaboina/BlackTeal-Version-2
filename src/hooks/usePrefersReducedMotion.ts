/**
 * Whether the viewer has asked their operating system to reduce motion.
 *
 * Subscribed rather than read once, because the setting can be toggled while the page
 * is open and a cinematic scroll sequence that keeps animating after the user turns
 * motion off is worse than one that never animated at all.
 *
 * The CSS in `styles/index.css` is a safety net that collapses transitions to their end
 * state. This hook is the real mechanism: GSAP timelines branch on it and play plain
 * fades instead of movement (Rule 16).
 */

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() =>
    /* Read synchronously on first render so the very first frame is already correct —
       a lazy initial value avoids one frame of unwanted motion. */
    typeof window === 'undefined' ? false : window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReduced(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReduced
}

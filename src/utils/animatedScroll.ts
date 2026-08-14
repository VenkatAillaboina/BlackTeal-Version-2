import gsap from 'gsap'

/**
 * Scroll to an element, correctly, on a page that contains a pinned section.
 *
 * `scrollIntoView({ behavior: 'smooth' })` cannot do this. It resolves the destination
 * once, at the start, and the journey here passes straight through a ScrollTrigger pin
 * that changes layout while the scroll is already in flight. Measured, the console
 * landed 60 px low; correcting after `scrollend` then overshot by 8 px, because the
 * layout moved again after the correction.
 *
 * So the destination is recomputed on every frame instead of once.
 * `getBoundingClientRect().top + scrollY` is the element's absolute document position,
 * which is stable no matter where the viewport currently is — so re-reading it each tick
 * costs one layout read and makes the tween self-correcting. Wherever the element ends
 * up, `t = 1` lands on it.
 *
 * Returns a cancel function. Callers must call it on unmount (Rule 18).
 */
export function animateScrollTo(
  element: Element,
  offsetPx: number,
  durationSeconds = 1,
): () => void {
  const startY = window.scrollY
  const progress = { t: 0 }

  const tween = gsap.to(progress, {
    t: 1,
    duration: durationSeconds,
    ease: 'power2.inOut',
    onUpdate: () => {
      const targetY = element.getBoundingClientRect().top + window.scrollY - offsetPx
      window.scrollTo(0, startY + (targetY - startY) * progress.t)
    },
  })

  return () => {
    tween.kill()
  }
}

/** The instant equivalent, for viewers who have asked for reduced motion. */
export function jumpScrollTo(element: Element, offsetPx: number): void {
  window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - offsetPx)
}

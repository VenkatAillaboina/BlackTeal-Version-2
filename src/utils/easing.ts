/**
 * Motion curves, defined once and consumed twice: Tailwind reads them to generate
 * `ease-*` utilities, GSAP reads them for JS-driven timelines. A shared definition is
 * the only way the CSS layer and the animation layer can ease identically — two
 * hand-copied cubic-beziers drift apart the first time one of them is tuned.
 *
 * `tailwind.config.ts` imports from this file, which is why the config is TypeScript.
 */

/** Raw control points, in the order CSS `cubic-bezier()` expects. */
export const EASING_POINTS = {
  /** The workhorse. Fast departure, long settle — reads as weight rather than speed. */
  apple: [0.32, 0.72, 0, 1],
  /** Entrances. Near-instant start, very long tail. */
  appleOut: [0.16, 1, 0.3, 1],
  /** Symmetric moves, e.g. a panel sliding between two docked positions. */
  appleInOut: [0.65, 0, 0.35, 1],
  /** Bus-bar energising sweep — deliberately linear-ish so charge reads as steady flow. */
  conductor: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export type EasingName = keyof typeof EASING_POINTS

function toCubicBezier(points: readonly [number, number, number, number]): string {
  return `cubic-bezier(${points.join(', ')})`
}

/**
 * CSS-ready strings. GSAP accepts this same syntax in its `ease` option.
 *
 * Written out key by key rather than derived with `Object.fromEntries`, which would
 * need a cast to keep its key type. `satisfies Record<EasingName, string>` instead
 * makes adding a curve to EASING_POINTS without adding it here a compile error.
 */
export const EASING = {
  apple: toCubicBezier(EASING_POINTS.apple),
  appleOut: toCubicBezier(EASING_POINTS.appleOut),
  appleInOut: toCubicBezier(EASING_POINTS.appleInOut),
  conductor: toCubicBezier(EASING_POINTS.conductor),
} satisfies Record<EasingName, string>

/**
 * Durations in milliseconds. Named by intent, not by number, so "make the panel
 * quicker" is a change in one place rather than a hunt for every `300`.
 */
export const DURATION_MS = {
  /** Hover, focus ring, button press — must feel instant. */
  instant: 120,
  /** Standard state change: badge colour, value swap. */
  quick: 220,
  /** Panel open, mode switch. */
  settle: 420,
  /** Cinematic beat. Only the showcase layer should reach for this. */
  cinematic: 900,
} as const


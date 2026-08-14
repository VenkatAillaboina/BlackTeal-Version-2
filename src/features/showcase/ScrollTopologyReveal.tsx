import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../../utils/gsapSetup'
import { STORY_BEATS } from './storyBeats'
import { siteTopology, SKID_IDS, findAsset, LOAD, SUBSTATION } from '../../simulation/siteTopology'
import { NODE_BOXES, boxOrigin, connectionPath } from '../topology/geometry'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASING_POINTS } from '../../utils/easing'
import { cn } from '../../utils/cn'

/**
 * The site assembling itself as you scroll.
 *
 * Reuses the same topology data and the same path geometry as the operator diagram
 * (Rule 3), so the marketing story and the working console cannot show different sites.
 *
 * Motion budget, kept deliberately narrow (Rule 11):
 *   • cables draw with `stroke-dashoffset` against `pathLength="1"`
 *   • nodes use `opacity` and `translate`/`scale`
 * Nothing animates a layout property, a filter, or a colour ramp.
 *
 * Reduced motion is a real branch, not a disabled animation. The ScrollTrigger is never
 * created at all: the section un-pins, the SVG renders complete, and the four beats
 * become an ordinary stacked list that scrolls like any other page (Rule 16).
 */

const SCRUB_HEIGHT_VH = 420

export function ScrollTopologyReveal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (prefersReducedMotion) return

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: '[data-pin]',
          /* pinSpacing is left at its default. The container carries an explicit height,
             so its size does not depend on its children — measured both ways, the document
             stays 4052 px either way. */
          /* Tying progress to scroll position rather than playing on entry means the
             viewer controls the pace, including scrolling back up. */
          scrub: 0.6,
        },
        defaults: { ease: 'none' },
      })

      /* Hidden here rather than in CSS so that if this effect never runs — reduced
         motion, or a GSAP failure — the diagram is fully visible instead of blank. */
      gsap.set('[data-node]', { opacity: 0, scale: 0.92, transformOrigin: 'center' })
      gsap.set('[data-cable]', { strokeDashoffset: 1 })
      /* Paused, not merely transparent. A `stroke-dashoffset` animation repaints its path
         every frame whether or not anyone can see it, so twelve invisible cables were
         costing paint work for the entire scroll. */
      gsap.set('[data-flow]', { opacity: 0, animationPlayState: 'paused' })

      timeline
        .to('[data-node="substation"]', { opacity: 1, scale: 1, duration: 0.1 }, 0.02)
        .to('[data-cable="grid"]', { strokeDashoffset: 0, duration: 0.22, stagger: 0.012 }, 0.12)
        .to(
          '[data-node="skid"]',
          { opacity: 1, scale: 1, duration: 0.14, stagger: 0.03 },
          0.26,
        )
        .to('[data-cable="load"]', { strokeDashoffset: 0, duration: 0.2, stagger: 0.012 }, 0.5)
        .to('[data-node="load"]', { opacity: 1, scale: 1, duration: 0.1 }, 0.62)
        .set('[data-flow]', { animationPlayState: 'running' }, 0.68)
        .to('[data-flow]', { opacity: 1, duration: 0.12, stagger: 0.02 }, 0.7)

      /* Each beat fades up as its moment arrives and fades out before the next, so only
         one is ever legible. Driven off the same `revealAt` the data declares. */
      STORY_BEATS.forEach((beat, index) => {
        const selector = `[data-beat="${beat.id}"]`
        const next = STORY_BEATS[index + 1]
        const exitAt = next === undefined ? 0.97 : next.revealAt - 0.06

        timeline
          .fromTo(
            selector,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.06, ease: gsap.parseEase(cubicBezierString('appleOut')) },
            beat.revealAt,
          )
          .to(selector, { opacity: 0, y: -18, duration: 0.05 }, exitAt)
      })
    },
    /* Scoped so every selector above only ever matches inside this component, and
       re-run when the motion preference changes. useGSAP reverts the whole context on
       cleanup, which kills the timeline and its ScrollTrigger — no leak (Rule 18). */
    { scope: containerRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  return (
    <div
      ref={containerRef}
      className="relative"
      style={prefersReducedMotion ? undefined : { height: `${String(SCRUB_HEIGHT_VH)}vh` }}
    >
      <div
        data-pin
        className={cn(
          'flex flex-col justify-center gap-8 overflow-hidden px-4 md:px-6',
          prefersReducedMotion ? 'py-16' : 'h-screen',
        )}
      >
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          {/* Beats. Stacked on top of each other while pinned so only the active one
              shows; a normal flow list when motion is reduced. */}
          <div className={cn(prefersReducedMotion ? 'space-y-10' : 'relative min-h-[15rem]')}>
            {STORY_BEATS.map((beat) => (
              <article
                key={beat.id}
                data-beat={beat.id}
                className={cn(prefersReducedMotion ? '' : 'absolute inset-x-0 top-0')}
              >
                <p className="eyebrow text-teal-core">{beat.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink-50 md:text-3xl">
                  {beat.title}
                </h3>
                <p className="mt-3 max-w-sm text-ink-300">{beat.body}</p>
              </article>
            ))}
          </div>

          <RevealDiagram />
        </div>
      </div>
    </div>
  )
}

/** Maps a named curve to the string GSAP's easing parser accepts. */
function cubicBezierString(name: keyof typeof EASING_POINTS): string {
  const points = EASING_POINTS[name]
  return points.join(',')
}

/**
 * The schematic itself, drawn from the shared topology.
 *
 * Simplified against the operator version on purpose: no readings, no status colours,
 * no interaction. This is the shape of the site, not its state.
 */
function RevealDiagram() {
  const substation = findAsset(SUBSTATION)
  const load = findAsset(LOAD)

  return (
    <svg
      viewBox={`0 0 ${String(siteTopology.viewBoxWidth)} ${String(siteTopology.viewBoxHeight)}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full"
      role="img"
      aria-label="Single-line diagram: one grid substation feeding six power skids, which feed a data centre."
    >
      {siteTopology.links.map((link) => {
        const from = findAsset(link.from)
        const to = findAsset(link.to)
        if (from === undefined || to === undefined) return null
        const isGridSide = link.from === SUBSTATION

        return (
          <g key={`${link.from}->${link.to}`}>
            <path
              d={connectionPath(from, to)}
              data-cable={isGridSide ? 'grid' : 'load'}
              fill="none"
              /* pathLength normalises every cable to 1 unit long, so one dash value
                 draws them all regardless of their real length. */
              pathLength={1}
              strokeDasharray={1}
              strokeWidth={1.25}
              className="stroke-ink-700"
            />
            <path
              d={connectionPath(from, to)}
              data-flow
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8 16"
              className={cn(
                'animate-current-flow',
                isGridSide ? 'stroke-copper/70' : 'stroke-teal-live',
              )}
              style={{ animationDirection: isGridSide ? 'reverse' : 'normal' }}
            />
          </g>
        )
      })}

      {substation === undefined ? null : (
        <RevealNode kind="substation" label="Grid · 138 kV" x={substation.x} y={substation.y} />
      )}

      {SKID_IDS.map((id, index) => {
        const asset = findAsset(id)
        if (asset === undefined) return null
        return (
          <RevealNode
            key={id}
            kind="skid"
            label={`Skid ${String(index + 1)} · 2.5 MW`}
            x={asset.x}
            y={asset.y}
          />
        )
      })}

      {load === undefined ? null : (
        <RevealNode kind="load" label="Data centre" x={load.x} y={load.y} />
      )}
    </svg>
  )
}

interface RevealNodeProps {
  readonly kind: 'substation' | 'skid' | 'load'
  readonly label: string
  readonly x: number
  readonly y: number
}

function RevealNode({ kind, label, x, y }: RevealNodeProps) {
  const box = NODE_BOXES[kind]
  const origin = boxOrigin(kind, x, y)

  return (
    <g data-node={kind}>
      <rect
        x={origin.x}
        y={origin.y}
        width={box.width}
        height={box.height}
        rx={kind === 'skid' ? 11 : 14}
        strokeWidth={1}
        className={cn('stroke-ink-600', kind === 'skid' ? 'fill-ink-900' : 'fill-ink-850')}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="fill-ink-200 font-mono text-[11px]"
      >
        {label}
      </text>
    </g>
  )
}

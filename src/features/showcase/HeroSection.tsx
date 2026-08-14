import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { ArrowDown } from 'lucide-react'
import { gsap } from '../../utils/gsapSetup'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { SITE_CAPACITY_MWH, SITE_NAMEPLATE_MW, SKID_IDS } from '../../simulation/siteTopology'
import { EASING } from '../../utils/easing'

/**
 * The opening.
 *
 * The structural device is a bus bar: one horizontal conductor with the site's three
 * facts tapped off it. That is how a single-line diagram is actually drafted, so the
 * page opens in the vocabulary of the thing it is selling rather than in the vocabulary
 * of landing pages. It is also why there are no `01 / 02 / 03` markers here — these are
 * three simultaneous facts about one site, not three steps in a sequence.
 *
 * One orchestrated entrance on load, then nothing. The page's motion budget is spent on
 * the scroll reveal below; a hero that also moves would compete with it.
 */

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: { ease: EASING.appleOut, duration: 0.9 },
      })

      if (prefersReducedMotion) {
        /* The same reveal, without travel. Content still arrives deliberately rather
           than all at once, which is the part of the effect that carries meaning. */
        timeline
          .fromTo('[data-hero-line]', { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.06 })
          .fromTo('[data-hero-bus]', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '<')
          .fromTo('[data-hero-tap]', { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.05 }, '-=0.2')
        return
      }

      timeline
        .fromTo('[data-hero-line]', { yPercent: 110 }, { yPercent: 0, stagger: 0.08 })
        /* The bus draws itself left to right, then the taps drop off it — the order a
           drafter would actually work in. */
        .fromTo('[data-hero-bus]', { scaleX: 0 }, { scaleX: 1, duration: 1.1 }, '-=0.55')
        .fromTo(
          '[data-hero-tap]',
          { opacity: 0, y: -14 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          '-=0.7',
        )
        .fromTo('[data-hero-cta]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.45')
    },
    { scope: containerRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  const taps = [
    { value: `${String(SITE_NAMEPLATE_MW)} MW`, label: 'nameplate power' },
    { value: `${String(SITE_CAPACITY_MWH)} MWh`, label: 'usable energy' },
    { value: `${String(SKID_IDS.length)} skids`, label: 'independently derated' },
  ]

  return (
    <section ref={containerRef} className="mx-auto max-w-[1400px] px-4 pb-24 pt-24 md:px-6 md:pt-32">
      <p className="eyebrow text-teal-core">BlackTeal · Energy management system</p>

      {/* Each line is clipped by its own wrapper so the entrance reads as type rising
          off a baseline rather than a block sliding in. */}
      <h1 className="mt-6 max-w-4xl text-display font-semibold text-ink-50 md:text-display-lg">
        <span className="block overflow-hidden pb-1">
          <span data-hero-line className="block">
            The grid,
          </span>
        </span>
        <span className="block overflow-hidden pb-1">
          <span data-hero-line className="block text-teal-live">
            drawn honestly.
          </span>
        </span>
      </h1>

      <p className="mt-8 max-w-xl text-lg text-ink-300">
        BlackTeal runs the batteries between a 138 kV substation and a data centre that cannot go
        dark. Every figure on screen is one an operator can act on — including the ones that say the
        screen itself has stopped being true.
      </p>

      {/* The bus bar. A single conductor with the site's facts tapped off it. */}
      <div className="mt-16">
        <div
          data-hero-bus
          className="h-px w-full origin-left bg-gradient-to-r from-teal-core via-teal-deep to-transparent"
        />
        <dl className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-3">
          {taps.map((tap) => (
            <div key={tap.label} data-hero-tap className="border-l border-ink-700 pl-4">
              <dt className="eyebrow">{tap.label}</dt>
              <dd className="mt-2 font-mono text-readout text-ink-50">{tap.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* No call-to-action button. The page is one continuous scroll now, so a button whose
          only job is to scroll down is competing with the scroll itself. The header keeps a
          single skip link for operators who open this daily and want the data immediately. */}
      <div data-hero-cta className="mt-14 flex items-center gap-3">
        <ArrowDown className="h-4 w-4 shrink-0 animate-bounce text-teal-core" aria-hidden />
        <p className="font-mono text-caption text-ink-500">
          Scroll. Simulated site, real behaviour — including the failures.
        </p>
      </div>
    </section>
  )
}

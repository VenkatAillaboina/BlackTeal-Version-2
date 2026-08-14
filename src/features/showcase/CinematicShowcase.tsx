import { memo } from 'react'
import { ArrowDown } from 'lucide-react'
import { HeroSection } from './HeroSection'
import { ScrollTopologyReveal } from './ScrollTopologyReveal'

/**
 * The marketing layer: hero, scroll reveal, one closing invitation.
 *
 * Three sections and no more. The pinned reveal is the page's signature, and everything
 * around it stays quiet so that it lands — a second scroll effect competing for
 * attention would make both feel cheap.
 */


/**
 * Memoised, and the reason is measured rather than precautionary (Rule 25).
 *
 * The telemetry feed lives in the app shell and pushes a frame every second, so the
 * shell re-renders at 1 Hz. The showcase reads no telemetry, but it was re-rendering
 * anyway — and each React commit made ScrollTrigger re-read computed styles mid-scroll,
 * which a trace showed as 122 ms of forced reflow. With a memo and a stable callback the
 * showcase renders once and the scrub runs against a static tree.
 */
export const CinematicShowcase = memo(function CinematicShowcase() {
  return (
    <main>
      <HeroSection />
      <ScrollTopologyReveal />

      <section className="mx-auto max-w-[1400px] px-4 pb-32 pt-16 md:px-6">
        <div className="border-t border-ink-800 pt-12">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink-50 md:text-4xl">
            The diagram you just watched is directly below.
          </h2>
          <p className="mt-4 max-w-xl text-ink-300">
            Same topology, same geometry, same colour convention — now carrying live telemetry,
            grouped alarms and a feed that reports its own health. Take a skid offline and watch what
            the screen admits.
          </p>
          {/* No button. The console is directly below, so a control that scrolls the page
              down by one screen would be doing what the scroll wheel already does. The
              cue is the line above plus the panels rising into place as you reach them. */}
          <p className="mt-8 flex items-center gap-2 font-mono text-caption text-ink-500">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce text-teal-core" aria-hidden />
            Keep scrolling
          </p>
        </div>
      </section>
    </main>
  )
})

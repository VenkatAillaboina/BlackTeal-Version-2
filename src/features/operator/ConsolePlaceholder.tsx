/**
 * What occupies the console's space before the viewer gets near it.
 *
 * It exists to hold height, not to entertain. Without something here the page would grow
 * by a screen and a half the moment the real console mounted, and every scroll position
 * below it would shift under the viewer's hands.
 *
 * Deliberately says nothing about the site's state. Inventing a plausible-looking
 * skeleton with fake bars where live telemetry will go is the same lie as a green badge
 * on frozen data, just earlier (Rule 13).
 */

export function ConsolePlaceholder() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[1400px] items-center justify-center px-4 md:px-6">
      <div className="text-center">
        <p className="eyebrow text-teal-core">Live console</p>
        <p className="mt-4 font-mono text-caption text-ink-500">
          Loads as you reach it.
        </p>
      </div>
    </div>
  )
}

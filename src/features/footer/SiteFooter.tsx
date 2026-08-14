import { ArrowUp, Mail, Phone } from 'lucide-react'
import { FeedbackForm } from './FeedbackForm'
import { COMPANY_NAME, CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from './contactDetails'

/**
 * The end of the page.
 *
 * The page previously stopped dead at the last panel of the console, which is what made it
 * read as unfinished — there was no signal that you had reached the bottom rather than the
 * loading spinner of something that had failed.
 *
 * Ordered by what someone actually wants down here: talk to us, follow us, tell us what is
 * wrong, then the legal line. The disclaimer about this being a simulated site is stated
 * plainly rather than buried, because the whole product argument upstairs is about not
 * misrepresenting what a screen knows.
 */

interface SiteFooterProps {
  readonly onBackToTop: () => void
}

export function SiteFooter({ onBackToTop }: SiteFooterProps) {
  /* Read at render rather than hard-coded, so the notice does not quietly go stale. */
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
                <path d="M2 11 H20" strokeWidth="2" strokeLinecap="round" className="stroke-teal-core" />
                <path d="M11 11 V19" strokeWidth="2" strokeLinecap="round" className="stroke-teal-live" />
                <circle cx="11" cy="19" r="2.2" className="fill-teal-live" />
              </svg>
              <span className="font-semibold tracking-tight text-ink-50">BlackTeal</span>
            </div>
            <p className="mt-4 max-w-xs text-caption text-ink-400">
              Energy management for grid-scale storage. Built so an operator can trust the screen —
              including when it has stopped being true.
            </p>

            <ul className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    /* noreferrer as well as noopener: the target must not learn where the
                       click came from, and it must not get a handle on this window. */
                    rel="noopener noreferrer"
                    aria-label={`${COMPANY_NAME} on ${social.label}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors duration-quick ease-apple hover:border-teal-core hover:text-teal-live"
                  >
                    <social.icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="eyebrow text-ink-300">Contact</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-caption text-ink-200 transition-colors duration-quick hover:text-teal-live"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-ink-500" aria-hidden />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 text-caption text-ink-200 transition-colors duration-quick hover:text-teal-live"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-ink-500" aria-hidden />
                  {CONTACT_PHONE}
                </a>
              </li>
            </ul>

            <button
              type="button"
              onClick={onBackToTop}
              className="group mt-6 inline-flex items-center gap-2 rounded-full border border-ink-700 px-3.5 py-1.5 font-mono text-eyebrow uppercase text-ink-300 transition-colors duration-quick ease-apple hover:border-teal-core hover:text-teal-live"
            >
              <ArrowUp
                className="h-3 w-3 transition-transform duration-quick ease-apple group-hover:-translate-y-0.5"
                aria-hidden
              />
              Back to top
            </button>
          </div>

          <FeedbackForm />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-ink-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-caption text-ink-500">
            © {year} {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="font-mono text-caption text-ink-600">
            Simulated site data. Not connected to real plant equipment.
          </p>
        </div>
      </div>
    </footer>
  )
}

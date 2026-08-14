import { useState } from 'react'
import { Send } from 'lucide-react'
import { CONTACT_EMAIL } from './contactDetails'

/**
 * Feedback that actually goes somewhere.
 *
 * There is no backend here, so the honest options were: pretend to submit, or hand the
 * message to something that can really send it. This does the second — it composes a
 * `mailto:` with the subject and body already filled in and opens the visitor's own mail
 * client.
 *
 * That matters more than it looks. A form that shows "Thanks, we'll be in touch" while
 * throwing the message away is the same class of lie as a LIVE badge on frozen telemetry,
 * and this project spends its whole first screen promising not to do that.
 */

export function FeedbackForm() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const canSend = name.trim().length > 0 && message.trim().length > 0

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!canSend) return

    const subject = encodeURIComponent(`BlackTeal feedback from ${name.trim()}`)
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm">
      <h3 className="eyebrow text-ink-300">Send feedback</h3>

      <div className="mt-3 space-y-2.5">
        <div>
          <label htmlFor="feedback-name" className="sr-only">
            Your name
          </label>
          <input
            id="feedback-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-panel border border-ink-700 bg-ink-950 px-3 py-2 text-caption text-ink-100 placeholder:text-ink-500"
          />
        </div>

        <div>
          <label htmlFor="feedback-message" className="sr-only">
            Your message
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
            }}
            placeholder="What would you change?"
            rows={3}
            className="w-full resize-y rounded-panel border border-ink-700 bg-ink-950 px-3 py-2 text-caption text-ink-100 placeholder:text-ink-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSend}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-core px-4 py-2 font-mono text-eyebrow font-semibold uppercase text-ink-void transition-colors duration-quick ease-apple hover:bg-teal-live disabled:cursor-not-allowed disabled:bg-ink-800 disabled:text-ink-500"
      >
        <Send className="h-3 w-3" aria-hidden />
        Open in email
      </button>

      {/* Said before they type, not after. Nobody should discover how this works only once
          their mail client has already opened. */}
      <p className="mt-2.5 text-caption text-ink-500">
        This opens your own email app with the message ready to send. Nothing is stored here.
      </p>
    </form>
  )
}

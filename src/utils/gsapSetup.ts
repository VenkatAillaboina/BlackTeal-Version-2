/**
 * GSAP plugin registration, done exactly once.
 *
 * Lives in `utils` rather than inside the showcase feature because both features animate
 * now — the showcase reveals the story, the console reveals its panels — and a feature
 * importing from a sibling feature would break the one-way dependency rule (Rule 19).
 *
 * Module-level rather than inside a component: registration is global state, and saying
 * so plainly is better than re-running it on every mount.
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * On phones, scrolling hides and shows the browser's address bar, which changes the
 * viewport height mid-scroll. ScrollTrigger treats that as a resize and recalculates
 * every trigger, so pinned sections jump and scrubbed animations snap. This is GSAP's
 * own switch for it, and it is the difference between the reveal feeling deliberate on a
 * phone and feeling broken.
 */
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }

import type { ComponentType } from 'react'
import { InstagramMark, LinkedInMark, XMark, YouTubeMark } from './BrandIcons'

/**
 * Contact and social links, in one place.
 *
 * Placeholders, and deliberately obvious ones — `example.com` rather than a real-looking
 * handle — so nobody ships this thinking the links go somewhere. Swap the four `href`
 * values and the two contact lines for the real ones.
 */

export const CONTACT_EMAIL = 'hello@blackteal.example.com'
export const CONTACT_PHONE = '+91 00000 00000'
export const COMPANY_NAME = 'BlackTeal Energy Systems'

export interface SocialLink {
  readonly label: string
  readonly href: string
  readonly icon: ComponentType<{ className?: string }>
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/example', icon: LinkedInMark },
  { label: 'Instagram', href: 'https://www.instagram.com/example', icon: InstagramMark },
  { label: 'X', href: 'https://x.com/example', icon: XMark },
  { label: 'YouTube', href: 'https://www.youtube.com/@example', icon: YouTubeMark },
]

/**
 * The single source of visual truth. Every colour, radius, shadow and curve the app
 * is allowed to use lives here — a hex code written anywhere else is a bug.
 *
 * TypeScript rather than JS so the motion curves can be imported from
 * `src/utils/easing.ts` instead of hand-copied. Tailwind v3 loads .ts configs natively.
 *
 * Dark is not a mode here, it is the only palette. There are no `dark:` variants
 * anywhere in this project.
 */

import type { Config } from 'tailwindcss'
import { EASING, DURATION_MS } from './src/utils/easing'

/**
 * Teal in three stages, because on this product colour carries meaning:
 * a conductor at rest, a brand mark, and power actually moving through the line.
 * Copper is the counterpart — it is what real bus bars are made of, and it marks the
 * opposite direction of flow (importing from the grid) so direction never depends on
 * an arrowhead alone.
 */
const BRAND = {
  'teal-deep': '#0B6E6E',
  'teal-core': '#12A594',
  'teal-live': '#3DDBC8',
  'teal-glow': '#7FF0DF',
  copper: '#C77B4A',
  'copper-glow': '#E6A87A',
} as const

/**
 * Surfaces and text, darkest to lightest. `void` carries a trace of blue-green rather
 * than being pure #000 so the teal sits inside the same family instead of floating
 * on top of it.
 */
const INK = {
  void: '#050607',
  950: '#0A0E10',
  900: '#0F1417',
  850: '#141B1F',
  800: '#1A2327',
  700: '#232E33',
  600: '#2E3B41',
  500: '#455158',
  400: '#5E6D75',
  300: '#8598A1',
  200: '#A9BAC2',
  100: '#D4E1E6',
  50: '#F1F7F9',
} as const

/**
 * Named by meaning, never by hue, so Rule 15 stays enforceable: a component asks for
 * `status-fault` and separately supplies an icon and a text label.
 *
 * `stale` is violet on purpose. Stale is not a severity — it is "this number may be
 * wrong and I cannot tell you". Keeping it outside the green/amber/red family stops an
 * operator reading frozen data as a mild warning.
 */
const STATUS = {
  normal: '#3DDBC8',
  warning: '#E8A33D',
  fault: '#F04E4E',
  offline: '#4A5560',
  stale: '#9B7BD4',
} as const

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...BRAND,
        ink: INK,
        status: STATUS,
      },

      fontFamily: {
        /* Display and body share a family; the difference is tracking and weight,
           set explicitly per size below. One less webfont to load. */
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        /* Every telemetry value, alarm code and nameplate label. Tabular by default. */
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },

      fontSize: {
        /* Small caps-style labels above a metric or section. */
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        /* Unit suffixes and secondary annotations. */
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        /* A live telemetry number inside a card. */
        readout: ['1.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        /* The one number a section is about. */
        'readout-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        /* Cinematic headlines. Tracking tightens as size grows, as it must. */
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'display-lg': ['5rem', { lineHeight: '0.98', letterSpacing: '-0.045em' }],
      },

      borderRadius: {
        /* Apple-style soft panels. Two sizes only — more invites inconsistency. */
        panel: '1.125rem',
        stage: '1.75rem',
      },

      boxShadow: {
        /* Cheap: a hairline plus one soft drop. Never animated (Rule 11). */
        panel: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -12px rgb(0 0 0 / 0.8)',
        /* Applied only to elements that are genuinely energised. */
        live: '0 0 0 1px rgb(61 219 200 / 0.28), 0 0 28px -6px rgb(61 219 200 / 0.35)',
        fault: '0 0 0 1px rgb(240 78 78 / 0.32), 0 0 28px -6px rgb(240 78 78 / 0.35)',
      },

      transitionTimingFunction: {
        apple: EASING.apple,
        'apple-out': EASING.appleOut,
        'apple-in-out': EASING.appleInOut,
        conductor: EASING.conductor,
      },

      transitionDuration: Object.fromEntries(
        Object.entries(DURATION_MS).map(([name, ms]) => [name, `${String(ms)}ms`]),
      ),

      keyframes: {
        /* Transform and opacity only. Nothing here triggers layout or paint. */
        'rise-in': {
          from: { opacity: '0', transform: 'translate3d(0, 12px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        /* A conductor carrying current. Driven by dash offset, which is composited. */
        'current-flow': {
          from: { strokeDashoffset: '0' },
          to: { strokeDashoffset: '-24' },
        },
        /* Marks a value that is being polled but has not refreshed yet. */
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },

      animation: {
        'rise-in': 'rise-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'current-flow': 'current-flow 900ms linear infinite',
        'pulse-live': 'pulse-live 1800ms cubic-bezier(0.65, 0, 0.35, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config

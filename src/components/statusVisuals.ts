/**
 * The one place a status is turned into something visible.
 *
 * Every entry carries a colour *and* an icon *and* a word, because Rule 15 forbids
 * conveying severity by colour alone — a colour-blind operator, a glare-washed screen
 * and a greyscale printout all have to work. Components read from these tables instead
 * of choosing their own classes, so a status can never look critical in one panel and
 * mild in another.
 *
 * Class strings are written out in full. Tailwind scans source as plain text, so a
 * class assembled at runtime is never generated.
 */

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  OctagonX,
  PowerOff,
  Radio,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AlarmSeverity, AssetStatus, FeedConnection } from '../types/bess'

export interface StatusVisual {
  /** The word shown next to the colour. Never omitted. */
  readonly label: string
  readonly icon: LucideIcon
  readonly text: string
  readonly bg: string
  readonly border: string
  readonly dot: string
  /** Stroke colour for SVG topology nodes. */
  readonly stroke: string
  readonly fill: string
}

export const STATUS_VISUALS: Readonly<Record<AssetStatus, StatusVisual>> = {
  NORMAL: {
    label: 'Normal',
    icon: CheckCircle2,
    text: 'text-status-normal',
    bg: 'bg-status-normal/10',
    border: 'border-status-normal/30',
    dot: 'bg-status-normal',
    stroke: 'stroke-status-normal',
    fill: 'fill-status-normal',
  },
  WARNING: {
    label: 'Warning',
    icon: AlertTriangle,
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    dot: 'bg-status-warning',
    stroke: 'stroke-status-warning',
    fill: 'fill-status-warning',
  },
  FAULT: {
    label: 'Fault',
    icon: OctagonX,
    text: 'text-status-fault',
    bg: 'bg-status-fault/10',
    border: 'border-status-fault/30',
    dot: 'bg-status-fault',
    stroke: 'stroke-status-fault',
    fill: 'fill-status-fault',
  },
  OFFLINE: {
    label: 'Offline',
    icon: PowerOff,
    text: 'text-status-offline',
    bg: 'bg-status-offline/10',
    border: 'border-status-offline/40',
    dot: 'bg-status-offline',
    stroke: 'stroke-status-offline',
    fill: 'fill-status-offline',
  },
}

export interface SeverityVisual {
  readonly label: string
  readonly icon: LucideIcon
  readonly text: string
  readonly bg: string
  readonly border: string
  readonly dot: string
}

export const SEVERITY_VISUALS: Readonly<Record<AlarmSeverity, SeverityVisual>> = {
  critical: {
    label: 'Critical',
    icon: OctagonX,
    text: 'text-status-fault',
    bg: 'bg-status-fault/10',
    border: 'border-status-fault/30',
    dot: 'bg-status-fault',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    dot: 'bg-status-warning',
  },
  info: {
    label: 'Info',
    icon: Info,
    text: 'text-teal-live',
    bg: 'bg-teal-live/10',
    border: 'border-teal-live/25',
    dot: 'bg-teal-live',
  },
}

export interface ConnectionVisual {
  readonly label: string
  readonly icon: LucideIcon
  readonly text: string
  readonly bg: string
  readonly border: string
  readonly dot: string
  /** One sentence saying what the operator can and cannot trust right now. */
  readonly meaning: string
  /** Whether the dot should pulse. Only a genuinely live feed earns motion. */
  readonly animated: boolean
}

/**
 * Note that STALE and DISCONNECTED are violet and grey, not amber and red. They are not
 * severities — they say "the screen may be wrong", which is a different claim from "the
 * equipment is in trouble". Colouring them like faults would have an operator dispatch
 * a crew to a healthy site.
 */
export const CONNECTION_VISUALS: Readonly<Record<FeedConnection, ConnectionVisual>> = {
  CONNECTING: {
    label: 'Connecting',
    icon: Radio,
    text: 'text-ink-300',
    bg: 'bg-ink-800',
    border: 'border-ink-700',
    dot: 'bg-ink-400',
    meaning: 'Waiting for the first frame. No readings yet.',
    animated: true,
  },
  LIVE: {
    label: 'Live',
    icon: Radio,
    text: 'text-status-normal',
    bg: 'bg-status-normal/10',
    border: 'border-status-normal/30',
    dot: 'bg-status-normal',
    meaning: 'Frames arriving on time. Readings are current.',
    animated: true,
  },
  STALE: {
    label: 'Stale',
    icon: HelpCircle,
    text: 'text-status-stale',
    bg: 'bg-status-stale/10',
    border: 'border-status-stale/30',
    dot: 'bg-status-stale',
    meaning: 'Frames have stopped. Every reading below is the last one received.',
    animated: false,
  },
  DISCONNECTED: {
    label: 'Disconnected',
    icon: WifiOff,
    text: 'text-status-stale',
    bg: 'bg-status-stale/15',
    border: 'border-status-stale/40',
    dot: 'bg-status-stale',
    meaning: 'The feed is gone. Nothing on this screen can be trusted.',
    animated: false,
  },
}

/** True when the connection means readings must not be presented as current. */
export function isFeedTrustworthy(connection: FeedConnection): boolean {
  return connection === 'LIVE'
}

/**
 * Wires the simulator into React, and keeps an independent clock watching the feed.
 *
 * Two timers, deliberately:
 *
 *   • the simulator pushes a frame every second
 *   • a separate 500 ms clock re-asks "how long since the last frame?"
 *
 * The second one is the one that matters. When a feed dies, no frame arrives to
 * announce it — so only a timer that keeps checking can notice. A single frame-driven
 * timer would fall silent along with the feed and the console would sit there showing
 * a green LIVE badge on frozen numbers for ever, which is exactly what Rule 13 forbids.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedConnection, FeedHealth, SiteFrame, TelemetryState } from '../types/bess'
import type { SimulatorControls } from '../simulation/telemetrySimulator'
import { FRAME_INTERVAL_MS, createTelemetrySimulator } from '../simulation/telemetrySimulator'

/** How often the staleness clock re-evaluates. Independent of the frame rate. */
const HEALTH_POLL_MS = 500

/** Two and a half missed frames is a hiccup worth flagging, not yet a dead feed. */
const STALE_AFTER_MS = FRAME_INTERVAL_MS * 2.5
/** Eight seconds of silence is a dead feed. */
const DISCONNECTED_AFTER_MS = FRAME_INTERVAL_MS * 8

const INITIAL_HEALTH: FeedHealth = { connection: 'CONNECTING', lastFrameAt: null, ageMs: 0 }

function connectionFor(ageMs: number): FeedConnection {
  if (ageMs <= STALE_AFTER_MS) return 'LIVE'
  if (ageMs <= DISCONNECTED_AFTER_MS) return 'STALE'
  return 'DISCONNECTED'
}

export interface LiveTelemetry {
  readonly telemetry: TelemetryState
  /** Null until the simulator has mounted. */
  readonly controls: SimulatorControls | null
}

export function useLiveTelemetry(): LiveTelemetry {
  const [frame, setFrame] = useState<SiteFrame | null>(null)
  const [health, setHealth] = useState<FeedHealth>(INITIAL_HEALTH)
  const [error, setError] = useState<string | null>(null)
  const [controls, setControls] = useState<SimulatorControls | null>(null)

  /* A ref, not state: the health clock reads this on every poll and must see the
     latest value without the effect re-subscribing each time a frame lands. */
  const lastFrameAtRef = useRef<number | null>(null)

  const handleFrame = useCallback((next: SiteFrame) => {
    lastFrameAtRef.current = next.timestamp
    setFrame(next)
    setError(null)
  }, [])

  useEffect(() => {
    let simulator: SimulatorControls | null = null

    /* Rule 21: a throw inside the source must not take the console down with it. If the
       feed cannot start, the UI shows an error state instead of a blank screen. */
    try {
      simulator = createTelemetrySimulator(handleFrame)
      simulator.start()
      setControls(simulator)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Telemetry source failed to start')
    }

    const healthClock = setInterval(() => {
      const lastFrameAt = lastFrameAtRef.current
      const now = Date.now()

      setHealth((previous) => {
        if (lastFrameAt === null) return previous

        const ageMs = now - lastFrameAt
        const connection = connectionFor(ageMs)

        /* Returning the previous object when nothing visible changed lets React bail
           out of the re-render. Age is only compared to the second because that is all
           the UI ever shows — polling twice a second would otherwise re-render the whole
           console twice a second for no reason. */
        const sameSecond = Math.floor(previous.ageMs / 1000) === Math.floor(ageMs / 1000)
        if (previous.connection === connection && previous.lastFrameAt === lastFrameAt && sameSecond) {
          return previous
        }

        return { connection, lastFrameAt, ageMs }
      })
    }, HEALTH_POLL_MS)

    return () => {
      simulator?.stop()
      clearInterval(healthClock)
      setControls(null)
    }
  }, [handleFrame])

  return { telemetry: { frame, health, error }, controls }
}

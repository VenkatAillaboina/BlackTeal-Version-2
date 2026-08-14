import type { TopologyAsset } from '../../types/bess'
import { connectionPath } from './geometry'
import type { LinkFlow } from './linkFlow'
import { linkFlowDurationMs, linkStrokeClass } from './linkFlow'
import { cn } from '../../utils/cn'

/**
 * One cable.
 *
 * Two strokes stacked: a static base line that is always drawn, and a dashed overlay
 * that only exists while power is actually flowing. Separating them means a de-energised
 * cable is a plain quiet line rather than a moving one with the animation paused, and it
 * keeps the moving element to a single dashed path per cable.
 *
 * The movement is `stroke-dashoffset`, which the compositor can handle. Animating the
 * path geometry itself, or a filter, would not hold 60 FPS with twelve cables running
 * (Rule 11). When the viewer prefers reduced motion the dashed overlay is drawn without
 * the animation — the cable still reads as energised by colour and dash pattern, it
 * simply does not travel.
 */

interface TopologyConnectionProps {
  readonly from: TopologyAsset
  readonly to: TopologyAsset
  readonly flow: LinkFlow
  readonly prefersReducedMotion: boolean
}

export function TopologyConnection({ from, to, flow, prefersReducedMotion }: TopologyConnectionProps) {
  const path = connectionPath(from, to)

  return (
    <g>
      <path
        d={path}
        fill="none"
        strokeWidth={2}
        className={cn(
          'stroke-ink-800 transition-[stroke] duration-settle ease-apple',
          flow.status === 'OFFLINE' && 'opacity-60',
        )}
        strokeDasharray={flow.status === 'OFFLINE' ? '4 6' : undefined}
      />

      {flow.isEnergised ? (
        <path
          d={path}
          fill="none"
          /* Weight carries magnitude as well as colour, so a lightly loaded cable and a
             fully loaded one differ even in a greyscale screenshot. */
          strokeWidth={1.5 + flow.intensity * 2}
          strokeLinecap="round"
          strokeDasharray="10 14"
          className={cn(linkStrokeClass(flow), !prefersReducedMotion && 'animate-current-flow')}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  animationDuration: `${String(linkFlowDurationMs(flow))}ms`,
                  /* Charging runs the dashes backwards: power is travelling from the
                     grid into the pack, and the diagram should say so. */
                  animationDirection: flow.direction === 'charging' ? 'reverse' : 'normal',
                }
          }
        />
      ) : null}
    </g>
  )
}

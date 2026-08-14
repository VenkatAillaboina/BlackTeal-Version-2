/**
 * The schematic's shapes and the paths between them.
 *
 * Node sizes live here rather than inside the node components because the connection
 * paths need to know where a node's edge is. If a skid box got wider and only the
 * component knew, every cable would start 20 units inside it.
 */

import type { AssetKind, TopologyAsset } from '../../types/bess'

export interface NodeBox {
  readonly width: number
  readonly height: number
}

export const NODE_BOXES: Readonly<Record<AssetKind, NodeBox>> = {
  substation: { width: 150, height: 96 },
  skid: { width: 168, height: 58 },
  load: { width: 150, height: 96 },
}

/**
 * Top-left corner, since SVG rects are positioned from their corner but the topology
 * stores centres.
 *
 * Takes the three values it actually uses rather than a whole `TopologyAsset`, so the
 * cinematic reveal — which draws boxes that are not bound to a specific asset — can call
 * it without inventing a fake id.
 */
export function boxOrigin(kind: AssetKind, x: number, y: number): { x: number; y: number } {
  const box = NODE_BOXES[kind]
  return { x: x - box.width / 2, y: y - box.height / 2 }
}

function rightEdge(asset: TopologyAsset): { x: number; y: number } {
  return { x: asset.x + NODE_BOXES[asset.kind].width / 2, y: asset.y }
}

function leftEdge(asset: TopologyAsset): { x: number; y: number } {
  return { x: asset.x - NODE_BOXES[asset.kind].width / 2, y: asset.y }
}

/**
 * A cable from one node's right edge to the next node's left edge.
 *
 * Drawn as a cubic bezier with horizontal control handles, which is how a single-line
 * diagram is actually drafted: the run leaves the equipment horizontally, turns once,
 * and arrives horizontally. A straight diagonal would read as a schematic shortcut
 * rather than a conductor.
 */
export function connectionPath(from: TopologyAsset, to: TopologyAsset): string {
  const start = rightEdge(from)
  const end = leftEdge(to)
  const midpoint = start.x + (end.x - start.x) / 2

  return `M ${String(start.x)} ${String(start.y)} C ${String(midpoint)} ${String(start.y)}, ${String(midpoint)} ${String(end.y)}, ${String(end.x)} ${String(end.y)}`
}

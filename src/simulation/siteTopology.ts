/**
 * Where everything is, and what is wired to what.
 *
 * This is the single source of truth for site layout. The SVG schematic and the
 * cinematic reveal both lay themselves out from these coordinates, which is what makes
 * it impossible for the two views to drift apart — move a skid here and it moves in
 * both places.
 *
 * Coordinates are in the schematic's own viewBox space, not pixels. The SVG scales to
 * whatever width it is given, so the layout stays correct at 768 px and at 1440 px.
 */

import type { AssetId, SiteTopology, TopologyAsset, TopologyLink } from '../types/bess'
import { asAssetId } from '../types/bess'

export const SUBSTATION = asAssetId('SUBSTATION')
export const LOAD = asAssetId('LOAD')

/* Named individually as well as collected in an array. `noUncheckedIndexedAccess`
   makes SKID_IDS[1] an `AssetId | undefined`, so code that needs one specific skid uses
   the constant instead of an index it would then have to null-check. */
const SKID_1 = asAssetId('SKID-1')
export const SKID_2 = asAssetId('SKID-2')
const SKID_3 = asAssetId('SKID-3')
const SKID_4 = asAssetId('SKID-4')
export const SKID_5 = asAssetId('SKID-5')
const SKID_6 = asAssetId('SKID-6')

export const SKID_IDS: readonly AssetId[] = [SKID_1, SKID_2, SKID_3, SKID_4, SKID_5, SKID_6]

const VIEW_BOX_WIDTH = 1000
const VIEW_BOX_HEIGHT = 520

/** Skids sit on one vertical rail between the substation and the load. */
const SKID_COLUMN_X = 500
const SKID_TOP_Y = 60
const SKID_SPACING_Y = 80

const ASSETS: readonly TopologyAsset[] = [
  {
    id: SUBSTATION,
    kind: 'substation',
    label: 'Grid substation · 138 kV',
    x: 110,
    y: 260,
  },
  ...SKID_IDS.map<TopologyAsset>((id, index) => ({
    id,
    kind: 'skid',
    label: `Power skid ${String(index + 1)}`,
    x: SKID_COLUMN_X,
    y: SKID_TOP_Y + index * SKID_SPACING_Y,
  })),
  {
    id: LOAD,
    kind: 'load',
    label: 'Data centre load',
    x: 890,
    y: 260,
  },
]

/** The substation feeds every skid; every skid feeds the load. */
const LINKS: readonly TopologyLink[] = [
  ...SKID_IDS.map<TopologyLink>((id) => ({ from: SUBSTATION, to: id })),
  ...SKID_IDS.map<TopologyLink>((id) => ({ from: id, to: LOAD })),
]

export const siteTopology: SiteTopology = {
  assets: ASSETS,
  links: LINKS,
  viewBoxWidth: VIEW_BOX_WIDTH,
  viewBoxHeight: VIEW_BOX_HEIGHT,
}

/* ────────────────────────────────────────────────────────────────  lookup ── */

const ASSETS_BY_ID = new Map<AssetId, TopologyAsset>(ASSETS.map((asset) => [asset.id, asset]))

export function findAsset(id: AssetId): TopologyAsset | undefined {
  return ASSETS_BY_ID.get(id)
}

/** The asset's own label, falling back to its raw id so a view never renders blank. */
export function assetLabel(id: AssetId): string {
  return ASSETS_BY_ID.get(id)?.label ?? id
}

/* ──────────────────────────────────────────────────────────────── ratings ── */

/** Nameplate figures, used to draw headroom bars and to bound the simulation. */
export const SKID_NAMEPLATE_KW = 2500
export const SKID_CAPACITY_MWH = 5
export const SITE_NAMEPLATE_MW = (SKID_NAMEPLATE_KW * SKID_IDS.length) / 1000
export const SITE_CAPACITY_MWH = SKID_CAPACITY_MWH * SKID_IDS.length

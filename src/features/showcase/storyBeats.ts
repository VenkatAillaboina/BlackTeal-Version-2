/**
 * The narrative, kept apart from the animation that delivers it.
 *
 * Copy lives in data because the scroll sequence and the reduced-motion fallback have to
 * tell the same story — one as a pinned reveal, one as a plain stacked list. Two copies
 * of the words would drift the first time a line was edited.
 *
 * `revealAt` is a fraction of the scroll timeline, so a beat's text and the drawing it
 * describes are scheduled from the same number.
 */

export interface StoryBeat {
  readonly id: string
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  /** Position along the pinned timeline, 0–1. */
  readonly revealAt: number
}

export const STORY_BEATS: readonly StoryBeat[] = [
  {
    id: 'grid',
    eyebrow: 'The boundary',
    title: 'One connection to the grid',
    body: '138 kV in, 34.5 kV across the site. Everything the plant does is measured against what crosses this line — import, export, and the exact moment one becomes the other.',
    revealAt: 0.04,
  },
  {
    id: 'skids',
    eyebrow: 'The fleet',
    title: 'Six skids, addressed individually',
    body: '2.5 MW and 5 MWh apiece. The system never averages them into one battery, because they do not fail as one battery. A hot pack derates alone, and you see which one.',
    revealAt: 0.3,
  },
  {
    id: 'flow',
    eyebrow: 'The reading',
    title: 'Power you can watch moving',
    body: 'Teal leaves the packs. Copper goes back into them. Direction is carried by colour and by the way the dashes travel, not by an arrowhead you have to lean in to find.',
    revealAt: 0.58,
  },
  {
    id: 'truth',
    eyebrow: 'The promise',
    title: 'A feed that admits when it is blind',
    body: 'When frames stop arriving the console says so, and dims every value it can no longer vouch for. A green badge sitting on frozen numbers is the one failure this system will not ship.',
    revealAt: 0.84,
  },
]

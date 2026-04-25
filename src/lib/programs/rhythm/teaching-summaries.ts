/**
 * One-line teaching summaries shown beneath the "What you'll learn" notation
 * preview on rhythm topic pages. Keys are category names exactly as stored on
 * `rhythm_exercises.category` (case-insensitive lookup via `getTeachingSummary`).
 *
 * If a category isn't listed here, the topic page silently omits the summary
 * line and shows the notation preview alone — fill new entries in as topics
 * are introduced.
 */
const TEACHING_SUMMARIES: Record<string, string> = {
  // Fundamentals
  'basic rests': 'Quarter rests on beats 1 and 3, alternating with quarter notes on beats 2 and 4.',
  'quarter/half/whole notes': 'The three foundational note values combined within a single 4/4 bar.',
  'eighth notes': 'Beamed eighth-note pairs subdividing each beat — count "1-and 2-and".',
  'pulse games & meter basics': 'Locking the pulse and feeling the difference between simple-duple, triple, and quadruple meters.',
  'simple syncopation': 'Off-beat eighth-quarter-eighth pattern that displaces the strong beats.',
  'ties': 'Notes connected across the bar line or beat — held through, not re-attacked.',
  'dotted notes': 'A dot adds half the note\'s value — dotted quarter = quarter + eighth tied.',
  'compound meter': '6/8, 9/8, 12/8 — beats subdivide into three eighths instead of two.',

  // Personal Practice
  'groove syncopation': 'Pop and funk syncopation — anticipations on the "and" of beats 2 and 4.',
  'sixteenth groove': 'Sixteenth-note grooves with mixed eighth/sixteenth subdivisions.',
  'mixed subdivision': 'Switching between eighth and sixteenth feels within a phrase.',
  'reading etudes': 'Multi-bar reading studies that combine prior topics into a flowing passage.',

  // Conservatory Prep
  'syncopation systems': 'Systematic displacement patterns — every off-beat position covered.',
  'sixteenth vocabulary': 'Full sixteenth-note vocabulary including dotted-eighth + sixteenth, sixteenth-rest figures.',
  'mixed meter': 'Bar-to-bar meter changes — 5/8, 7/8, 4/4 → 3/4 transitions.',
  'polyrhythm prep': 'Two-against-three and three-against-four feels at the bar level.',
  'performance etudes': 'Audition-length etudes that string advanced rhythmic vocabulary together.',
}

/**
 * Look up a teaching summary by category name, case-insensitive. Returns the
 * empty string if no summary is configured — callers should treat empty as
 * "render the preview without a summary line".
 */
export function getTeachingSummary(categoryName: string): string {
  return TEACHING_SUMMARIES[categoryName.toLowerCase()] ?? ''
}

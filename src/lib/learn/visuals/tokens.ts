/**
 * Design tokens for the /learn primitive system.
 *
 * Three sizes scale linearly from a hero baseline (step=10):
 *   - small  (step=5)  — dense reference material, comparison rows
 *   - inline (step=7)  — DEFAULT, figures inside MDX prose
 *   - hero   (step=10) — the marquee diagram of a topic
 *
 * Don't override these inline. Add a new size or a new token here.
 */

export type LearnSize = 'small' | 'inline' | 'hero'

export interface LearnTokens {
  size: LearnSize
  step: number
  scale: number

  staffLineStroke: number
  staffLineColor: string

  noteheadFontSize: number
  noteheadHalfHeight: number
  noteheadFilledGlyph: string
  noteheadHalfGlyph: string
  noteheadWholeGlyph: string
  noteheadDy: number

  trebleClefFontSize: number
  bassClefFontSize: number
  trebleClefGlyph: string
  bassClefGlyph: string
  bassClefYOffset: number
  clefReserve: number

  stemStroke: number
  stemLength: number
  stemXOffset: number

  ledgerLineStroke: number
  ledgerHalfWidth: number

  accidentalFontSize: number
  accidentalKerning: number
  sharpGlyph: string
  flatGlyph: string
  naturalGlyph: string
  doubleSharpGlyph: string
  doubleFlatGlyph: string

  braceGlyph: string
  graceLineStroke: number

  keyboardWhiteKeyWidth: number
  keyboardWhiteKeyHeight: number
  keyboardBlackKeyWidth: number
  keyboardBlackKeyHeight: number
  keyboardKeyStroke: number
  keyboardWhiteKeyFill: string
  keyboardBlackKeyFill: string

  highlightFill: string
  highlightAccent: string
  highlightAccentSoft: string

  fontDisplay: string
  fontLabel: string
  fontMusic: string

  ink: string
  inkMuted: string
  inkSubtle: string
  bgPaper: string
  bgCream: string
  border: string

  captionFontSize: number
  labelFontSize: number
  smallLabelFontSize: number

  bracketTick: number
  annotationBuffer: number

  hoverTransition: string
  highlightDuration: number
}

export function tokensFor(size: LearnSize): LearnTokens {
  const step = size === 'small' ? 5 : size === 'hero' ? 10 : 6
  const scale = step / 10

  return {
    size,
    step,
    scale,

    staffLineStroke: Math.max(1.0, +(1.6 * scale).toFixed(2)),
    staffLineColor: '#0e0e0e',

    noteheadFontSize: Math.round(76 * scale),
    noteheadHalfHeight: Math.round(76 * scale * 0.34),
    noteheadFilledGlyph: '\uE0A4',
    noteheadHalfGlyph: '\uE0A3',
    noteheadWholeGlyph: '\uE0A2',
    noteheadDy: 0,

    trebleClefFontSize: Math.round(84 * scale),
    bassClefFontSize: Math.round(86 * scale),
    trebleClefGlyph: '\uE050',
    bassClefGlyph: '\uE062',
    bassClefYOffset: +(2 * scale).toFixed(1),
    clefReserve: Math.round(60 * scale),

    stemStroke: Math.max(1.2, +(2.5 * scale).toFixed(2)),
    stemLength: Math.round(64 * scale),
    stemXOffset: Math.round(10 * scale),

    ledgerLineStroke: Math.max(1.0, +(1.6 * scale).toFixed(2)),
    ledgerHalfWidth: Math.round(22 * scale),

    accidentalFontSize: Math.round(60 * scale),
    accidentalKerning: Math.round(26 * scale),
    sharpGlyph: '\uE262',
    flatGlyph: '\uE260',
    naturalGlyph: '\uE261',
    doubleSharpGlyph: '\uE263',
    doubleFlatGlyph: '\uE264',

    braceGlyph: '\uE000',
    graceLineStroke: Math.max(1.4, +(2.0 * scale).toFixed(2)),

    keyboardWhiteKeyWidth: Math.round(65 * scale),
    keyboardWhiteKeyHeight: Math.round(160 * scale),
    keyboardBlackKeyWidth: Math.round(38 * scale),
    keyboardBlackKeyHeight: Math.round(100 * scale),
    keyboardKeyStroke: 0.6,
    keyboardWhiteKeyFill: '#fafafa',
    keyboardBlackKeyFill: '#0e0e0e',

    highlightFill: '#FAECE7',
    highlightAccent: '#D85A30',
    highlightAccentSoft: '#F5C4B3',

    fontDisplay: 'ltc-bodoni-175, var(--font-cormorant), Georgia, serif',
    fontLabel: 'neuzeit-grotesk, var(--font-jost), system-ui, sans-serif',
    fontMusic: '"Bravura Learn", "Bravura", serif',

    ink: '#0e0e0e',
    inkMuted: '#5F5E5A',
    inkSubtle: '#7A7060',
    bgPaper: '#fafafa',
    bgCream: '#ECE3CC',
    border: '#EDE8DF',

    captionFontSize: size === 'small' ? 12 : size === 'hero' ? 15 : 13,
    labelFontSize: size === 'small' ? 10 : size === 'hero' ? 12 : 11,
    smallLabelFontSize: size === 'small' ? 9 : 11,

    bracketTick: 4,
    annotationBuffer: 6,

    hoverTransition: 'fill 150ms ease, opacity 150ms ease',
    highlightDuration: 600,
  }
}

export const lineY = (staffTop: number, lineFromTop: number, T: LearnTokens): number =>
  staffTop + lineFromTop * 2 * T.step

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import * as Tone from 'tone'

// ── Key Signature Data ─────────────────────────────────────────────────────
interface KeyInfo {
  name: string
  sharps: number
  flats: number
  relativeMinor: string
  parallelMinor: string
  sharpNames: string[]
  flatNames: string[]
}

const KEYS: KeyInfo[] = [
  { name: 'C',  sharps: 0, flats: 0, relativeMinor: 'A',  parallelMinor: 'C',  sharpNames: [], flatNames: [] },
  { name: 'G',  sharps: 1, flats: 0, relativeMinor: 'E',  parallelMinor: 'G',  sharpNames: ['F#'], flatNames: [] },
  { name: 'D',  sharps: 2, flats: 0, relativeMinor: 'B',  parallelMinor: 'D',  sharpNames: ['F#','C#'], flatNames: [] },
  { name: 'A',  sharps: 3, flats: 0, relativeMinor: 'F#', parallelMinor: 'A',  sharpNames: ['F#','C#','G#'], flatNames: [] },
  { name: 'E',  sharps: 4, flats: 0, relativeMinor: 'C#', parallelMinor: 'E',  sharpNames: ['F#','C#','G#','D#'], flatNames: [] },
  { name: 'B',  sharps: 5, flats: 0, relativeMinor: 'G#', parallelMinor: 'B',  sharpNames: ['F#','C#','G#','D#','A#'], flatNames: [] },
  { name: 'F#', sharps: 6, flats: 0, relativeMinor: 'D#', parallelMinor: 'F#', sharpNames: ['F#','C#','G#','D#','A#','E#'], flatNames: [] },
  { name: 'Gb', sharps: 0, flats: 6, relativeMinor: 'Eb', parallelMinor: 'Gb', sharpNames: [], flatNames: ['Bb','Eb','Ab','Db','Gb','Cb'] },
  { name: 'C#', sharps: 7, flats: 0, relativeMinor: 'A#', parallelMinor: 'C#', sharpNames: ['F#','C#','G#','D#','A#','E#','B#'], flatNames: [] },
  { name: 'F',  sharps: 0, flats: 1, relativeMinor: 'D',  parallelMinor: 'F',  sharpNames: [], flatNames: ['Bb'] },
  { name: 'Bb', sharps: 0, flats: 2, relativeMinor: 'G',  parallelMinor: 'Bb', sharpNames: [], flatNames: ['Bb','Eb'] },
  { name: 'Eb', sharps: 0, flats: 3, relativeMinor: 'C',  parallelMinor: 'Eb', sharpNames: [], flatNames: ['Bb','Eb','Ab'] },
  { name: 'Ab', sharps: 0, flats: 4, relativeMinor: 'F',  parallelMinor: 'Ab', sharpNames: [], flatNames: ['Bb','Eb','Ab','Db'] },
  { name: 'Db', sharps: 0, flats: 5, relativeMinor: 'Bb', parallelMinor: 'Db', sharpNames: [], flatNames: ['Bb','Eb','Ab','Db','Gb'] },
  { name: 'Gb', sharps: 0, flats: 6, relativeMinor: 'Eb', parallelMinor: 'Gb', sharpNames: [], flatNames: ['Bb','Eb','Ab','Db','Gb','Cb'] },
  { name: 'Cb', sharps: 0, flats: 7, relativeMinor: 'Ab', parallelMinor: 'Cb', sharpNames: [], flatNames: ['Bb','Eb','Ab','Db','Gb','Cb','Fb'] },
]

// Sharp positions on treble staff (pos 0 = top line F5)
// Order: F5 C5 G5 D5 A4 E5 B4 (standard sharp order positions)
const SHARP_POSITIONS_TREBLE = [0, 3, -1, 2, 5, 1, 4]   // F# C# G# D# A# E# B#
const FLAT_POSITIONS_TREBLE  = [4, 1, 5, 2, 6, 3, 7]    // Bb Eb Ab Db Gb Cb Fb
const SHARP_POSITIONS_BASS   = [2, 5, 1, 4, 7, 3, 6]    // F# C# G# D# A# E# B#
const FLAT_POSITIONS_BASS    = [6, 3, 7, 4, 8, 5, 9]    // Bb Eb Ab Db Gb Cb Fb

// Circle of fifths order (clockwise from C)
const CIRCLE_SHARP = ['C','G','D','A','E','B','F#','C#']
const CIRCLE_FLAT  = ['C','F','Bb','Eb','Ab','Db','Gb','Cb']

// ── Staff rendering ────────────────────────────────────────────────────────
const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface KeyStaffProps {
  keyInfo: KeyInfo
  clef: 'treble' | 'bass'
  width?: number
}

function KeyStaff({ keyInfo, clef, width = 300 }: KeyStaffProps) {
  const step = 6
  const staffTop = 30
  const staffLeft = 16
  const staffWidth = width - 32
  const H = 125
  const accStartX = staffLeft + 54

  const sharpPos = clef === 'treble' ? SHARP_POSITIONS_TREBLE : SHARP_POSITIONS_BASS
  const flatPos  = clef === 'treble' ? FLAT_POSITIONS_TREBLE  : FLAT_POSITIONS_BASS

  const staffLines = [0,2,4,6,8].map(p => (
    <line key={p} x1={staffLeft} y1={staffTop + p*step}
      x2={staffLeft + staffWidth} y2={staffTop + p*step}
      stroke="#1A1A18" strokeWidth="1.2" />
  ))

  const clefEl = clef === 'treble'
    ? <text x={staffLeft} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
    : <text x={staffLeft + 2} y={staffTop + 13} fontSize="52" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄢</text>

  const accidentals = keyInfo.sharps > 0
    ? keyInfo.sharpNames.map((name, i) => {
        const pos = sharpPos[i]
        const y = staffTop + pos * step
        return (
          <text key={name} x={accStartX + i * 13} y={y}
            fontSize="40" fontFamily="Bravura, serif" fill="#1A1A18"
            dominantBaseline="central" textAnchor="middle">
            {String.fromCodePoint(0xE262)}
          </text>
        )
      })
    : keyInfo.flats > 0
    ? keyInfo.flatNames.map((name, i) => {
        const pos = flatPos[i]
        const y = staffTop + pos * step
        return (
          <text key={name} x={accStartX + i * 13} y={y}
            fontSize="40" fontFamily="Bravura, serif" fill="#1A1A18"
            dominantBaseline="central" textAnchor="middle">
            {String.fromCodePoint(0xE260)}
          </text>
        )
      })
    : []

  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      {staffLines}
      {clefEl}
      {accidentals}
    </svg>
  )
}

// ── Circle of Fifths (vector viewBox 360×360; size from CSS frame) ───────────
const TALLY_LABELS = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6', '5♭', '4♭', '3♭', '2♭', '1♭']
const MONO = 'var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, monospace'

function CircleOfFifths({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const [hoverPair, setHoverPair] = useState<number | null>(null)
  const size = 360
  const cx = size / 2, cy = size / 2
  const outerR = 155, innerR = 100, minorR = 65
  const outerTextR = 128, innerTextR = 80
  const rimR = outerR + 14

  const r = (v: number) => Math.round(v * 100) / 100

  const keys12: { major: string, minor: string, alt?: string, altMinor?: string }[] = [
    { major: 'C',  minor: 'Am'  },
    { major: 'G',  minor: 'Em'  },
    { major: 'D',  minor: 'Bm'  },
    { major: 'A',  minor: 'F#m' },
    { major: 'E',  minor: 'C#m' },
    { major: 'B',  minor: 'G#m' },
    { major: 'F#', minor: 'D#m', alt: 'Gb', altMinor: 'Ebm' },
    { major: 'Db', minor: 'Bbm' },
    { major: 'Ab', minor: 'Fm'  },
    { major: 'Eb', minor: 'Cm'  },
    { major: 'Bb', minor: 'Gm'  },
    { major: 'F',  minor: 'Dm'  },
  ]

  function sideFor(i: number): 'sharp' | 'flat' | 'neutral' {
    if (i === 0 || i === 6) return 'neutral'
    return i <= 5 ? 'sharp' : 'flat'
  }

  function wedgePath(r1: number, r2: number, i: number) {
    const a1 = ((i - 0.5) * 30 - 90) * Math.PI / 180
    const a2 = ((i + 0.5) * 30 - 90) * Math.PI / 180
    const x1o = r(cx + r2 * Math.cos(a1)), y1o = r(cy + r2 * Math.sin(a1))
    const x2o = r(cx + r2 * Math.cos(a2)), y2o = r(cy + r2 * Math.sin(a2))
    const x1i = r(cx + r1 * Math.cos(a1)), y1i = r(cy + r1 * Math.sin(a1))
    const x2i = r(cx + r1 * Math.cos(a2)), y2i = r(cy + r1 * Math.sin(a2))
    return `M ${x1i} ${y1i} L ${x1o} ${y1o} A ${r2} ${r2} 0 0 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${r1} ${r1} 0 0 0 ${x1i} ${y1i} Z`
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      className="nl-key-sig-cof-svg"
      aria-label="Circle of fifths — click a key"
    >
      <defs>
        <filter id="nl-cof-pair-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur" />
          <feOffset in="blur" dx="0" dy="4" result="off" />
          <feFlood floodColor="#1a1a18" floodOpacity="0.22" result="fl" />
          <feComposite in="fl" in2="off" operator="in" result="sh" />
          <feMerge>
            <feMergeNode in="sh" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Center disc under wedges (fills the hub) */}
      <circle cx={cx} cy={cy} r={minorR - 2} fill="white" stroke="#D9CFAE" strokeWidth="1" />

      {keys12.map((k, i) => {
        const pairSelected = selected === k.major || (k.alt ? selected === k.alt : false)
        const majorSelected = selected === k.major
        const altSelected = !!(k.alt && selected === k.alt)
        const isHover = hoverPair === i
        const side = sideFor(i)

        const majorRestFill = side === 'neutral'
          ? '#F2EDDF'
          : side === 'sharp'
            ? 'rgba(160, 56, 28, 0.06)'
            : 'rgba(45, 90, 62, 0.06)'
        const minorRestFill = side === 'neutral'
          ? '#EDE8DF'
          : side === 'sharp'
            ? 'rgba(160, 56, 28, 0.04)'
            : 'rgba(45, 90, 62, 0.04)'

        const innerFill = pairSelected
          ? 'rgba(160, 56, 28, 0.65)'
          : isHover
            ? 'rgba(160, 56, 28, 0.14)'
            : minorRestFill
        const outerFill = majorSelected || altSelected
          ? '#a0381c'
          : isHover
            ? 'rgba(160, 56, 28, 0.18)'
            : majorRestFill

        const displayMinor = altSelected ? k.altMinor! : k.minor
        const angle = (i * 30 - 90) * Math.PI / 180
        const mtx = r(cx + innerTextR * Math.cos(angle))
        const mty = r(cy + innerTextR * Math.sin(angle))
        const otx = r(cx + outerTextR * Math.cos(angle))
        const oty = r(cy + outerTextR * Math.sin(angle))
        const rtx = r(cx + rimR * Math.cos(angle))
        const rty = r(cy + rimR * Math.sin(angle))

        const minorTextFill = pairSelected ? '#f0e7d0' : '#7A7060'
        const majorTextFill = (majorSelected || altSelected) ? '#f0e7d0' : '#1A1A18'

        return (
          <g
            key={k.major}
            className={'nl-key-sig-cof-pair' + (isHover ? ' nl-key-sig-cof-pair--hover' : '')}
            style={{
              cursor: 'pointer',
              filter: isHover ? 'url(#nl-cof-pair-glow)' : 'none',
            }}
            onMouseEnter={() => setHoverPair(i)}
            onMouseLeave={() => setHoverPair(null)}
          >
            <path
              d={wedgePath(minorR, innerR, i)}
              fill={innerFill}
              stroke="white"
              strokeWidth="1.5"
              onClick={() => onSelect(k.major)}
            />
            <path
              d={wedgePath(innerR, outerR, i)}
              fill={outerFill}
              stroke="white"
              strokeWidth="2"
              onClick={() => onSelect(altSelected ? k.alt! : k.major)}
            />
            <text
              x={mtx}
              y={mty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11.5"
              fontFamily={F}
              fill={minorTextFill}
              fontWeight="500"
              style={{ letterSpacing: '0.3px' }}
              onClick={() => onSelect(k.major)}
            >
              {displayMinor}
            </text>
            {k.alt ? (
              <>
                <text
                  x={otx}
                  y={oty - 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontFamily={SERIF}
                  fill={majorTextFill}
                  fontWeight="500"
                  onClick={() => onSelect(k.major)}
                >
                  F#
                </text>
                <line
                  x1={otx - 8}
                  y1={oty}
                  x2={otx + 8}
                  y2={oty}
                  stroke={majorSelected || altSelected ? 'rgba(240, 231, 208, 0.4)' : '#D9CFAE'}
                  strokeWidth="0.5"
                />
                <text
                  x={otx}
                  y={oty + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontFamily={SERIF}
                  fill={majorTextFill}
                  fontWeight="500"
                  onClick={() => onSelect(k.alt!)}
                >
                  Gb
                </text>
              </>
            ) : (
              <text
                x={otx}
                y={oty}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontFamily={SERIF}
                fill={majorTextFill}
                fontWeight="500"
                onClick={() => onSelect(k.major)}
              >
                {k.major}
              </text>
            )}
            <text
              x={rtx}
              y={rty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9.5"
              fontFamily={MONO}
              fill={(majorSelected || altSelected) ? '#a0381c' : '#8a7560'}
              fontWeight={(majorSelected || altSelected) ? '700' : '500'}
              style={{ pointerEvents: 'none' }}
            >
              {TALLY_LABELS[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}


// ── Historical Affekt Data ─────────────────────────────────────────────────
interface AffektEntry { key: string; schubart?: string; galeazzi?: string }

const AFFEKT: AffektEntry[] = [
  { key: 'C',   schubart: "Utterly pure. Its character connotes innocence, simplicity, naivete, the language of children.", galeazzi: "A grandiose, military key, apt for expressing great happenings, serious, majestic and sonorous." },
  { key: 'Cm',  schubart: "At once a declaration of love and the lament of ill-fated love — all the languishing, longing and sighing of a soul drunken with love.", galeazzi: "A tragic key, apt for expressing great misfortunes, the deaths of heroes and great actions that are mournful and lamentable." },
  { key: 'D',   schubart: "The key of triumph, of hallelujahs, of the battle cry and the shout of victory. Introductory symphonies, marches, festive songs and jubilant choruses are set in this key.", galeazzi: "The most lively and gay key that music possesses. Sonorous to the highest degree, apt for expressing festivities, weddings, rejoicing, merriment." },
  { key: 'Dm',  schubart: "Melancholy womanliness, bitterness and bad temper.", galeazzi: "Totally opposite to D major, being extremely melancholic and somber; of little use except in modulations." },
  { key: 'Eb',  schubart: "The key of love, devoutness, of intimate dialogue with the divine; its three flats represent the Holy Trinity.", galeazzi: "A heroic key, majestic in the extreme, solemn and serious: in all these qualities it is superior even to C major." },
  { key: 'Ebm', schubart: "Anxiety born of the very deepest spiritual distress, increasing desperation, blackest melancholy. Every imaginable fear, every hesitation of the shuddering heart, breathes out of this most terrible of keys.", galeazzi: "Little used on account of its difficult execution; it is extremely melancholic and induces sleep." },
  { key: 'E',   schubart: "A shout of jubilation, laughing joy, but not quite complete fulfillment.", galeazzi: "A rather shrill key, piercing and child-like, trifling and somewhat harsh." },
  { key: 'Em',  schubart: "Naive, feminine, innocent declarations of love, lament without complaint, sighs accompanied by a few tears. Expresses a hope of happiness soon to be fulfilled.", galeazzi: "Well nigh banned from music in good taste, except for modulations." },
  { key: 'F',   schubart: "Amiable and calm.", galeazzi: "Majestic, but less so than either E flat or C. It too is piercing, but not shrill." },
  { key: 'Fm',  schubart: "Deepest melancholy, funereal lament, groans of misery and longing for the grave.", galeazzi: "Most apt for expressing tears, pain, anxiety, anguish, violent transports, agitation." },
  { key: 'F#',  schubart: "Triumph over obstacles, a deep breath at the top of the hill, the echoes of a soul that has struggled long and hard and at last gained the victory." },
  { key: 'Gb',  schubart: "Triumph over obstacles, a deep breath at the top of the hill, the echoes of a soul that has struggled long and hard and at last gained the victory." },
  { key: 'F#m', schubart: "A dark key: it tears and pulls at the passions like a vicious dog at one's clothing. Resentment and displeasure is its language." },
  { key: 'G',   schubart: "Suits all things rural, idyllic and pastoral, any quiet, contented passion, every tender word of thanks for true friendship.", galeazzi: "An innocent key, simple, cold and indifferent, of little effect." },
  { key: 'Gm',  schubart: "Displeasure, uneasiness, worry over an unsuccessful plan, sullen champing at the bit — resentment and listlessness.", galeazzi: "Has the same character as C minor, but apt for restlessness, desperation, agitation." },
  { key: 'Ab',  schubart: "The funereal key. Death, the tomb, decay, judgment and eternal life are all encompassed in this key.", galeazzi: "A dark, deep and profound key, apt for expressing horror, the silence of the night, quietness, fear, terror." },
  { key: 'G#m', schubart: "Heavy affliction, a heart nearly overwhelmed by grief, lamentation which sighs in the double sharp; a hard fight." },
  { key: 'A',   schubart: "Declarations of innocent love, contentment; the hope of a reunion when lovers part; youthful happiness and confidence in God.", galeazzi: "Highly euphonious, expressive, passionate, playful, smiling and lively." },
  { key: 'Am',  schubart: "Gentle womanliness and a mild character.", galeazzi: "Deeply lugubrious and sad. Little used, except to express slaughters, massacres and funeral laments." },
  { key: 'Bb',  schubart: "Happy love, good conscience, hope and longing for a better world.", galeazzi: "A tender, soft, sweet, effeminate key, apt for expressing love's transports, charms and graces." },
  { key: 'Bbm', schubart: "An oddity, mostly clothed in the garment of the night. Bad-tempered. Mockery of God and the world, displeasure with itself and everything else, preludes to suicide echo in this key.", galeazzi: "Little used because of its too great difficulty." },
  { key: 'B',   schubart: "Strong color, announcing tempestuous passions. Anger, fury, jealousy, madness, desperation, every burden of the heart lies in its domain.", galeazzi: "A harsh key, shriller than E, apt for expressing the cries of the desperate, shouts, roars and the like." },
  { key: 'Bm',  schubart: "The key of patience, of quiet expectation of one's fate and submission to the divine order. The lament is so gentle and never breaks out in grumbling or whimpering.", galeazzi: "Proscribed from music in good taste." },
  { key: 'C#',  schubart: undefined, galeazzi: undefined },
  { key: 'C#m', schubart: "A penitential lament, intimate dialogue with God, a friend or one's life-long companion; sighs of unrequited friendship and love." },
  { key: 'Db',  schubart: "A key of yearning which is resolved in sorrow or ecstasy. This key cannot laugh, but it smiles; it cannot weep, but it can at least make the face of one who might cry." },
]

function getAffekt(keyName: string, isMinor: boolean): AffektEntry | undefined {
  const k = isMinor ? keyName + 'm' : keyName
  return AFFEKT.find(a => a.key === k)
}

// ── Study mode constants ───────────────────────────────────────────────────
type Mode = 'signature' | 'affekt' | 'study'
type Drill = 'recognize' | 'recall' | 'order'
type Filter = 'majors' | 'minors' | 'both'

const STORAGE_MODE = 'notelab-key-sig-mode'
const STORAGE_STUDY = 'notelab-key-sig-study'

const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']
const FLAT_ORDER  = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']

interface StudyKey {
  name: string
  shortName: string
  isMajor: boolean
  accidentalCount: number
  side: 'sharps' | 'flats' | 'natural'
  signatureSource: string // major key name in KEYS that defines this signature
  wedgeKey: string        // string returned by Circle onSelect when this key is the answer
}

const STUDY_KEYS: StudyKey[] = [
  // Majors
  { name: 'C Major',  shortName: 'C',  isMajor: true,  accidentalCount: 0, side: 'natural', signatureSource: 'C',  wedgeKey: 'C'  },
  { name: 'G Major',  shortName: 'G',  isMajor: true,  accidentalCount: 1, side: 'sharps',  signatureSource: 'G',  wedgeKey: 'G'  },
  { name: 'D Major',  shortName: 'D',  isMajor: true,  accidentalCount: 2, side: 'sharps',  signatureSource: 'D',  wedgeKey: 'D'  },
  { name: 'A Major',  shortName: 'A',  isMajor: true,  accidentalCount: 3, side: 'sharps',  signatureSource: 'A',  wedgeKey: 'A'  },
  { name: 'E Major',  shortName: 'E',  isMajor: true,  accidentalCount: 4, side: 'sharps',  signatureSource: 'E',  wedgeKey: 'E'  },
  { name: 'B Major',  shortName: 'B',  isMajor: true,  accidentalCount: 5, side: 'sharps',  signatureSource: 'B',  wedgeKey: 'B'  },
  { name: 'F# Major', shortName: 'F#', isMajor: true,  accidentalCount: 6, side: 'sharps',  signatureSource: 'F#', wedgeKey: 'F#' },
  { name: 'Gb Major', shortName: 'Gb', isMajor: true,  accidentalCount: 6, side: 'flats',   signatureSource: 'Gb', wedgeKey: 'Gb' },
  { name: 'Db Major', shortName: 'Db', isMajor: true,  accidentalCount: 5, side: 'flats',   signatureSource: 'Db', wedgeKey: 'Db' },
  { name: 'Ab Major', shortName: 'Ab', isMajor: true,  accidentalCount: 4, side: 'flats',   signatureSource: 'Ab', wedgeKey: 'Ab' },
  { name: 'Eb Major', shortName: 'Eb', isMajor: true,  accidentalCount: 3, side: 'flats',   signatureSource: 'Eb', wedgeKey: 'Eb' },
  { name: 'Bb Major', shortName: 'Bb', isMajor: true,  accidentalCount: 2, side: 'flats',   signatureSource: 'Bb', wedgeKey: 'Bb' },
  { name: 'F Major',  shortName: 'F',  isMajor: true,  accidentalCount: 1, side: 'flats',   signatureSource: 'F',  wedgeKey: 'F'  },
  // Minors (the relative minor of each major). When the circle wedge is clicked,
  // it returns the major's name — minors are answered indirectly via that mapping.
  { name: 'A minor',  shortName: 'Am',  isMajor: false, accidentalCount: 0, side: 'natural', signatureSource: 'C',  wedgeKey: 'C'  },
  { name: 'E minor',  shortName: 'Em',  isMajor: false, accidentalCount: 1, side: 'sharps',  signatureSource: 'G',  wedgeKey: 'G'  },
  { name: 'B minor',  shortName: 'Bm',  isMajor: false, accidentalCount: 2, side: 'sharps',  signatureSource: 'D',  wedgeKey: 'D'  },
  { name: 'F# minor', shortName: 'F#m', isMajor: false, accidentalCount: 3, side: 'sharps',  signatureSource: 'A',  wedgeKey: 'A'  },
  { name: 'C# minor', shortName: 'C#m', isMajor: false, accidentalCount: 4, side: 'sharps',  signatureSource: 'E',  wedgeKey: 'E'  },
  { name: 'G# minor', shortName: 'G#m', isMajor: false, accidentalCount: 5, side: 'sharps',  signatureSource: 'B',  wedgeKey: 'B'  },
  { name: 'D# minor', shortName: 'D#m', isMajor: false, accidentalCount: 6, side: 'sharps',  signatureSource: 'F#', wedgeKey: 'F#' },
  { name: 'Bb minor', shortName: 'Bbm', isMajor: false, accidentalCount: 5, side: 'flats',   signatureSource: 'Db', wedgeKey: 'Db' },
  { name: 'F minor',  shortName: 'Fm',  isMajor: false, accidentalCount: 4, side: 'flats',   signatureSource: 'Ab', wedgeKey: 'Ab' },
  { name: 'C minor',  shortName: 'Cm',  isMajor: false, accidentalCount: 3, side: 'flats',   signatureSource: 'Eb', wedgeKey: 'Eb' },
  { name: 'G minor',  shortName: 'Gm',  isMajor: false, accidentalCount: 2, side: 'flats',   signatureSource: 'Bb', wedgeKey: 'Bb' },
  { name: 'D minor',  shortName: 'Dm',  isMajor: false, accidentalCount: 1, side: 'flats',   signatureSource: 'F',  wedgeKey: 'F'  },
]

interface RecognizeQuestion {
  kind: 'recognize'
  prompt: string
  target: StudyKey
  options: StudyKey[]   // 4 options
  correctIndex: number  // index into options
}

interface RecallQuestion {
  kind: 'recall'
  prompt: string
  target: StudyKey
  options: { label: string; count: number; side: 'sharps' | 'flats' | 'natural' }[]
  correctIndex: number
}

interface OrderQuestion {
  kind: 'order'
  prompt: string
  variant: 'sharp' | 'flat'
  position: number     // 1-based
  options: string[]    // note names like 'F#'
  correctIndex: number
}

type StudyQuestion = RecognizeQuestion | RecallQuestion | OrderQuestion

interface BestRecord {
  score: number
  of: number
  date: string
}

type Bests = Record<string, BestRecord>

function pickFilteredKeys(filter: Filter): StudyKey[] {
  if (filter === 'majors') return STUDY_KEYS.filter(k => k.isMajor)
  if (filter === 'minors') return STUDY_KEYS.filter(k => !k.isMajor)
  return STUDY_KEYS
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function genRecognize(filter: Filter, lastShortName?: string): RecognizeQuestion {
  const pool = pickFilteredKeys(filter).filter(k => k.shortName !== lastShortName)
  const target = pool[Math.floor(Math.random() * pool.length)]
  const sameTypePool = STUDY_KEYS.filter(k =>
    k.isMajor === target.isMajor && k.shortName !== target.shortName
  )
  // Sort distractor candidates by accidental-count proximity (close = more plausible)
  const ranked = sameTypePool
    .map(k => ({ k, dist: Math.abs(k.accidentalCount - target.accidentalCount) + (k.side !== target.side ? 0.5 : 0) }))
    .sort((a, b) => a.dist - b.dist)
  // Take top 6 closest, shuffle, pick 3
  const distractors = shuffle(ranked.slice(0, 6).map(r => r.k)).slice(0, 3)
  const options = shuffle([target, ...distractors])
  return {
    kind: 'recognize',
    prompt: 'Which key has this signature?',
    target,
    options,
    correctIndex: options.findIndex(o => o.shortName === target.shortName),
  }
}

function genRecall(filter: Filter, lastShortName?: string): RecallQuestion {
  const pool = pickFilteredKeys(filter).filter(k => k.shortName !== lastShortName)
  const target = pool[Math.floor(Math.random() * pool.length)]
  const correctLabel = target.accidentalCount === 0
    ? 'No sharps or flats'
    : `${target.accidentalCount} ${target.side === 'sharps' ? 'sharp' : 'flat'}${target.accidentalCount > 1 ? 's' : ''}`
  // Build 3 plausible distractor counts (off-by-1 on each side, plus a different-side same-count)
  const candidates: { label: string; count: number; side: 'sharps' | 'flats' | 'natural' }[] = []
  for (const delta of [-2, -1, 1, 2]) {
    const c = target.accidentalCount + delta
    if (c >= 1 && c <= 7 && target.side !== 'natural') {
      candidates.push({
        label: `${c} ${target.side === 'sharps' ? 'sharp' : 'flat'}${c > 1 ? 's' : ''}`,
        count: c,
        side: target.side,
      })
    }
  }
  // Opposite-side same-count for variety
  if (target.side !== 'natural') {
    const other = target.side === 'sharps' ? 'flats' : 'sharps'
    candidates.push({
      label: `${target.accidentalCount} ${other === 'sharps' ? 'sharp' : 'flat'}${target.accidentalCount > 1 ? 's' : ''}`,
      count: target.accidentalCount,
      side: other,
    })
  }
  // "No sharps or flats" as a perpetual distractor when target has any accidentals
  if (target.accidentalCount > 0) {
    candidates.push({ label: 'No sharps or flats', count: 0, side: 'natural' })
  } else {
    // target is C/Am — distractors are 1/2/3 sharps or flats
    candidates.push({ label: '1 sharp',  count: 1, side: 'sharps' })
    candidates.push({ label: '1 flat',   count: 1, side: 'flats'  })
    candidates.push({ label: '2 sharps', count: 2, side: 'sharps' })
  }
  const distractors = shuffle(candidates).slice(0, 3)
  const correct = { label: correctLabel, count: target.accidentalCount, side: target.side }
  const options = shuffle([correct, ...distractors])
  return {
    kind: 'recall',
    prompt: `What is the key signature of ${target.name}?`,
    target,
    options,
    correctIndex: options.findIndex(o => o.count === correct.count && o.side === correct.side),
  }
}

function genOrder(): OrderQuestion {
  const variant: 'sharp' | 'flat' = Math.random() < 0.5 ? 'sharp' : 'flat'
  const order = variant === 'sharp' ? SHARP_ORDER : FLAT_ORDER
  const position = 1 + Math.floor(Math.random() * 7)
  const correctNote = order[position - 1]
  const pool = order.filter(n => n !== correctNote)
  const distractors = shuffle(pool).slice(0, 3)
  const options = shuffle([correctNote, ...distractors])
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][position - 1]
  return {
    kind: 'order',
    prompt: `What is the ${ordinal} ${variant === 'sharp' ? 'sharp' : 'flat'} in the order of ${variant === 'sharp' ? 'sharps' : 'flats'}?`,
    variant,
    position,
    options,
    correctIndex: options.findIndex(o => o === correctNote),
  }
}

function generateQuestion(drill: Drill, filter: Filter, last?: StudyQuestion): StudyQuestion {
  if (drill === 'recognize') {
    const lastShort = last && last.kind === 'recognize' ? last.target.shortName : undefined
    return genRecognize(filter, lastShort)
  }
  if (drill === 'recall') {
    const lastShort = last && last.kind === 'recall' ? last.target.shortName : undefined
    return genRecall(filter, lastShort)
  }
  return genOrder()
}

function bestKeyFor(drill: Drill, filter: Filter): string {
  if (drill === 'order') return `order-both` // order ignores filter
  return `${drill}-${filter}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Piano with highlighted notes ───────────────────────────────────────────
const NOTE_NAMES_S = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const NOTE_NAMES_F = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

function buildScale(root: string, pattern: number[]): Set<string> {
  const isFlat = ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(root)
  const names = isFlat ? NOTE_NAMES_F : NOTE_NAMES_S
  const rootPc = NOTE_NAMES_S.indexOf(root) !== -1 ? NOTE_NAMES_S.indexOf(root) : NOTE_NAMES_F.indexOf(root)
  const pcs = new Set<string>()
  let pc = rootPc
  pcs.add(names[pc])
  for (const s of pattern) {
    pc = (pc + s) % 12
    pcs.add(names[pc])
  }
  return pcs
}

const MAJOR_PATTERN = [2,2,1,2,2,2,1]

function KeyPiano({ keyInfo, showScale, highlightOneOctave, isRelativeMinor, relativeMinorName }: { keyInfo: KeyInfo, showScale: boolean, highlightOneOctave?: boolean, isRelativeMinor?: boolean, relativeMinorName?: string }) {
  const pattern = isRelativeMinor ? [2,1,2,2,1,2,2] : MAJOR_PATTERN
  const scalePcs = showScale ? buildScale(keyInfo.name, pattern) : new Set<string>()

  // Build exact midi set for one octave starting from root in oct 4
  const exactMidis = new Set<number>()
  if (showScale) {
    const isFlat = ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(keyInfo.name)
    const names = isFlat ? NOTE_NAMES_F : NOTE_NAMES_S
    const activeName = (isRelativeMinor && relativeMinorName) ? relativeMinorName : keyInfo.name
    const rootPc = NOTE_NAMES_S.indexOf(activeName) !== -1
      ? NOTE_NAMES_S.indexOf(activeName)
      : NOTE_NAMES_F.indexOf(activeName)
    // Place root so scale fits nicely: Ab-B start at oct3, C-G start at oct4
    const highRoots = isRelativeMinor ? [5,6,7,8,9,10,11] : [8,9,10,11]
    let startOct = highRoots.includes(rootPc) ? 3 : 4
    let startMidi = (startOct + 1) * 12 + rootPc
    exactMidis.add(startMidi)
    let m = startMidi
    for (const s of pattern) {
      m += s
      exactMidis.add(m)
    }
  }
  
  // Accidentals in this key
  const accPcs = new Set([...keyInfo.sharpNames, ...keyInfo.flatNames].map(n => n.replace('#','').replace('b','') + (n.includes('#') ? '#' : 'b')))
  
  const WHITE = ['C','D','E','F','G','A','B']
  const BLACK: Record<string, number> = { 'C#':0.6,'D#':1.6,'F#':3.6,'G#':4.6,'A#':5.6,'Db':0.6,'Eb':1.6,'Gb':3.6,'Ab':4.6,'Bb':5.6 }
  const KW = 26, KH = 88, BW = 16, BH = 54
  
  const octaves = [3,4,5]
  const whiteKeys: {note: string, oct: number, wi: number}[] = []
  let wi = 0
  for (const oct of octaves) {
    for (const n of WHITE) {
      whiteKeys.push({ note: n, oct, wi: wi++ })
    }
  }
  // Add C6
  whiteKeys.push({ note: 'C', oct: 6, wi: wi++ })
  
  const totalW = whiteKeys.length * KW
  
  function isInKey(noteName: string): boolean {
    if (!showScale) return false
    // Check if natural note name matches scale
    const isFlat = ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(keyInfo.name)
    const names = isFlat ? NOTE_NAMES_F : NOTE_NAMES_S
    return scalePcs.has(noteName) || scalePcs.has(names[NOTE_NAMES_S.indexOf(noteName)] ?? '')
  }

  function isAccidental(noteName: string): boolean {
    return keyInfo.sharpNames.some(s => s[0] === noteName) || 
           keyInfo.flatNames.some(f => f[0] === noteName)
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <div style={{ position: 'relative', width: totalW, height: KH }}>
        {whiteKeys.map((k, i) => {
          const noteMidi = (k.oct + 1) * 12 + ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(k.note)
          const inKey = showScale && exactMidis.has(noteMidi)
          const isAcc = showScale && !isRelativeMinor && isAccidental(k.note) && exactMidis.has(noteMidi)
          return (
            <div key={k.note+k.oct} style={{
              position: 'absolute', left: i * KW, top: 0,
              width: KW - 1, height: KH,
              background: inKey ? '#FAEEDA' : 'white',
              border: '1px solid #D9CFAE',
              borderRadius: '0 0 6px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
              paddingBottom: '4px',
            }}>
              {k.note === 'C' && <span style={{ fontSize: '8px', color: '#D9CFAE', fontFamily: F }}>C{k.oct}</span>}
              {isAcc && <span style={{ fontSize: '8px', color: '#B5402A', fontFamily: F }}>
                {keyInfo.sharpNames.find(s => s[0] === k.note) ?? keyInfo.flatNames.find(f => f[0] === k.note)}
              </span>}
            </div>
          )
        })}
        {/* Black keys */}
        {octaves.map((oct, oi) =>
          Object.entries(BLACK).slice(0,5).map(([noteFull, offset]) => {
            const noteBase = noteFull[0]
            const midi = (oi * 7 + WHITE.indexOf(noteBase)) * KW + KW - BW/2
            const isFlat = noteFull.includes('b')
            const displayName = isFlat ? noteFull : noteFull
            const allNoteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
            const sharpNames12 = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
            const flatNames12 = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
            const bpc = sharpNames12.indexOf(noteFull) >= 0 ? sharpNames12.indexOf(noteFull) : flatNames12.indexOf(noteFull)
            const blackMidi = (oct + 1) * 12 + bpc
            const inKey = showScale && exactMidis.has(blackMidi)
            return (
              <div key={noteFull+oct} style={{
                position: 'absolute',
                left: oi * 7 * KW + (WHITE.indexOf(noteBase) + 1) * KW - BW/2,
                top: 0, width: BW, height: BH,
                background: inKey ? '#B5402A' : '#1A1A18',
                borderRadius: '0 0 4px 4px',
                zIndex: 2,
              }} />
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function KeySignatures() {
  const [selectedKey, setSelectedKey] = useState('C')
  const [clef, setClef] = useState<'treble' | 'bass' | 'both'>('both')
  const [showScale, setShowScale] = useState(true)
  const [mode, setMode] = useState<Mode>('signature')
  const [showRelativeOnPiano, setShowRelativeOnPiano] = useState(false)
  const samplerRef = useRef<Tone.Sampler | null>(null)

  // ── Study mode state ────────────────────────────────────────────────────
  const [drill, setDrill] = useState<Drill>('recognize')
  const [filter, setFilter] = useState<Filter>('both')
  const [question, setQuestion] = useState<StudyQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [bests, setBests] = useState<Bests>({})
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const SESSION_LENGTH = 10

  // ── localStorage load (mount only) ──────────────────────────────────────
  useEffect(() => {
    try {
      const rawMode = localStorage.getItem(STORAGE_MODE)
      if (rawMode) {
        const parsed = JSON.parse(rawMode) as { mode?: Mode }
        if (parsed.mode === 'signature' || parsed.mode === 'affekt' || parsed.mode === 'study') {
          setMode(parsed.mode)
        }
      }
      const rawStudy = localStorage.getItem(STORAGE_STUDY)
      if (rawStudy) {
        const parsed = JSON.parse(rawStudy) as { lastDrill?: Drill; lastFilter?: Filter; bests?: Bests }
        if (parsed.lastDrill) setDrill(parsed.lastDrill)
        if (parsed.lastFilter) setFilter(parsed.lastFilter)
        if (parsed.bests) setBests(parsed.bests)
      }
    } catch {
      // ignore corrupt state
    }
  }, [])

  // ── Persist mode + drill/filter selections ──────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE, JSON.stringify({ mode }))
    } catch {}
  }, [mode])

  const persistStudy = useCallback((patch: Partial<{ lastDrill: Drill; lastFilter: Filter; bests: Bests }>) => {
    try {
      const current = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_STUDY)
          if (raw) return JSON.parse(raw) as { lastDrill?: Drill; lastFilter?: Filter; bests?: Bests }
        } catch {}
        return {}
      })()
      const next = { ...current, ...patch }
      localStorage.setItem(STORAGE_STUDY, JSON.stringify(next))
    } catch {}
  }, [])

  // ── Session lifecycle ───────────────────────────────────────────────────
  const startNewSession = useCallback((d: Drill = drill, f: Filter = filter) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    setQuestion(generateQuestion(d, f))
    setQuestionIndex(0)
    setScore(0)
    setStreak(0)
    setFeedback('idle')
    setSelectedAnswer(null)
    setSessionComplete(false)
  }, [drill, filter])

  useEffect(() => {
    if (mode !== 'study') return
    if (question === null && !sessionComplete) {
      startNewSession(drill, filter)
    }
  }, [mode, question, sessionComplete, drill, filter, startNewSession])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [])

  function handleDrillChange(d: Drill) {
    setDrill(d)
    persistStudy({ lastDrill: d })
    startNewSession(d, filter)
  }

  function handleFilterChange(f: Filter) {
    setFilter(f)
    persistStudy({ lastFilter: f })
    startNewSession(drill, f)
  }

  function recordBest(finalScore: number) {
    const key = bestKeyFor(drill, filter)
    const prev = bests[key]
    if (!prev || finalScore > prev.score) {
      const next = { ...bests, [key]: { score: finalScore, of: SESSION_LENGTH, date: todayISO() } }
      setBests(next)
      persistStudy({ bests: next })
    }
  }

  function advanceQuestion(currentScore: number, currentStreak: number) {
    const nextIndex = questionIndex + 1
    if (nextIndex >= SESSION_LENGTH) {
      setSessionComplete(true)
      setQuestion(null)
      recordBest(currentScore)
      return
    }
    setQuestionIndex(nextIndex)
    setFeedback('idle')
    setSelectedAnswer(null)
    setQuestion(generateQuestion(drill, filter, question ?? undefined))
  }

  function submitAnswer(answerIndex: number) {
    if (!question || feedback !== 'idle') return
    setSelectedAnswer(answerIndex)
    const correct = answerIndex === question.correctIndex
    if (correct) {
      const newScore = score + 1
      const newStreak = streak + 1
      setScore(newScore)
      setStreak(newStreak)
      setFeedback('correct')
      advanceTimerRef.current = setTimeout(() => advanceQuestion(newScore, newStreak), 600)
    } else {
      setStreak(0)
      setFeedback('incorrect')
      advanceTimerRef.current = setTimeout(() => advanceQuestion(score, 0), 1200)
    }
  }

  function submitWedgeAnswer(wedgeKey: string) {
    if (!question || feedback !== 'idle') return
    if (question.kind === 'order') return // wedges don't validate order drill
    setSelectedKey(wedgeKey)
    let answerIndex = -1
    if (question.kind === 'recognize') {
      answerIndex = question.options.findIndex(o => o.wedgeKey === wedgeKey)
    } else if (question.kind === 'recall') {
      const wedgeKeyInfo = KEYS.find(k => k.name === wedgeKey)
      if (!wedgeKeyInfo) return
      const wedgeCount = wedgeKeyInfo.sharps + wedgeKeyInfo.flats
      const wedgeSide: 'sharps' | 'flats' | 'natural' = wedgeKeyInfo.sharps > 0
        ? 'sharps'
        : wedgeKeyInfo.flats > 0 ? 'flats' : 'natural'
      answerIndex = question.options.findIndex(o => o.count === wedgeCount && o.side === wedgeSide)
    }
    if (answerIndex >= 0) submitAnswer(answerIndex)
  }

  const handleWedgeClick = (key: string) => {
    if (mode === 'study') {
      submitWedgeAnswer(key)
    } else {
      setSelectedKey(key)
    }
  }

  function changeMode(next: Mode) {
    setMode(next)
    if (next !== 'study') {
      // discard any in-progress session silently
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      setQuestion(null)
      setSessionComplete(false)
      setQuestionIndex(0)
      setScore(0)
      setStreak(0)
      setFeedback('idle')
      setSelectedAnswer(null)
    }
  }

  const currentBest = useMemo(() => bests[bestKeyFor(drill, filter)], [bests, drill, filter])

  const hintCopy = mode === 'study'
    ? 'Click a wedge or pill to answer.'
    : mode === 'affekt'
      ? 'Click a wedge to read the character of a different key.'
      : 'Click a wedge to update the staff and details.'

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => { samplerRef.current = sampler },
    }).toDestination()
    return () => { sampler.dispose() }
  }, [])

  const keyInfo = KEYS.find(k => k.name === selectedKey) ?? KEYS[0]

  function playRelativeMinor() {
    const relMinor = keyInfo.relativeMinor
    const isFlat = ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(keyInfo.name)
    const names = isFlat ? NOTE_NAMES_F : NOTE_NAMES_S
    const relPc = NOTE_NAMES_S.indexOf(relMinor) !== -1 ? NOTE_NAMES_S.indexOf(relMinor) : NOTE_NAMES_F.indexOf(relMinor)
    const pattern = [2,1,2,2,1,2,2]  // natural minor
    Tone.start().then(() => {
      if (!samplerRef.current) return
      const now = Tone.now()
      // F(5) F#(6) and above start at oct3, others at oct4
      const highRoots = [5,6,7,8,9,10,11]
      const startOct = highRoots.includes(relPc) ? 3 : 4
      let midi = (startOct + 1) * 12 + relPc
      const midiNotes = [midi]
      let m = midi
      for (const s of pattern) { m += s; midiNotes.push(m) }
      midiNotes.forEach((m, i) => {
        const pc = ((m % 12) + 12) % 12
        const oct = Math.floor(m / 12) - 1
        samplerRef.current?.triggerAttackRelease(names[pc] + oct, '4n', now + i * 0.35)
      })
    })
  }

  function playScale() {
    const isFlat = ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(selectedKey)
    const names = isFlat ? NOTE_NAMES_F : NOTE_NAMES_S
    const rootPc = NOTE_NAMES_S.indexOf(selectedKey) !== -1 ? NOTE_NAMES_S.indexOf(selectedKey) : NOTE_NAMES_F.indexOf(selectedKey)
    const pattern = [2,2,1,2,2,2,1]
    Tone.start().then(() => {
      if (!samplerRef.current) return
      const now = Tone.now()
      const highRoots2 = [8,9,10,11]
      let startOct2 = highRoots2.includes(rootPc) ? 3 : 4
      let midi = (startOct2 + 1) * 12 + rootPc
      const midiNotes = [midi]
      let m = midi
      for (const s of pattern) { m += s; midiNotes.push(m) }
      midiNotes.forEach((m, i) => {
        const pc = ((m % 12) + 12) % 12
        const oct = Math.floor(m / 12) - 1
        samplerRef.current?.triggerAttackRelease(names[pc] + oct, '4n', now + i * 0.35)
      })
    })
  }

  return (
    <div className={`nl-key-sig-page is-${mode}-mode`}>
      <div className="nl-key-sig-inner">
        <header className="nl-key-sig-hero">
          <Link href="/tools" className="nl-key-sig-hero__back">← Back to tools</Link>
          <div className="nl-key-sig-hero__row">
            <div className="nl-key-sig-hero__text">
              <span className="nl-key-sig-hero__eyebrow">Key Signatures</span>
              <h1 className="nl-key-sig-hero__title">The shape of <em>tonality.</em></h1>
              <p className="nl-key-sig-hero__sub">
                Explore the circle of fifths, see how sharps and flats build a key&apos;s character, and study the historical Affekt of each major and minor.
              </p>
            </div>
            <div className="nl-key-sig-mode-switcher" role="tablist" aria-label="Page mode">
              {(['signature', 'affekt', 'study'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={'nl-key-sig-mode-switcher__btn' + (mode === m ? ' is-active' : '')}
                  onClick={() => changeMode(m)}
                >
                  {m === 'signature' ? 'Signature' : m === 'affekt' ? 'Affekt' : 'Study'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="nl-key-sig-panel">
          <aside className="nl-key-sig-circle-panel">
            <p className="nl-key-sig-eyebrow">Circle of fifths</p>
            <div className="nl-key-sig-cof-frame">
              <CircleOfFifths selected={selectedKey} onSelect={handleWedgeClick} />
            </div>
            <p className="nl-key-sig-viz-hint">{hintCopy}</p>
            <div className="nl-key-sig-viz-spacer" aria-hidden="true" />
          </aside>

          <div className="nl-key-sig-info-panel">
            {mode !== 'study' && (
              <>
                <header className="nl-key-sig-info__head">
                  <h2 className="nl-key-sig-info__key">{selectedKey} Major</h2>
                  <p className="nl-key-sig-info__summary">
                    {keyInfo.sharps > 0
                      ? `${keyInfo.sharps} sharp${keyInfo.sharps > 1 ? 's' : ''}`
                      : keyInfo.flats > 0
                        ? `${keyInfo.flats} flat${keyInfo.flats > 1 ? 's' : ''}`
                        : 'No sharps or flats'}
                  </p>
                </header>

                <div className="nl-key-sig-info__meta">
                  <div>
                    <p className="nl-key-sig-info__meta-label">Relative minor</p>
                    <p className="nl-key-sig-info__meta-value">{keyInfo.relativeMinor} minor</p>
                  </div>
                  <div>
                    <p className="nl-key-sig-info__meta-label">
                      {keyInfo.sharps > 0 ? 'Sharps' : keyInfo.flats > 0 ? 'Flats' : 'Notes'}
                    </p>
                    <p className="nl-key-sig-info__meta-notes">
                      {keyInfo.sharps > 0
                        ? keyInfo.sharpNames.join(' ')
                        : keyInfo.flats > 0
                          ? keyInfo.flatNames.join(' ')
                          : 'C D E F G A B'}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="nl-key-sig-info__body">
              {mode === 'affekt' && (() => {
                const major = getAffekt(selectedKey, false)
                const minor = getAffekt(keyInfo.relativeMinor, true)
                return (
                  <div className="nl-key-sig-affekt" key={selectedKey}>
                    <p className="nl-key-sig-affekt-intro">
                      Based on C.F.D. Schubart&apos;s <em>Ideen zu einer Aesthetik der Tonkunst</em> (1784) and Francesco
                      Galeazzi&apos;s <em>Elementi teorico-pratici di musica</em> (1791). Expressive character in the Baroque
                      and Classical eras.
                    </p>
                    <div className="nl-key-sig-affekt__card">
                      <p className="nl-key-sig-affekt__key">{selectedKey} major</p>
                      {major?.schubart && (
                        <div className="nl-key-sig-affekt__quote">
                          <p className="nl-key-sig-affekt__source">Schubart</p>
                          <p className="nl-key-sig-affekt__text">&ldquo;{major.schubart}&rdquo;</p>
                        </div>
                      )}
                      {major?.galeazzi && (
                        <div className="nl-key-sig-affekt__quote">
                          <p className="nl-key-sig-affekt__source">Galeazzi</p>
                          <p className="nl-key-sig-affekt__text">&ldquo;{major.galeazzi}&rdquo;</p>
                        </div>
                      )}
                      {!major?.schubart && !major?.galeazzi && (
                        <p className="nl-key-sig-affekt-empty">No historical description for this key.</p>
                      )}
                    </div>
                    <div className="nl-key-sig-affekt__card">
                      <p className="nl-key-sig-affekt__key">{keyInfo.relativeMinor} minor (relative)</p>
                      {minor?.schubart && (
                        <div className="nl-key-sig-affekt__quote">
                          <p className="nl-key-sig-affekt__source">Schubart</p>
                          <p className="nl-key-sig-affekt__text">&ldquo;{minor.schubart}&rdquo;</p>
                        </div>
                      )}
                      {minor?.galeazzi && (
                        <div className="nl-key-sig-affekt__quote">
                          <p className="nl-key-sig-affekt__source">Galeazzi</p>
                          <p className="nl-key-sig-affekt__text">&ldquo;{minor.galeazzi}&rdquo;</p>
                        </div>
                      )}
                      {!minor?.schubart && !minor?.galeazzi && (
                        <p className="nl-key-sig-affekt-empty">No historical description for this key.</p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {(mode === 'signature' || mode === 'affekt') && (
                <div className="nl-key-sig-stage">
                  <div className="nl-key-sig-staff-panel">
                    <div className="nl-key-sig-staff-panel__head">
                      <span className="nl-key-sig-card__label">Staff</span>
                      <div className="nl-key-sig-staff-panel__toggle">
                        {(['treble', 'bass', 'both'] as const).map(c => (
                          <button
                            key={c}
                            type="button"
                            className={'nl-key-sig-staff-btn' + (clef === c ? ' is-active' : '')}
                            onClick={() => setClef(c)}
                          >
                            {c === 'both' ? 'Grand' : c.charAt(0).toUpperCase() + c.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="nl-key-sig-staff-grid">
                      {(clef === 'treble' || clef === 'both') && <KeyStaff keyInfo={keyInfo} clef="treble" width={320} />}
                      {(clef === 'bass' || clef === 'both') && <KeyStaff keyInfo={keyInfo} clef="bass" width={320} />}
                    </div>
                  </div>

                  <div className="nl-key-sig-piano-panel">
                    <div className="nl-key-sig-piano-panel__head">
                      <span className="nl-key-sig-card__label">Piano</span>
                      <div className="nl-key-sig-piano-panel__play-row">
                        <button
                          type="button"
                          className={'nl-key-sig-piano-play-btn' + (!showRelativeOnPiano && showScale ? ' is-active' : '')}
                          onClick={() => {
                            setShowScale(true)
                            setShowRelativeOnPiano(false)
                            playScale()
                          }}
                        >
                          <span className="nl-key-sig-piano-play-btn__icon">▶</span>
                          {' '}{selectedKey} major
                        </button>
                        <button
                          type="button"
                          className={'nl-key-sig-piano-play-btn' + (showRelativeOnPiano ? ' is-active' : '')}
                          onClick={() => {
                            setShowScale(true)
                            setShowRelativeOnPiano(true)
                            playRelativeMinor()
                          }}
                        >
                          <span className="nl-key-sig-piano-play-btn__icon">▶</span>
                          {' '}{keyInfo.relativeMinor} minor
                        </button>
                      </div>
                    </div>
                    <div className="nl-key-sig-piano-scroll">
                      <KeyPiano
                        keyInfo={keyInfo}
                        showScale={showScale}
                        highlightOneOctave={true}
                        isRelativeMinor={showRelativeOnPiano}
                        relativeMinorName={keyInfo.relativeMinor}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'study' && (
                <div className="nl-key-sig-study-panel">
                  <div className="nl-key-sig-study-panel__head">
                    <div className="nl-key-sig-study-panel__drill-tabs" role="tablist" aria-label="Drill type">
                      {(['recognize', 'recall', 'order'] as const).map(d => (
                        <button
                          key={d}
                          type="button"
                          role="tab"
                          aria-selected={drill === d}
                          className={'nl-key-sig-study-panel__drill-tab' + (drill === d ? ' is-active' : '')}
                          onClick={() => handleDrillChange(d)}
                        >
                          {d === 'recognize' ? 'Recognize' : d === 'recall' ? 'Recall' : 'Order'}
                        </button>
                      ))}
                    </div>
                    <div className="nl-key-sig-study-panel__stats">
                      <span className="nl-key-sig-study-panel__score">{sessionComplete ? score : score} / {SESSION_LENGTH}</span>
                      <span className="nl-key-sig-study-panel__streak" aria-label={`${streak} streak`}>
                        <span aria-hidden>🔥</span> {streak}
                      </span>
                      {currentBest && (
                        <span className="nl-key-sig-study-panel__best">best {currentBest.score}/{currentBest.of}</span>
                      )}
                    </div>
                  </div>

                  <div className="nl-key-sig-study-panel__body" key={`${drill}-${questionIndex}-${sessionComplete}`}>
                    {sessionComplete ? (
                      <div className="nl-key-sig-study-panel__summary">
                        <p className="nl-key-sig-study-panel__summary-title">Session complete</p>
                        <p className="nl-key-sig-study-panel__summary-score">You got {score} out of {SESSION_LENGTH}.</p>
                        {currentBest && (
                          <p className="nl-key-sig-study-panel__summary-best">
                            Personal best: {currentBest.score} out of {currentBest.of}
                          </p>
                        )}
                        <button
                          type="button"
                          className="nl-key-sig-study-panel__restart"
                          onClick={() => startNewSession(drill, filter)}
                        >
                          New session
                        </button>
                      </div>
                    ) : question ? (
                      <>
                        <div className="nl-key-sig-study-panel__prompt">
                          <p className="nl-key-sig-study-panel__prompt-text">{question.prompt}</p>
                          {question.kind === 'recognize' && (() => {
                            const sigInfo = KEYS.find(k => k.name === question.target.signatureSource) ?? KEYS[0]
                            return (
                              <div className="nl-key-sig-study-panel__prompt-staff">
                                <KeyStaff keyInfo={sigInfo} clef="treble" width={300} />
                              </div>
                            )
                          })()}
                        </div>

                        <div className="nl-key-sig-study-panel__answer-pills" role="group" aria-label="Answer choices">
                          {question.options.map((opt, i) => {
                            const label = question.kind === 'recognize'
                              ? (opt as StudyKey).name
                              : question.kind === 'recall'
                                ? (opt as { label: string }).label
                                : (opt as string)
                            const stateClass = selectedAnswer === null
                              ? ''
                              : i === question.correctIndex
                                ? ' is-correct'
                                : i === selectedAnswer
                                  ? ' is-incorrect'
                                  : ''
                            return (
                              <button
                                key={i}
                                type="button"
                                className={'nl-key-sig-study-panel__answer-pill' + stateClass}
                                onClick={() => submitAnswer(i)}
                                disabled={feedback !== 'idle'}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>

                        {feedback !== 'idle' && (
                          <div className={'nl-key-sig-study-panel__feedback is-' + feedback}>
                            {feedback === 'correct' ? (
                              <span>Correct!</span>
                            ) : (
                              <span>
                                The answer was{' '}
                                {question.kind === 'recognize'
                                  ? (question.options[question.correctIndex] as StudyKey).name
                                  : question.kind === 'recall'
                                    ? (question.options[question.correctIndex] as { label: string }).label
                                    : (question.options[question.correctIndex] as string)}
                                .
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>

                  {!sessionComplete && (
                    <div className="nl-key-sig-study-panel__footer">
                      <button
                        type="button"
                        className="nl-key-sig-study-panel__restart"
                        onClick={() => startNewSession(drill, filter)}
                      >
                        Restart session
                      </button>
                      <div className="nl-key-sig-study-panel__filter" role="group" aria-label="Question pool">
                        {(['majors', 'minors', 'both'] as const).map(f => {
                          const longLabel = f === 'majors' ? 'Majors only' : f === 'minors' ? 'Minors only' : 'Both'
                          const shortLabel = f === 'majors' ? 'Majors' : f === 'minors' ? 'Minors' : 'Both'
                          return (
                            <button
                              key={f}
                              type="button"
                              className={'nl-key-sig-study-panel__filter-chip' + (filter === f ? ' is-active' : '')}
                              onClick={() => handleFilterChange(f)}
                              disabled={drill === 'order'}
                              title={drill === 'order' ? 'Order drill uses sharps and flats only' : undefined}
                            >
                              <span className="nl-key-sig-study-panel__filter-chip-full">{longLabel}</span>
                              <span className="nl-key-sig-study-panel__filter-chip-short">{shortLabel}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import KeyDrill from '@/components/KeyDrill'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
function CircleOfFifths({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const [hoverPair, setHoverPair] = useState<number | null>(null)
  const size = 360
  const cx = size / 2, cy = size / 2
  const outerR = 155, innerR = 100, minorR = 65
  const outerTextR = 128, innerTextR = 80

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
      <circle cx={cx} cy={cy} r={minorR - 2} fill="white" stroke="#DDD8CA" strokeWidth="1" />

      {keys12.map((k, i) => {
        const pairSelected = selected === k.major || (k.alt ? selected === k.alt : false)
        const majorSelected = selected === k.major
        const altSelected = !!(k.alt && selected === k.alt)
        const isHover = hoverPair === i

        const innerFill = pairSelected
          ? '#3A3A38'
          : isHover
            ? '#D8D0C2'
            : '#EDE8DF'
        const outerFill = majorSelected || altSelected
          ? '#1A1A18'
          : isHover
            ? '#E8E0D2'
            : '#F2EDDF'

        const displayMinor = altSelected ? k.altMinor! : k.minor
        const angle = (i * 30 - 90) * Math.PI / 180
        const mtx = r(cx + innerTextR * Math.cos(angle))
        const mty = r(cy + innerTextR * Math.sin(angle))
        const otx = r(cx + outerTextR * Math.cos(angle))
        const oty = r(cy + outerTextR * Math.sin(angle))

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
              fontSize="10"
              fontFamily={F}
              fill={pairSelected ? 'white' : '#7A7060'}
              fontWeight="300"
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
                  fontSize="12"
                  fontFamily={SERIF}
                  fill={majorSelected || altSelected ? 'white' : '#1A1A18'}
                  fontWeight="300"
                  onClick={() => onSelect(k.major)}
                >
                  F#
                </text>
                <line
                  x1={otx - 8}
                  y1={oty}
                  x2={otx + 8}
                  y2={oty}
                  stroke={majorSelected || altSelected ? 'rgba(255,255,255,0.4)' : '#DDD8CA'}
                  strokeWidth="0.5"
                />
                <text
                  x={otx}
                  y={oty + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontFamily={SERIF}
                  fill={majorSelected || altSelected ? 'white' : '#1A1A18'}
                  fontWeight="300"
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
                fontSize="13"
                fontFamily={SERIF}
                fill={majorSelected ? 'white' : '#1A1A18'}
                fontWeight={majorSelected ? '400' : '300'}
                onClick={() => onSelect(k.major)}
              >
                {k.major}
              </text>
            )}
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
              border: '1px solid #DDD8CA',
              borderRadius: '0 0 6px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
              paddingBottom: '4px',
            }}>
              {k.note === 'C' && <span style={{ fontSize: '8px', color: '#DDD8CA', fontFamily: F }}>C{k.oct}</span>}
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
  const router = useRouter()
  const [selectedKey, setSelectedKey] = useState('C')
  const [clef, setClef] = useState<'treble' | 'bass' | 'both'>('both')
  const [showScale, setShowScale] = useState(true)
  const [activeTab, setActiveTab] = useState<'signature' | 'affekt' | 'drill'>('signature')
  const [showRelativeOnPiano, setShowRelativeOnPiano] = useState(false)
  const samplerRef = useRef<Tone.Sampler | null>(null)

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
    <div className="nl-key-sig-page">
      <div className="nl-key-sig-inner">
        <button type="button" className="nl-key-sig-back" onClick={() => router.push('/tools')}>
          ← Back
        </button>

        <div className="nl-key-sig-panel">
          <aside className="nl-key-sig-panel__viz">
            <p className="nl-key-sig-eyebrow">Circle of fifths</p>
            <div className="nl-key-sig-cof-frame">
              <CircleOfFifths selected={selectedKey} onSelect={setSelectedKey} />
            </div>
            <p className="nl-key-sig-viz-hint">Select a key to update the staff and details.</p>
            <div className="nl-key-sig-viz-spacer" aria-hidden="true" />
          </aside>

          <div className="nl-key-sig-panel__main">
            <header className="nl-key-sig-keyhead">
              <h1 className="nl-key-sig-title">{selectedKey} Major</h1>
              <p className="nl-key-sig-acc-badge">
                {keyInfo.sharps > 0
                  ? `${keyInfo.sharps} sharp${keyInfo.sharps > 1 ? 's' : ''}`
                  : keyInfo.flats > 0
                    ? `${keyInfo.flats} flat${keyInfo.flats > 1 ? 's' : ''}`
                    : 'No sharps or flats'}
              </p>
            </header>

            <div className="nl-key-sig-meta-row">
              <div>
                <p className="nl-key-sig-meta-label">Relative minor</p>
                <p className="nl-key-sig-meta-value">{keyInfo.relativeMinor} minor</p>
              </div>
              <div>
                <p className="nl-key-sig-meta-label">
                  {keyInfo.sharps > 0 ? 'Sharps' : keyInfo.flats > 0 ? 'Flats' : 'Notes'}
                </p>
                <p className="nl-key-sig-meta-value-sm">
                  {keyInfo.sharps > 0
                    ? keyInfo.sharpNames.join(' · ')
                    : keyInfo.flats > 0
                      ? keyInfo.flatNames.join(' · ')
                      : 'C D E F G A B'}
                </p>
              </div>
            </div>

            <div className="nl-key-sig-tabs" role="tablist" aria-label="Key tools">
              <div className="nl-key-sig-tabs__primary">
                {(['signature', 'affekt'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={'nl-key-sig-tab' + (activeTab === tab ? ' nl-key-sig-tab--active' : '')}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'signature' ? 'Signature' : 'Affekt'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'drill'}
                className={
                  'nl-key-sig-tab nl-key-sig-tab--study' + (activeTab === 'drill' ? ' nl-key-sig-tab--active' : '')
                }
                onClick={() => setActiveTab('drill')}
              >
                Study
              </button>
            </div>

            {activeTab === 'signature' && (
              <div className="nl-key-sig-tab-body nl-key-sig-tab-body--signature">
                <div className="nl-key-sig-card">
                  <div className="nl-key-sig-card__head">
                    <span className="nl-key-sig-card__label">Staff</span>
                    <div className="nl-key-sig-clef-toggles">
                      {(['treble', 'bass', 'both'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          className={'nl-key-sig-mini-btn' + (clef === c ? ' nl-key-sig-mini-btn--on' : '')}
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

                <div className="nl-key-sig-card">
                  <div className="nl-key-sig-card__head">
                    <span className="nl-key-sig-card__label">Piano</span>
                    <div className="nl-key-sig-clef-toggles">
                      <button
                        type="button"
                        className={'nl-key-sig-mini-btn' + (!showRelativeOnPiano && showScale ? ' nl-key-sig-mini-btn--on' : '')}
                        onClick={() => {
                          setShowScale(true)
                          setShowRelativeOnPiano(false)
                          playScale()
                        }}
                      >
                        ▶ {selectedKey} major
                      </button>
                      <button
                        type="button"
                        className={'nl-key-sig-mini-btn' + (showRelativeOnPiano ? ' nl-key-sig-mini-btn--on' : '')}
                        onClick={() => {
                          setShowScale(true)
                          setShowRelativeOnPiano(true)
                          playRelativeMinor()
                        }}
                      >
                        ▶ {keyInfo.relativeMinor} minor
                      </button>
                      <button type="button" className="nl-key-sig-mini-btn nl-key-sig-mini-btn--ghost" onClick={() => setShowScale(!showScale)}>
                        {showScale ? 'Hide' : 'Show'}
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

            {activeTab === 'affekt' && (() => {
              const major = getAffekt(selectedKey, false)
              const minor = getAffekt(keyInfo.relativeMinor, true)
              return (
                <div className="nl-key-sig-tab-body nl-key-sig-affekt">
                  <div className="nl-key-sig-affekt-source">
                    <p className="nl-key-sig-affekt-source__p">
                      Based on C.F.D. Schubart&apos;s <em>Ideen zu einer Aestetik der Tonkunst</em> (1784) and Francesco
                      Galeazzi&apos;s <em>Elementi teorico-pratici di musica</em> (1791). Expressive character in the Baroque
                      and Classical eras.
                    </p>
                  </div>
                  <div className="nl-key-sig-card nl-key-sig-card--tight">
                    <p className="nl-key-sig-affekt-block-title">{selectedKey} major</p>
                    {major?.schubart && (
                      <div className="nl-key-sig-affekt-quote-block">
                        <p className="nl-key-sig-affekt-author">Schubart</p>
                        <p className="nl-key-sig-affekt-quote">&ldquo;{major.schubart}&rdquo;</p>
                      </div>
                    )}
                    {major?.galeazzi && (
                      <div className="nl-key-sig-affekt-quote-block">
                        <p className="nl-key-sig-affekt-author nl-key-sig-affekt-author--muted">Galeazzi</p>
                        <p className="nl-key-sig-affekt-quote nl-key-sig-affekt-quote--muted">&ldquo;{major.galeazzi}&rdquo;</p>
                      </div>
                    )}
                    {!major?.schubart && !major?.galeazzi && (
                      <p className="nl-key-sig-affekt-empty">No historical description for this key.</p>
                    )}
                  </div>
                  <div className="nl-key-sig-card nl-key-sig-card--tight">
                    <p className="nl-key-sig-affekt-block-title">{keyInfo.relativeMinor} minor (relative)</p>
                    {minor?.schubart && (
                      <div className="nl-key-sig-affekt-quote-block">
                        <p className="nl-key-sig-affekt-author">Schubart</p>
                        <p className="nl-key-sig-affekt-quote">&ldquo;{minor.schubart}&rdquo;</p>
                      </div>
                    )}
                    {minor?.galeazzi && (
                      <div className="nl-key-sig-affekt-quote-block">
                        <p className="nl-key-sig-affekt-author nl-key-sig-affekt-author--muted">Galeazzi</p>
                        <p className="nl-key-sig-affekt-quote nl-key-sig-affekt-quote--muted">&ldquo;{minor.galeazzi}&rdquo;</p>
                      </div>
                    )}
                    {!minor?.schubart && !minor?.galeazzi && (
                      <p className="nl-key-sig-affekt-empty">No historical description for this key.</p>
                    )}
                  </div>
                </div>
              )
            })()}

            {activeTab === 'drill' && (
              <div className="nl-key-sig-tab-body nl-key-sig-tab-body--drill">
                <div className="nl-key-drill-embed">
                  <KeyDrill />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

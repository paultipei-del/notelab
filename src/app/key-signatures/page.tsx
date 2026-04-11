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

// ── Circle of Fifths ───────────────────────────────────────────────────────
function CircleOfFifths({ selected, onSelect }: { selected: string, onSelect: (k: string) => void }) {
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Inner minor ring wedges */}
      {keys12.map((k, i) => {
        const isSelected = selected === k.major || (k.alt && selected === k.alt)
        return (
          <path key={'mi-'+k.major} d={wedgePath(minorR, innerR, i)}
            fill={isSelected ? '#3A3A38' : '#EDE8DF'}
            stroke="white" strokeWidth="1.5"
            onClick={() => onSelect(k.major)} style={{ cursor: 'pointer' }} />
        )
      })}
      {/* Outer major ring wedges */}
      {keys12.map((k, i) => {
        const isSelected = selected === k.major
        const isAltSelected = k.alt && selected === k.alt
        return (
          <path key={'ma-'+k.major} d={wedgePath(innerR, outerR, i)}
            fill={(isSelected || isAltSelected) ? '#1A1A18' : '#F2EDDF'}
            stroke="white" strokeWidth="2"
            onClick={() => onSelect(isAltSelected ? k.alt! : k.major)} style={{ cursor: 'pointer' }} />
        )
      })}
      {/* Center circle */}
      <circle cx={cx} cy={cy} r={minorR - 2} fill="white" stroke="#DDD8CA" strokeWidth="1" />
      {/* Minor text labels */}
      {keys12.map((k, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180
        const tx = r(cx + innerTextR * Math.cos(angle))
        const ty = r(cy + innerTextR * Math.sin(angle))
        const isSelected = selected === k.major || (k.alt && selected === k.alt)
        const displayMinor = (k.alt && selected === k.alt) ? k.altMinor! : k.minor
        return (
          <text key={'mit-'+k.major} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontFamily={F} fill={isSelected ? 'white' : '#7A7060'} fontWeight="300"
            onClick={() => onSelect(k.major)} style={{ cursor: 'pointer' }}>
            {displayMinor}
          </text>
        )
      })}
      {/* Major text labels */}
      {keys12.map((k, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180
        const tx = r(cx + outerTextR * Math.cos(angle))
        const ty = r(cy + outerTextR * Math.sin(angle))
        const isSelected = selected === k.major
        const isAltSelected = k.alt && selected === k.alt
        return (
          <g key={'mat-'+k.major} style={{ cursor: 'pointer' }}>
            {k.alt ? (
              <>
                <text x={tx} y={ty - 7} textAnchor="middle" dominantBaseline="middle"
                  fontSize="12" fontFamily={SERIF}
                  fill={(isSelected || isAltSelected) ? 'white' : '#1A1A18'}
                  fontWeight="300" onClick={() => onSelect(k.major)}>
                  F#
                </text>
                <line x1={tx - 8} y1={ty} x2={tx + 8} y2={ty}
                  stroke={(isSelected || isAltSelected) ? 'rgba(255,255,255,0.4)' : '#DDD8CA'}
                  strokeWidth="0.5" />
                <text x={tx} y={ty + 7} textAnchor="middle" dominantBaseline="middle"
                  fontSize="12" fontFamily={SERIF}
                  fill={(isSelected || isAltSelected) ? 'white' : '#1A1A18'}
                  fontWeight="300" onClick={() => onSelect(k.alt!)}>
                  Gb
                </text>
              </>
            ) : (
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontFamily={SERIF}
                fill={isSelected ? 'white' : '#1A1A18'}
                fontWeight={isSelected ? '400' : '300'}
                onClick={() => onSelect(k.major)}>
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
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <button onClick={() => router.push('/tools')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: 0, marginBottom: '24px', display: 'block' }}>← Back</button>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' as const }}>

          {/* Left: Circle of Fifths */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060' }}>Circle of Fifths</p>
            <CircleOfFifths selected={selectedKey} onSelect={setSelectedKey} />

          </div>

          {/* Right: Key info */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

            {/* Key name + info */}
            <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: '#2A2318' }}>{selectedKey} Major</h2>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>
                  {keyInfo.sharps > 0 ? `${keyInfo.sharps} sharp${keyInfo.sharps > 1 ? 's' : ''}` :
                   keyInfo.flats > 0 ? `${keyInfo.flats} flat${keyInfo.flats > 1 ? 's' : ''}` : 'No sharps or flats'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Relative Minor</p>
                  <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#2A2318' }}>{keyInfo.relativeMinor} minor</p>
                </div>
                <div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                    {keyInfo.sharps > 0 ? 'Sharps' : keyInfo.flats > 0 ? 'Flats' : 'Notes'}
                  </p>
                  <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 300, color: '#2A2318' }}>
                    {keyInfo.sharps > 0 ? keyInfo.sharpNames.join('  ') :
                     keyInfo.flats > 0 ? keyInfo.flatNames.join('  ') : 'C D E F G A B'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
              {(['signature', 'affekt', 'drill'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '8px 18px', borderRadius: '20px', border: '1px solid ' + (activeTab === tab ? '#1A1A18' : '#DDD8CA'), background: activeTab === tab ? '#1A1A18' : 'white', color: activeTab === tab ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                  {tab === 'signature' ? 'Key Signature' : tab === 'affekt' ? 'Historical Affekt' : 'Drill'}
                </button>
              ))}
            </div>

            {/* Staff display */}
            {activeTab === 'drill' && <KeyDrill />}

            {activeTab === 'signature' && <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060' }}>Staff</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['treble','bass','both'] as const).map(c => (
                    <button key={c} onClick={() => setClef(c)}
                      style={{ padding: '4px 10px', borderRadius: '12px', border: '1px solid ' + (clef === c ? '#1A1A18' : '#DDD8CA'), background: clef === c ? '#1A1A18' : 'white', color: clef === c ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                      {c === 'both' ? 'Grand' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {(clef === 'treble' || clef === 'both') && <KeyStaff keyInfo={keyInfo} clef="treble" width={340} />}
              {(clef === 'bass' || clef === 'both') && <KeyStaff keyInfo={keyInfo} clef="bass" width={340} />}

            </div>}

            {/* Affekt panel */}
            {activeTab === 'affekt' && (() => {
              const major = getAffekt(selectedKey, false)
              const minor = getAffekt(keyInfo.relativeMinor, true)
              return (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                  {/* Source note */}
                  <div style={{ background: '#F2EDDF', borderRadius: '12px', padding: '12px 16px' }}>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', lineHeight: 1.6 }}>
                      Based on C.F.D. Schubart's <em>Ideen zu einer Aestetik der Tonkunst</em> (1784) and Francesco Galeazzi's <em>Elementi teorico-pratici di musica</em> (1791). These describe the expressive character associated with each key in the Baroque and Classical eras.
                    </p>
                  </div>
                  {/* Major key */}
                  <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px 24px' }}>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>{selectedKey} Major</p>
                    {major?.schubart && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#B5402A', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Schubart</p>
                        <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: '#2A2318', lineHeight: 1.7, fontStyle: 'italic' }}>"{major.schubart}"</p>
                      </div>
                    )}
                    {major?.galeazzi && (
                      <div>
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Galeazzi</p>
                        <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>"{major.galeazzi}"</p>
                      </div>
                    )}
                    {!major?.schubart && !major?.galeazzi && (
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>No historical description available for this key.</p>
                    )}
                  </div>
                  {/* Relative minor */}
                  <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px 24px' }}>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>{keyInfo.relativeMinor} minor (relative)</p>
                    {minor?.schubart && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#B5402A', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Schubart</p>
                        <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: '#2A2318', lineHeight: 1.7, fontStyle: 'italic' }}>"{minor.schubart}"</p>
                      </div>
                    )}
                    {minor?.galeazzi && (
                      <div>
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Galeazzi</p>
                        <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 300, color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>"{minor.galeazzi}"</p>
                      </div>
                    )}
                    {!minor?.schubart && !minor?.galeazzi && (
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>No historical description available for this key.</p>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Piano */}
            {activeTab === 'drill' && <KeyDrill />}

            {activeTab === 'signature' && <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060' }}>Piano</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  <button onClick={() => { setShowScale(true); setShowRelativeOnPiano(false); playScale() }}
                    style={{ padding: '4px 12px', borderRadius: '12px', border: '1px solid ' + (!showRelativeOnPiano && showScale ? '#1A1A18' : '#DDD8CA'), background: !showRelativeOnPiano && showScale ? '#1A1A18' : 'white', color: !showRelativeOnPiano && showScale ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                    ▶ {selectedKey} Major
                  </button>
                  <button onClick={() => { setShowScale(true); setShowRelativeOnPiano(true); playRelativeMinor() }}
                    style={{ padding: '4px 12px', borderRadius: '12px', border: '1px solid ' + (showRelativeOnPiano ? '#1A1A18' : '#DDD8CA'), background: showRelativeOnPiano ? '#1A1A18' : 'white', color: showRelativeOnPiano ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                    ▶ {keyInfo.relativeMinor} minor
                  </button>
                  <button onClick={() => setShowScale(!showScale)}
                    style={{ padding: '4px 12px', borderRadius: '12px', border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
                    {showScale ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
            <KeyPiano keyInfo={keyInfo} showScale={showScale} highlightOneOctave={true} isRelativeMinor={showRelativeOnPiano} relativeMinorName={keyInfo.relativeMinor} />
          </div>
            </div>}

          </div>
        </div>
      </div>
    </div>
  )
}

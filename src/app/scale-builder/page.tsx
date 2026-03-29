'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as Tone from 'tone'
import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type Step = 'W' | 'H' | 'A'  // Whole, Half, Augmented
type Phase = 'select_root' | 'play_note' | 'complete'
type ScaleType = 
  'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor' |
  'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' |
  'major_pentatonic' | 'minor_pentatonic' |
  'blues' | 'whole_tone' | 'diminished_hw' | 'diminished_wh'

interface BuiltNote {
  name: string
  octave: number
  midiNum: number
}

// ── Scale Patterns ─────────────────────────────────────────────────────────
const SCALE_PATTERNS: Record<ScaleType, Step[]> = {
  // Major & modes
  major:           ['W','W','H','W','W','W','H'],
  ionian:          ['W','W','H','W','W','W','H'],
  dorian:          ['W','H','W','W','W','H','W'],
  phrygian:        ['H','W','W','W','H','W','W'],
  lydian:          ['W','W','W','H','W','W','H'],
  mixolydian:      ['W','W','H','W','W','H','W'],
  aeolian:         ['W','H','W','W','H','W','W'],
  locrian:         ['H','W','W','H','W','W','W'],
  // Minor variants
  natural_minor:   ['W','H','W','W','H','W','W'],
  harmonic_minor:  ['W','H','W','W','H','A','W'],
  melodic_minor:   ['W','H','W','W','W','W','H'],
  // Pentatonic — displayed as scale degrees
  major_pentatonic: ['W','W','A','W','A'],
  minor_pentatonic: ['A','W','W','A','W'],
  // Other
  blues:           ['A','W','H','H','A','W'],
  whole_tone:      ['W','W','W','W','W','W'],
  diminished_hw:   ['H','W','H','W','H','W','H','W'],
  diminished_wh:   ['W','H','W','H','W','H','W','H'],
}

const SCALE_GROUPS: { label: string; types: ScaleType[] }[] = [
  { label: 'Major & Modes', types: ['major','dorian','phrygian','lydian','mixolydian','aeolian','locrian'] },
  { label: 'Minor', types: ['natural_minor','harmonic_minor','melodic_minor'] },
  { label: 'Pentatonic & Blues', types: ['major_pentatonic','minor_pentatonic','blues'] },
  { label: 'Symmetric', types: ['whole_tone','diminished_hw','diminished_wh'] },
]

const SCALE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  ionian: 'Ionian',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian',
  locrian: 'Locrian',
  natural_minor: 'Natural Minor',
  harmonic_minor: 'Harmonic Minor',
  melodic_minor: 'Melodic Minor',
  major_pentatonic: 'Major Pentatonic',
  minor_pentatonic: 'Minor Pentatonic',
  blues: 'Blues',
  whole_tone: 'Whole Tone',
  diminished_hw: 'Diminished (H-W)',
  diminished_wh: 'Diminished (W-H)',
}

const STEP_SEMITONES: Record<Step, number> = { W: 2, H: 1, A: 3 }
const DEGREE_LABELS: Partial<Record<ScaleType, string[]>> = {
  major_pentatonic: ['1','2','3','5','6','1'],
  minor_pentatonic: ['1','b3','4','5','b7','1'],
  blues: ['1','b3','4','b5','5','b7','1'],
  whole_tone: ['1','2','3','#4','#5','b7','1'],
  diminished_hw: ['1','b2','b3','3','b5','5','6','b7','1'],
  diminished_wh: ['1','2','b3','4','#4','#5','6','7','1'],
}

const STEP_LABELS: Record<Step, string> = {
  W: 'Whole Step', H: 'Half Step', A: 'Minor 3rd'
}

// ── Note helpers ───────────────────────────────────────────────────────────
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// Prefer flats for certain keys
const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','D','G','A','E','B','Bb'])

function midiToNote(midi: number, preferFlats: boolean): { name: string, octave: number } {
  const pc = midi % 12
  const octave = Math.floor(midi / 12) - 1
  const name = preferFlats ? FLAT_NAMES[pc] : NOTE_NAMES[pc]
  return { name, octave }
}

function noteToMidi(name: string, octave: number): number {
  const pc = NOTE_NAMES.indexOf(name) !== -1
    ? NOTE_NAMES.indexOf(name)
    : FLAT_NAMES.indexOf(name)
  return (octave + 1) * 12 + pc
}

function buildExpectedNotes(rootName: string, rootOctave: number, scaleType: ScaleType): BuiltNote[] {
  const NATURALS = ['C','D','E','F','G','A','B']
  const NAT_PC: Record<string, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }
  const STEP_SEM: Record<Step, number> = { W:2, H:1, A:3 }

  function noteToMidiLocal(name: string, oct: number): number {
    const nat = name[0]
    const acc = name.slice(1)
    let pc = NAT_PC[nat]
    if (acc === '#') pc += 1
    else if (acc === '##') pc += 2
    else if (acc === 'b') pc -= 1
    else if (acc === 'bb') pc -= 2
    return (oct + 1) * 12 + ((pc % 12 + 12) % 12)
  }

  // Build from interval pattern with correct enharmonic spelling
  function buildFromPattern(root: string, rootOct: number, pattern: Step[]): BuiltNote[] {
    const rootNat = root[0]
    let natIdx = NATURALS.indexOf(rootNat)
    const notes: BuiltNote[] = []
    let midi = noteToMidiLocal(root, rootOct)
    notes.push({ name: root, octave: rootOct, midiNum: midi })
    let octave = rootOct

    for (const step of pattern) {
      midi += STEP_SEM[step]
      natIdx = natIdx + 1
      if (natIdx === 7) { natIdx = 0; octave++ }
      const nat = NATURALS[natIdx]
      const natMidi = (octave + 1) * 12 + NAT_PC[nat]
      const diff = midi - natMidi
      let name: string
      if (diff === 0) name = nat
      else if (diff === 1) name = nat + '#'
      else if (diff === -1) name = nat + 'b'
      else if (diff === 2) name = nat + '##'
      else if (diff === -2) name = nat + 'bb'
      else name = nat
      notes.push({ name, octave, midiNum: midi })
    }
    return notes
  }

  // Build pentatonic/blues from scale degrees of a parent scale
  function buildFromDegrees(root: string, rootOct: number, parentPattern: Step[], degrees: number[]): BuiltNote[] {
    const full = buildFromPattern(root, rootOct, parentPattern)
    return degrees.map(d => full[d])
  }

  // Pragmatic whole tone / diminished spelling — no double accidentals, no E#/B#/Fb/Cb
  function buildPragmatic(root: string, rootOct: number, semitones: number[]): BuiltNote[] {
    // Circle of fifths preferred spellings
    // Bb instead of A#, Db instead of C#, Eb instead of D#, Ab instead of G#
    const PREFERRED: Record<number, string> = {
      1: 'Db', 3: 'Eb', 6: 'Gb', 8: 'Ab', 10: 'Bb'
    }
    const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    
    const notes: BuiltNote[] = []
    let midi = noteToMidiLocal(root, rootOct)
    notes.push({ name: root, octave: rootOct, midiNum: midi })
    
    for (const semi of semitones) {
      midi += semi
      const pc = midi % 12
      const oct = Math.floor(midi / 12) - 1
      // Use preferred spelling (flats for black keys mostly)
      let name = PREFERRED[pc] ?? SHARP_NAMES[pc]
      // F# preferred over Gb when root is sharpy
      if (pc === 6 && ['G','D','A','E','B','F#'].includes(root)) name = 'F#'
      notes.push({ name, octave: oct, midiNum: midi })
    }
    return notes
  }

  const MAJ_PATTERN: Step[] = ['W','W','H','W','W','W','H']
  const MIN_PATTERN: Step[] = ['W','H','W','W','H','W','W']
  const HARM_MIN_PATTERN: Step[] = ['W','H','W','W','H','A','H']

  switch (scaleType) {
    case 'major':
    case 'ionian':
      return buildFromPattern(rootName, rootOctave, MAJ_PATTERN)
    
    case 'dorian':
      return buildFromPattern(rootName, rootOctave, ['W','H','W','W','W','H','W'])
    case 'phrygian':
      return buildFromPattern(rootName, rootOctave, ['H','W','W','W','H','W','W'])
    case 'lydian':
      return buildFromPattern(rootName, rootOctave, ['W','W','W','H','W','W','H'])
    case 'mixolydian':
      return buildFromPattern(rootName, rootOctave, ['W','W','H','W','W','H','W'])
    case 'aeolian':
    case 'natural_minor':
      return buildFromPattern(rootName, rootOctave, MIN_PATTERN)
    case 'locrian':
      return buildFromPattern(rootName, rootOctave, ['H','W','W','H','W','W','W'])
    
    case 'harmonic_minor':
      return buildFromPattern(rootName, rootOctave, HARM_MIN_PATTERN)
    
    case 'melodic_minor':
      return buildFromPattern(rootName, rootOctave, ['W','H','W','W','W','W','H'])
    
    // Pentatonics — derived from scale degrees
    case 'major_pentatonic': {
      // Degrees 1 2 3 5 6 + octave root
      const notes = buildFromDegrees(rootName, rootOctave, MAJ_PATTERN, [0,1,2,4,5])
      const last = notes[0]
      notes.push({ name: last.name, octave: last.octave + 1, midiNum: last.midiNum + 12 })
      return notes
    }
    
    case 'minor_pentatonic': {
      // Degrees 1 b3 4 5 b7 + octave root
      const notes = buildFromDegrees(rootName, rootOctave, MIN_PATTERN, [0,2,3,4,6])
      const last = notes[0]
      notes.push({ name: last.name, octave: last.octave + 1, midiNum: last.midiNum + 12 })
      return notes
    }
    
    case 'blues': {
      // Minor pentatonic + b5 (tritone)
      const minPent = buildFromDegrees(rootName, rootOctave, MIN_PATTERN, [0,2,3,4,6])
      // Insert b5 between degree 4 and 5 of minor scale
      const full = buildFromPattern(rootName, rootOctave, MIN_PATTERN)
      // b5 = half step above degree 4 of minor scale
      const p4midi = full[3].midiNum + 1
      const p4pc = p4midi % 12
      const p4oct = Math.floor(p4midi / 12) - 1
      const SHARP_N = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
      const FLAT_N  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
      const useF = ['F','Bb','Eb','Ab','Db','Gb'].includes(rootName)
      const b5name = useF ? FLAT_N[p4pc] : SHARP_N[p4pc]
      const b5: BuiltNote = { name: b5name, octave: p4oct, midiNum: p4midi }
      const octRoot: BuiltNote = { name: minPent[0].name, octave: minPent[0].octave + 1, midiNum: minPent[0].midiNum + 12 }
      return [minPent[0], minPent[1], minPent[2], b5, minPent[3], minPent[4], octRoot]
    }
    
    case 'whole_tone': {
      const notes = buildPragmatic(rootName, rootOctave, [2,2,2,2,2,2])
      const r = notes[0]
      notes.push({ name: r.name, octave: r.octave + 1, midiNum: r.midiNum + 12 })
      return notes
    }
    
    case 'diminished_hw':
      return buildPragmatic(rootName, rootOctave, [1,2,1,2,1,2,1,2])
    
    case 'diminished_wh':
      return buildPragmatic(rootName, rootOctave, [2,1,2,1,2,1,2,1])
    
    default:
      return buildFromPattern(rootName, rootOctave, MAJ_PATTERN)
  }
}


// ── Piano Layout ───────────────────────────────────────────────────────────
// Show C3 to C6 (3 octaves + 1)
const WHITE_NOTES = ['C','D','E','F','G','A','B']
const BLACK_NOTES: Record<string, number> = { 'C#': 0.6, 'D#': 1.6, 'F#': 3.6, 'G#': 4.6, 'A#': 5.6 }

interface PianoKey {
  name: string
  octave: number
  midi: number
  black: boolean
  whiteIndex: number
}

function buildPianoKeys(): PianoKey[] {
  const keys: PianoKey[] = []
  let wi = 0
  for (let oct = 3; oct <= 5; oct++) {
    for (const note of WHITE_NOTES) {
      const midi = noteToMidi(note, oct)
      keys.push({ name: note, octave: oct, midi, black: false, whiteIndex: wi++ })
      const sharpName = note + '#'
      if (BLACK_NOTES[sharpName] !== undefined && !(oct === 5 && note === 'B')) {
        const smidi = noteToMidi(sharpName, oct)
        keys.push({ name: sharpName, octave: oct, midi: smidi, black: true, whiteIndex: wi - 1 })
      }
    }
  }
  // Add C6
  keys.push({ name: 'C', octave: 6, midi: noteToMidi('C', 6), black: false, whiteIndex: wi++ })
  return keys
}

const PIANO_KEYS = buildPianoKeys()
const WHITE_KEYS = PIANO_KEYS.filter(k => !k.black)
const BLACK_KEYS = PIANO_KEYS.filter(k => k.black)
const KW = 36, KH = 110, BW = 22, BH = 68

// ── Staff rendering helpers ────────────────────────────────────────────────
// Simple treble staff note positions
const TREBLE_POS: Record<string, number> = {
  'E4': 8, 'F4': 7, 'G4': 6, 'A4': 5, 'B4': 4,
  'C5': 3, 'D5': 2, 'E5': 1, 'F5': 0,
  'C4': 10, 'D4': 9, 'B3': 11, 'A3': 12, 'G3': 13,
  'G5': -1, 'A5': -2, 'B5': -3, 'C6': -4,
  // Flats/sharps use same position as natural
  'Db4': 9, 'Eb4': 8, 'Gb4': 6, 'Ab4': 5, 'Bb4': 4,
  'C#4': 10, 'D#4': 9, 'F#4': 7, 'G#4': 6, 'A#4': 5,
  'Db5': 2, 'Eb5': 1, 'Gb5': -1, 'Ab5': -2, 'Bb5': -3,
  'C#5': 3, 'D#5': 2, 'F#5': 0, 'G#5': -1, 'A#5': -2,
  'C#3': 17, 'D#3': 16, 'F#3': 14, 'G#3': 13, 'A#3': 12,
  'Db3': 16, 'Eb3': 15, 'Gb3': 13, 'Ab3': 12, 'Bb3': 11,
  // Enharmonic equivalents needed for unusual keys
  'E#4': 8, 'B#4': 4, 'B#3': 11, 'E#3': 14, 'E#5': 1, 'B#5': -3,
  'F##4': 7, 'C##4': 10, 'G##4': 6, 'D##4': 9, 'A##4': 5,
  'F##5': 0, 'C##5': 3, 'G##5': -1,
}

const ACC_MAP: Record<string, 'sharp' | 'flat' | 'double_sharp' | 'double_flat'> = {
  'C#': 'sharp', 'D#': 'sharp', 'F#': 'sharp', 'G#': 'sharp', 'A#': 'sharp', 'E#': 'sharp', 'B#': 'sharp',
  'Db': 'flat', 'Eb': 'flat', 'Gb': 'flat', 'Ab': 'flat', 'Bb': 'flat', 'Cb': 'flat', 'Fb': 'flat',
  'C##': 'double_sharp', 'D##': 'double_sharp', 'F##': 'double_sharp', 'G##': 'double_sharp', 'A##': 'double_sharp',
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ScaleBuilder() {
  const router = useRouter()
  const [scaleType, setScaleType] = useState<ScaleType>('major')
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [phase, setPhase] = useState<Phase>('select_root')
  const [builtNotes, setBuiltNotes] = useState<BuiltNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showNoteNames, setShowNoteNames] = useState(false)
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

  const pattern = SCALE_PATTERNS[scaleType]
  const currentStepIndex = builtNotes.length - 1  // index into pattern
  const currentStep = pattern[currentStepIndex] as Step | undefined
  const expectedLength = ['major_pentatonic','minor_pentatonic'].includes(scaleType) ? 6
    : scaleType === 'blues' ? 7
    : scaleType === 'whole_tone' ? 7
    : ['diminished_hw','diminished_wh'].includes(scaleType) ? 9
    : 8
  const isComplete = phase === 'complete'

  // Expected next note
  const expectedNotes = useMemo(() => {
    if (builtNotes.length === 0) return []
    return buildExpectedNotes(builtNotes[0].name, builtNotes[0].octave, scaleType)
  }, [builtNotes, scaleType])

  const expectedNextMidi = builtNotes.length > 0 && builtNotes.length < expectedLength
    ? expectedNotes[builtNotes.length]?.midiNum
    : null

  function playNote(midi: number) {
    const note = midiToNote(midi, false)
    const toneName = note.name + note.octave
    Tone.start().then(() => {
      if (samplerRef.current) {
        samplerRef.current.triggerAttackRelease(toneName, '2n')
      }
    })
  }

  async function playScale(notes: BuiltNote[]) {
    await Tone.start()
    if (!samplerRef.current) return
    const now = Tone.now()
    notes.forEach((n, i) => {
      samplerRef.current?.triggerAttackRelease(n.name + n.octave, '4n', now + i * 0.4)
    })
  }

  const handleKeyClick = useCallback((key: PianoKey) => {
    setError(null)

    if (phase === 'select_root') {
      const note = midiToNote(key.midi, FLAT_KEYS.has(key.name))
      setBuiltNotes([{ name: note.name, octave: note.octave, midiNum: key.midi }])
      setPhase('play_note')
            playNote(key.midi)
      return
    }

    if (phase === 'play_note') {
      if (expectedNextMidi === null) return

      if (key.midi === expectedNextMidi) {
        // Correct! Use expected spelling for correct note name
        setFlash('correct')
        setTimeout(() => setFlash(null), 300)
        const expectedNote = expectedNotes[builtNotes.length]
        const newNotes = [...builtNotes, { name: expectedNote.name, octave: expectedNote.octave, midiNum: key.midi }]
        setBuiltNotes(newNotes)
        playNote(key.midi)

if (newNotes.length === expectedLength) {
          setPhase('complete')
          setTimeout(() => playScale(newNotes), 500)
        } else {
          setPhase('play_note')
                  }
      } else {
        // Wrong note
        setFlash('wrong')
        setTimeout(() => setFlash(null), 400)
        const semitonesDiff = key.midi - builtNotes[builtNotes.length - 1].midiNum
        const expectedSemitones = STEP_SEMITONES[currentStep!]
        if (semitonesDiff === expectedSemitones - 1) {
          setError(`Too close — that's a half step. You need a ${STEP_LABELS[currentStep!]}.`)
        } else if (semitonesDiff === expectedSemitones + 1) {
          setError(`Too far — that's a whole step. You need a ${STEP_LABELS[currentStep!]}.`)
        } else if (semitonesDiff <= 0) {
          setError('The scale goes up — play a higher note.')
        } else {
          setError(`Not quite. You need a ${STEP_LABELS[currentStep!]} from ${builtNotes[builtNotes.length-1].name}${builtNotes[builtNotes.length-1].octave}.`)
        }
        playNote(key.midi)
      }
    }
  }, [phase, expectedNextMidi, builtNotes, currentStep, expectedLength, expectedNotes, scaleType])

  function reset() {
    setBuiltNotes([])
    setPhase('select_root')
        setError(null)
    setFlash(null)
  }

  const F = 'var(--font-jost), sans-serif'
  const SERIF = 'var(--font-cormorant), serif'

  // Key color logic
  function keyBg(key: PianoKey): string {
    const isBuilt = builtNotes.some(n => n.midiNum === key.midi)
    const isRoot = builtNotes[0]?.midiNum === key.midi
    const isNext = expectedNextMidi === key.midi && phase === 'play_note'

    if (key.black) {
      if (isRoot) return '#BA7517'
      if (isBuilt) return '#4CAF50'
      if (isNext && showHint) return '#6B8FD4'
      return '#1A1A18'
    } else {
      if (isRoot) return '#FAEEDA'
      if (isBuilt) return '#E8F5E9'
      if (isNext && showHint) return '#E8EEF9'
      return 'white'
    }
  }

  // Staff rendering
  const step = 6
  const staffTop = 40
  const staffLeft = 20
  const noteSpacing = 46
  const staffWidth = Math.max(200, builtNotes.length * noteSpacing + 80)
  const svgW = staffLeft * 2 + staffWidth
  const svgH = 160

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '22px', color: '#1A1A18', letterSpacing: '0.02em' }}>Scale Builder</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Scale type selector */}
        <div style={{ marginBottom: '32px' }}>
          {SCALE_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '12px' }}>
              <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '8px' }}>{group.label}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {group.types.map(type => (
                  <button key={type} onClick={() => { setScaleType(type); reset() }}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (scaleType === type ? '#1A1A18' : '#D3D1C7'), background: scaleType === type ? '#1A1A18' : 'white', color: scaleType === type ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                    {SCALE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Root note picker */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px 24px', marginBottom: '24px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Starting Note</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
            {['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'].map(note => (
              <button key={note} onClick={() => {
                setSelectedRoot(note)
                // Find this note on the piano and set it as root
                const midi = noteToMidi(note, 4)
                const builtNote = { name: note, octave: 4, midiNum: midi }
                setBuiltNotes([builtNote])
                setPhase('play_note')
                setError(null)
                setFlash(null)
              }} style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid ' + (selectedRoot === note ? '#1A1A18' : '#D3D1C7'),
                background: selectedRoot === note ? '#1A1A18' : 'white',
                color: selectedRoot === note ? 'white' : note.includes('b') ? '#888780' : '#1A1A18',
                fontFamily: SERIF, fontSize: '16px', fontWeight: 300,
                cursor: 'pointer', minWidth: '36px', textAlign: 'center' as const,
              }}>
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern display */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px 24px', marginBottom: '24px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Pattern</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(DEGREE_LABELS[scaleType] ?? []).length > 0 ? (
            // Show scale degrees for pentatonic/blues/WT/dim
            DEGREE_LABELS[scaleType]!.map((deg, i) => {
              // i=0 is the root box, rest are subsequent notes
              const noteAtIdx = i === 0 ? builtNotes[0] : builtNotes[i]
              const isActive = builtNotes.length === i && phase !== 'select_root' && i > 0
              const isDone = builtNotes.length > i
              const isLast = i === DEGREE_LABELS[scaleType]!.length - 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Note box with degree below */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isDone ? '#E8F5E9' : isActive ? '#F5F2EC' : '#F5F2EC', border: '1px solid ' + (isDone ? '#4CAF50' : isActive ? '#1A1A18' : '#EDE8DF'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: SERIF, fontSize: '14px', color: isDone ? '#4CAF50' : '#D3D1C7' }}>{noteAtIdx?.name ?? '?'}</span>
                    </div>
                    <span style={{ fontFamily: F, fontSize: '9px', fontWeight: 300, color: isDone ? '#4CAF50' : '#D3D1C7', letterSpacing: '0.04em' }}>{deg}</span>
                  </div>
                  {/* Arrow between boxes (not after last) */}
                  {!isLast && (
                    <div style={{ width: '16px', height: '1px', background: isDone ? '#4CAF50' : '#D3D1C7' }} />
                  )}
                </div>
              )
            })
          ) : (
            <>
            {/* Root box for normal scales */}
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: builtNotes.length > 0 ? '#FAEEDA' : '#F5F2EC', border: '1px solid ' + (builtNotes.length > 0 ? '#BA7517' : '#D3D1C7'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: SERIF, fontSize: '16px', color: builtNotes.length > 0 ? '#BA7517' : '#888780' }}>
                  {builtNotes[0]?.name ?? '?'}
                </span>
              </div>
            </div>
            {pattern.map((step, i) => {
              const noteAtStep = builtNotes[i + 1]
              const isActive = builtNotes.length === i + 1 && phase !== 'select_root'
              const isDone = builtNotes.length > i + 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Step arrow */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontFamily: F, fontSize: '10px', fontWeight: isActive ? 600 : 300, color: isActive ? '#1A1A18' : isDone ? '#4CAF50' : '#D3D1C7', letterSpacing: '0.04em' }}>
                      {step}
                    </span>
                    <div style={{ width: '20px', height: '1px', background: isDone ? '#4CAF50' : isActive ? '#1A1A18' : '#D3D1C7' }} />
                  </div>
                  {/* Note box */}
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isDone ? '#E8F5E9' : isActive ? '#F5F2EC' : '#F5F2EC', border: '1px solid ' + (isDone ? '#4CAF50' : isActive ? '#D3D1C7' : '#EDE8DF'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: SERIF, fontSize: '14px', color: isDone ? '#4CAF50' : '#D3D1C7' }}>
                      {noteAtStep?.name ?? '?'}
                    </span>
                  </div>
                </div>
              )
            })}</>
          )}
          </div>
        </div>

        {/* Staff */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid ' + (flash === 'correct' ? '#4CAF50' : flash === 'wrong' ? '#E53935' : '#D3D1C7'), padding: '16px 24px', marginBottom: '24px', overflowX: 'auto', transition: 'border-color 0.15s' }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* Staff lines */}
            {[0,2,4,6,8].map(p => (
              <line key={p} x1={staffLeft} y1={staffTop + p*step} x2={staffLeft + staffWidth} y2={staffTop + p*step} stroke="#1A1A18" strokeWidth="1.2" />
            ))}
            {/* Treble clef */}
            <text x={staffLeft} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
            {/* Notes */}
            {builtNotes.map((note, i) => {
              const key = note.name + note.octave
              const pos = TREBLE_POS[key] ?? TREBLE_POS[note.name.replace('b','') + note.octave]
              if (pos === undefined) return null
              const nx = staffLeft + 68 + i * noteSpacing
              const ny = staffTop + pos * step
              const stemUp = pos >= 4
              const notePitchClass = note.name.replace(/\d+$/, '')
              const acc = ACC_MAP[notePitchClass]
              const isRoot = i === 0
              const color = isRoot ? '#BA7517' : '#4CAF50'

              // Ledger lines
              const ledgers = []
              for (let p = 10; p <= pos; p += 2) ledgers.push(<line key={'lb'+p} x1={nx-10} y1={staffTop+p*step} x2={nx+10} y2={staffTop+p*step} stroke="#1A1A18" strokeWidth="1.2" />)
              for (let p = -2; p >= pos; p -= 2) ledgers.push(<line key={'la'+p} x1={nx-10} y1={staffTop+p*step} x2={nx+10} y2={staffTop+p*step} stroke="#1A1A18" strokeWidth="1.2" />)

              return (
                <g key={i}>
                  {ledgers}
                  {acc && <text x={nx-17} y={ny} fontSize="36" fontFamily="Bravura, serif" fill={color} dominantBaseline="central" textAnchor="middle">{
                  acc === 'double_sharp' ? String.fromCodePoint(0xE263) :
                  acc === 'sharp' ? String.fromCodePoint(0xE262) :
                  acc === 'double_flat' ? String.fromCodePoint(0xE264) :
                  String.fromCodePoint(0xE260)
                }</text>}
                  <text x={nx} y={ny} fontSize="46" fontFamily="Bravura, serif" fill={color} textAnchor="middle" dominantBaseline="central">{String.fromCodePoint(0xE0A4)}</text>
                  <line x1={stemUp ? nx+6 : nx-6} y1={ny} x2={stemUp ? nx+6 : nx-6} y2={stemUp ? ny-38 : ny+38} stroke={color} strokeWidth="1.5" />

                </g>
              )
            })}
          </svg>
        </div>

        {/* Instruction / Step confirmation */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px 24px', marginBottom: '24px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {phase === 'select_root' && (
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#888780' }}>Click any key to choose your starting note.</p>
          )}

          {phase === 'play_note' && currentStep && (
            <div style={{ width: '100%' }}>
              <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', marginBottom: '4px' }}>
                Now play a <strong>{STEP_LABELS[currentStep]}</strong> above <strong>{builtNotes[builtNotes.length-1].name}{builtNotes[builtNotes.length-1].octave}</strong>
              </p>
              {error && <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#E53935', marginTop: '6px' }}>✗ {error}</p>}
            </div>
          )}
          {phase === 'complete' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#4CAF50', marginBottom: '4px' }}>
                  {builtNotes[0]?.name} {SCALE_LABELS[scaleType]} ✓
                </p>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>Scale complete — listen to it play back</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => playScale(builtNotes)}
                  style={{ background: 'transparent', color: '#1A1A18', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '10px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                  ▶ Play
                </button>
                <button onClick={reset}
                  style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                  New Scale
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Piano */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px 24px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780' }}>Piano</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowHint(!showHint)}
                style={{ background: showHint ? '#1A1A18' : 'none', color: showHint ? 'white' : '#888780', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '4px 10px', fontFamily: F, fontSize: '11px', fontWeight: 300, cursor: 'pointer' }}>
                {showHint ? 'Hint On' : 'Hint Off'}
              </button>
              <button onClick={() => setShowNoteNames(!showNoteNames)}
              style={{ background: 'none', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '4px 10px', fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}>
              {showNoteNames ? 'Hide' : 'Show'} Note Names
            </button>
            </div>
          </div>
          <div style={{ position: 'relative', height: KH + 'px', width: WHITE_KEYS.length * KW + 'px' }}>
            {WHITE_KEYS.map((key, i) => (
              <button key={key.name+key.octave} onClick={() => handleKeyClick(key)}
                style={{ position: 'absolute', left: i * KW, top: 0, width: KW - 1, height: KH, background: keyBg(key), border: '1px solid #D3D1C7', borderRadius: '0 0 6px 6px', cursor: 'pointer', zIndex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '6px', transition: 'background 0.1s' }}>
                {showNoteNames && <span style={{ fontSize: '9px', color: '#888780', fontFamily: F }}>{key.name}{key.octave}</span>}
              </button>
            ))}
            {BLACK_KEYS.map(key => (
              <button key={key.name+key.octave} onClick={() => handleKeyClick(key)}
                style={{ position: 'absolute', left: key.whiteIndex * KW + KW - BW/2, top: 0, width: BW, height: BH, background: keyBg(key), borderRadius: '0 0 4px 4px', cursor: 'pointer', zIndex: 2, border: 'none', transition: 'background 0.1s' }}>
              </button>
            ))}
          </div>
        </div>

        {/* Show/hide toggle */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>
            Reset
          </button>
        </div>

      </div>
    </div>
  )
}

import { describe, test, expect } from 'vitest'
import { detectChord } from '../chordDetection'

describe('detectChord in C major', () => {
  test('C major triad', () => {
    expect(detectChord({ midiNotes: [60, 64, 67], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'C', romanNumeral: 'I' })
  })

  test('Cmaj7 root position', () => {
    expect(detectChord({ midiNotes: [60, 64, 67, 71], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'Cmaj7', romanNumeral: 'IM7', inversion: 0 })
  })

  test('Cmaj7 first inversion', () => {
    expect(detectChord({ midiNotes: [64, 67, 71, 72], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'Cmaj7/E', inversion: 1 })
  })

  test('G7 spells with B natural in C major', () => {
    expect(detectChord({ midiNotes: [55, 59, 62, 65], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'G7', spelledNotes: ['G', 'B', 'D', 'F'] })
  })

  test('Bb spelled correctly in C major (not A#)', () => {
    expect(detectChord({ midiNotes: [58, 62, 65], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'Bb', spelledNotes: ['Bb', 'D', 'F'] })
  })

  test('F#dim in C major has no roman numeral', () => {
    expect(detectChord({ midiNotes: [54, 57, 60], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'F#dim', romanNumeral: null })
  })

  test('cluster detection', () => {
    expect(detectChord({ midiNotes: [60, 61, 62, 63], currentKey: 'C major' }))
      .toMatchObject({ isCluster: true, chordName: null })
  })

  test('single note returns spelled note', () => {
    expect(detectChord({ midiNotes: [60], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'C', confidence: 'low' })
  })

  test('interval (two notes)', () => {
    expect(detectChord({ midiNotes: [60, 67], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'C + G (P5)', confidence: 'medium' })
  })
})

describe('detectChord respects key context for spelling', () => {
  test('MIDI 61 is Db in C major', () => {
    expect(detectChord({ midiNotes: [61, 65, 68], currentKey: 'C major' }))
      .toMatchObject({ spelledNotes: ['Db', 'F', 'Ab'] })
  })

  test('MIDI 61 is C# in D major', () => {
    // C# major triad spelled in D major: C# (diatonic), pc 5 = F, pc 8 = G#
    expect(detectChord({ midiNotes: [61, 65, 68], currentKey: 'D major' }))
      .toMatchObject({ spelledNotes: ['C#', 'F', 'G#'] })
  })
})

describe('detectChord in A minor', () => {
  test('E major (harmonic minor V) gets roman numeral V', () => {
    expect(detectChord({ midiNotes: [52, 56, 59], currentKey: 'A minor' }))
      .toMatchObject({ chordName: 'E', romanNumeral: 'V' })
  })

  test('Am tonic gets i', () => {
    expect(detectChord({ midiNotes: [57, 60, 64], currentKey: 'A minor' }))
      .toMatchObject({ chordName: 'Am', romanNumeral: 'i' })
  })
})

describe('detectChord edge cases', () => {
  test('C-E-G with G in bass → C/G (root-in-bass bonus avoids weird names)', () => {
    expect(detectChord({ midiNotes: [55, 60, 64], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'C/G', inversion: 2 })
  })

  test('C augmented prefers lowest pitch class as root', () => {
    expect(detectChord({ midiNotes: [60, 64, 68], currentKey: 'C major' }))
      .toMatchObject({ chordName: 'Caug' })
  })

  test('empty input returns empty result', () => {
    expect(detectChord({ midiNotes: [], currentKey: 'C major' }))
      .toMatchObject({ chordName: null, isCluster: false, spelledNotes: [] })
  })

  test('seven-plus unique pitch classes is treated as cluster', () => {
    expect(detectChord({
      midiNotes: [60, 62, 64, 65, 67, 69, 71, 73],
      currentKey: 'C major',
    }))
      .toMatchObject({ isCluster: true, chordName: null })
  })
})

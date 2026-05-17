import { describe, test, expect } from 'vitest'
import { midiToVexFlowKey } from '../midiToVexFlow'

describe('midiToVexFlowKey', () => {
  test('middle C', () => {
    expect(midiToVexFlowKey({ midi: 60, letter: 'C' }))
      .toEqual({ key: 'c/4', accidental: null })
  })

  test('C# above middle C', () => {
    expect(midiToVexFlowKey({ midi: 61, letter: 'C#' }))
      .toEqual({ key: 'c#/4', accidental: '#' })
  })

  test('Db above middle C (enharmonic of C#)', () => {
    expect(midiToVexFlowKey({ midi: 61, letter: 'Db' }))
      .toEqual({ key: 'db/4', accidental: 'b' })
  })

  test('Cb octave correction (MIDI 59 spelled Cb → cb/4 not cb/3)', () => {
    expect(midiToVexFlowKey({ midi: 59, letter: 'Cb' }))
      .toEqual({ key: 'cb/4', accidental: 'b' })
  })

  test('B# octave correction (MIDI 60 spelled B# → b#/3 not b#/4)', () => {
    expect(midiToVexFlowKey({ midi: 60, letter: 'B#' }))
      .toEqual({ key: 'b#/3', accidental: '#' })
  })

  test('double sharp', () => {
    expect(midiToVexFlowKey({ midi: 62, letter: 'C##' }))
      .toEqual({ key: 'c##/4', accidental: '##' })
  })

  test('double flat Cbb (MIDI 58 spelled Cbb → cbb/4)', () => {
    expect(midiToVexFlowKey({ midi: 58, letter: 'Cbb' }))
      .toEqual({ key: 'cbb/4', accidental: 'bb' })
  })

  test('double sharp B## (MIDI 61 spelled B## → b##/3)', () => {
    expect(midiToVexFlowKey({ midi: 61, letter: 'B##' }))
      .toEqual({ key: 'b##/3', accidental: '##' })
  })

  test('low B (MIDI 47)', () => {
    expect(midiToVexFlowKey({ midi: 47, letter: 'B' }))
      .toEqual({ key: 'b/2', accidental: null })
  })

  test('high F#5', () => {
    expect(midiToVexFlowKey({ midi: 78, letter: 'F#' }))
      .toEqual({ key: 'f#/5', accidental: '#' })
  })

  test('unicode ♯ is accepted', () => {
    expect(midiToVexFlowKey({ midi: 61, letter: 'C♯' }))
      .toEqual({ key: 'c#/4', accidental: '#' })
  })

  test('unicode ♭ is accepted', () => {
    expect(midiToVexFlowKey({ midi: 58, letter: 'B♭' }))
      .toEqual({ key: 'bb/3', accidental: 'b' })
  })
})

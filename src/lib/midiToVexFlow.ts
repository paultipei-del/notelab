/**
 * Convert a (spelled letter, MIDI number) pair into a VexFlow note key.
 *
 * VexFlow expects keys in the form `"<letter><accidental?>/<octave>"`, e.g.
 * `"c/4"`, `"f#/5"`, `"bb/3"`. The trickiest part is OCTAVE BOUNDARY
 * correction: enharmonic spellings that cross an octave line need their
 * octave nudged so the staff position matches the letter.
 *
 *   MIDI 59 by default = B3, but spelled "Cb" it sits on the C line of
 *   octave 4 → `"cb/4"`.
 *   MIDI 60 by default = C4, but spelled "B#" it sits on the B line of
 *   octave 3 → `"b#/3"`.
 *
 * Double accidentals (Cbb, B##) are similarly corrected.
 */

export type SpelledNote = {
  letter: string   // "C", "F#", "Bb", "C##", "Cbb"
  midi: number     // 0–127
}

export type VexFlowKey = {
  key: string             // "c/4", "f#/5", "bb/3"
  accidental: string | null // "", "#", "b", "##", "bb" (null when natural)
}

export function midiToVexFlowKey(spelled: SpelledNote): VexFlowKey {
  const letterChar = spelled.letter[0].toLowerCase()
  const accidental = spelled.letter
    .slice(1)
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')

  // Default MIDI → octave mapping: MIDI 60 = C4, so octave = floor(midi/12) - 1
  let octave = Math.floor(spelled.midi / 12) - 1

  // Boundary corrections. Cb / Cbb sit on the C line of the NEXT octave up
  // enharmonically; B# / B## sit on the B line of the PREVIOUS octave.
  if (letterChar === 'c' && (accidental === 'b' || accidental === 'bb')) {
    octave += 1
  }
  if (letterChar === 'b' && (accidental === '#' || accidental === '##')) {
    octave -= 1
  }

  return {
    key: `${letterChar}${accidental}/${octave}`,
    accidental: accidental === '' ? null : accidental,
  }
}

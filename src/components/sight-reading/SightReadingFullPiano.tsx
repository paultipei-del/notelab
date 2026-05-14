'use client'

// Two-octave cream-on-cream piano for the Full Piano input mode.
// Renders C4–B5: 14 white keys + 10 black keys. Middle C carries an
// oxblood "C4" label anchored at the bottom of the key. Hover tints
// both colors toward oxblood. Shared between /note-id/[deckId] and
// /note-id/custom — the inline piano JSX that previously lived in
// both files has been consolidated here.
//
// handleAnswer is pitch-class agnostic — clicking either C registers
// the same answer ('C'), same for D, E, etc.

const WHITE_KEYS = [
  'C','D','E','F','G','A','B',
  'C','D','E','F','G','A','B',
]
const BLACK_KEYS = [
  // Octave 1 (C4–B4)
  { note: 'C#', afterWhite: 0 },
  { note: 'D#', afterWhite: 1 },
  { note: 'F#', afterWhite: 3 },
  { note: 'G#', afterWhite: 4 },
  { note: 'A#', afterWhite: 5 },
  // Octave 2 (C5–B5)
  { note: 'C#', afterWhite: 7 },
  { note: 'D#', afterWhite: 8 },
  { note: 'F#', afterWhite: 10 },
  { note: 'G#', afterWhite: 11 },
  { note: 'A#', afterWhite: 12 },
]
const KEY_W = 52
const KEY_H = 144
const BLACK_W = 32
const BLACK_H = 90

interface SightReadingFullPianoProps {
  /** Called with the pitch class of the clicked key (e.g. 'C', 'F#'). */
  onAnswer: (pitchClass: string) => void
}

export default function SightReadingFullPiano({
  onAnswer,
}: SightReadingFullPianoProps) {
  return (
    <div className="nl-sr-piano-scroller">
      <div
        className="nl-sr-piano"
        style={{
          width: WHITE_KEYS.length * KEY_W + 'px',
          height: KEY_H + 'px',
        }}
      >
        {WHITE_KEYS.map((note, i) => (
          <button
            key={`w-${i}`}
            type="button"
            onClick={() => onAnswer(note)}
            className={
              'nl-sr-piano-key nl-sr-piano-key--white' +
              (i === 0 ? ' nl-sr-piano-key--c4' : '')
            }
            style={{
              left: i * KEY_W + 'px',
              width: (KEY_W - 2) + 'px',
              height: KEY_H + 'px',
            }}
          >
            {i === 0 && <span className="nl-sr-piano-key__label">C4</span>}
          </button>
        ))}
        {BLACK_KEYS.map(({ note, afterWhite }, i) => (
          <button
            key={`b-${i}`}
            type="button"
            onClick={() => onAnswer(note)}
            className="nl-sr-piano-key nl-sr-piano-key--black"
            style={{
              left: ((afterWhite + 1) * KEY_W - BLACK_W / 2) + 'px',
              width: BLACK_W + 'px',
              height: BLACK_H + 'px',
            }}
          />
        ))}
      </div>
    </div>
  )
}

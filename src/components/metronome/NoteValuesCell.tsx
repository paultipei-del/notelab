'use client'

import {
  STRAIGHT_NOTE_VALUES,
  MODIFIED_NOTE_VALUES,
  type SubdivisionId,
} from '@/lib/metronomeData'
import NoteValue from './NoteValue'

interface NoteValuesCellProps {
  bpm: number
  subdivision: SubdivisionId
  onSubdivisionChange: (id: SubdivisionId) => void
}

/**
 * Right cell of the reference strip.
 *
 * Desktop: two stacked 4-column grids (straight on top, dotted +
 * triplet below) separated by a hairline divider.
 *
 * Mobile: the `.nl-met-notes__scroller` wrapper becomes a horizontal
 * flex row, the inner `.nl-met-notes__grid` elements collapse via
 * `display: contents`, and the divider is hidden — so all 8 cards
 * flow as one swipeable row. The right edge fades via mask-image to
 * hint that more cards are off-screen.
 */
export default function NoteValuesCell({
  bpm,
  subdivision,
  onSubdivisionChange,
}: NoteValuesCellProps) {
  const oxblood = subdivision !== 'quarter'

  return (
    <div className="nl-met-notes">
      <span className="nl-met-section__eyebrow">
        Note values at {bpm} BPM
      </span>
      <div className="nl-met-notes__scroller">
        <div className="nl-met-notes__grid">
          {STRAIGHT_NOTE_VALUES.map(def => (
            <NoteValue
              key={def.id}
              def={def}
              bpm={bpm}
              active={subdivision === def.id}
              oxblood={oxblood}
              onClick={() =>
                onSubdivisionChange(
                  subdivision === def.id ? 'quarter' : def.id,
                )
              }
            />
          ))}
        </div>
        <div className="nl-met-notes__divider" aria-hidden />
        <div className="nl-met-notes__grid">
          {MODIFIED_NOTE_VALUES.map(def => (
            <NoteValue
              key={def.id}
              def={def}
              bpm={bpm}
              active={subdivision === def.id}
              oxblood={oxblood}
              onClick={() =>
                onSubdivisionChange(
                  subdivision === def.id ? 'quarter' : def.id,
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

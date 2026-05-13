'use client'

import type { SubdivisionId } from '@/lib/metronomeData'
import TempoRangeCell from './TempoRangeCell'
import NoteValuesCell from './NoteValuesCell'

interface ReferenceStripProps {
  bpm: number
  subdivision: SubdivisionId
  onSubdivisionChange: (id: SubdivisionId) => void
}

/**
 * Bottom strip of /metronome. Two cells: Tempo range on the left,
 * Note values on the right. Sized `flex: 0 0 auto` inside the page's
 * flex column so the MetronomeStage can centre in the remaining
 * height.
 */
export default function ReferenceStrip({
  bpm,
  subdivision,
  onSubdivisionChange,
}: ReferenceStripProps) {
  return (
    <section className="nl-met-strip">
      <TempoRangeCell bpm={bpm} />
      <NoteValuesCell
        bpm={bpm}
        subdivision={subdivision}
        onSubdivisionChange={onSubdivisionChange}
      />
    </section>
  )
}

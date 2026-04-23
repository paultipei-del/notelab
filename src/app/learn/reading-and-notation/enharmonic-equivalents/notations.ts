// Two examples for the enharmonic-equivalents page:
//   1) The five common enharmonic pairs on a single staff, 10 quarter
//      notes total: C♯-D♭, D♯-E♭, F♯-G♭, G♯-A♭, A♯-B♭.
//   2) Two whole notes in E major — first spelled as C♯ (no accidental
//      shown, handled by the key signature), then as D♭ (explicit flat
//      accidental). Same sounding pitch; different spelling; very
//      different reading load.

// --- Enharmonic pairs ---

type Pair = { sharp: { step: string; alter: 1 }; flat: { step: string; alter: -1 } }

const PAIRS: Pair[] = [
  { sharp: { step: 'C', alter: 1 }, flat: { step: 'D', alter: -1 } },
  { sharp: { step: 'D', alter: 1 }, flat: { step: 'E', alter: -1 } },
  { sharp: { step: 'F', alter: 1 }, flat: { step: 'G', alter: -1 } },
  { sharp: { step: 'G', alter: 1 }, flat: { step: 'A', alter: -1 } },
  { sharp: { step: 'A', alter: 1 }, flat: { step: 'B', alter: -1 } },
]

function pairNoteXml(n: { step: string; alter: 1 | -1 }): string {
  const acc = n.alter === 1 ? 'sharp' : 'flat'
  return `      <note>
        <pitch><step>${n.step}</step><alter>${n.alter}</alter><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>${acc}</accidental>
      </note>`
}

// Flatten pairs into [sharp, flat, sharp, flat, ...] — 10 quarter notes
const PAIR_NOTES = PAIRS.flatMap(p => [p.sharp, p.flat])

function slice(start: number, count: number): string {
  return PAIR_NOTES.slice(start, start + count).map(pairNoteXml).join('\n')
}

const TWO_REST_QUARTERS = `      <note>
        <rest/>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>`

export const ENHARMONIC_PAIRS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${slice(0, 4)}
    </measure>
    <measure number="2">
${slice(4, 4)}
    </measure>
    <measure number="3">
${slice(8, 2)}
${TWO_REST_QUARTERS}
    </measure>
  </part>
</score-partwise>`

// --- C♯ in E major, then D♭ in E major ---
//
// Both notes sound identical (both are the pitch one half step below D).
// Measure 1's C♯5 inherits its sharp from the E major key signature, so no
// accidental is drawn. Measure 2's D♭5 requires an explicit flat plus the
// engine's implicit cancellation of the key signature's D♯ expectation —
// that's the "awkward" reading the content calls out.

export const C_SHARP_VS_D_FLAT_IN_E_MAJOR_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>4</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><alter>1</alter><octave>5</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>D</step><alter>-1</alter><octave>5</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <accidental>flat</accidental>
      </note>
    </measure>
  </part>
</score-partwise>`

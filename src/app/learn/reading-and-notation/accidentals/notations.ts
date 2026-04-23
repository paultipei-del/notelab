// Two examples for the accidentals page:
//   1) Five whole notes, one per measure, demonstrating each accidental
//      type (sharp, flat, natural, double sharp, double flat) on the same
//      A pitch so the reader can focus on the symbol rather than the
//      pitch movement.
//   2) A one-measure phrase showing a sharp canceled by a natural within
//      the same measure (F♯ → F♮ → F → G).

// --- Five accidentals ---

type AccidentalKind = 'sharp' | 'flat' | 'natural' | 'double-sharp' | 'flat-flat'

function alter(kind: AccidentalKind): number {
  switch (kind) {
    case 'sharp':        return 1
    case 'flat':         return -1
    case 'natural':      return 0
    case 'double-sharp': return 2
    case 'flat-flat':    return -2
  }
}

function aWholeWithAccidental(kind: AccidentalKind): string {
  const a = alter(kind)
  const alterTag = a !== 0 ? `<alter>${a}</alter>` : ''
  return `      <note>
        <pitch><step>A</step>${alterTag}<octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <accidental>${kind}</accidental>
      </note>`
}

const ACCIDENTAL_ORDER: AccidentalKind[] = ['sharp', 'flat', 'natural', 'double-sharp', 'flat-flat']

export const FIVE_ACCIDENTALS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
${ACCIDENTAL_ORDER.map((k, i) => {
  const attrs = i === 0
    ? `      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>\n`
    : ''
  return `    <measure number="${i + 1}">
${attrs}${aWholeWithAccidental(k)}
    </measure>`
}).join('\n')}
  </part>
</score-partwise>`

// --- Natural canceling a sharp in the same measure ---
// Quarter notes: F♯4, F♮4, F4 (stays natural by persistence), G4.

export const NATURAL_CANCELS_SHARP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
      <note>
        <pitch><step>F</step><alter>1</alter><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>sharp</accidental>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>natural</accidental>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`

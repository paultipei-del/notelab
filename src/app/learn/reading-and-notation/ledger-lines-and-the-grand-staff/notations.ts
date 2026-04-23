// Two small notation examples for this page: a progression of ledger-line
// notes on treble clef, and a grand staff with middle C shown between
// treble and bass staves.

// Four whole notes at increasing heights: middle C (1 ledger below),
// A5 (1 ledger above), C6 (2 ledgers above), E6 (3 ledgers above).
function wholeNote(step: string, octave: number): string {
  return `      <note>
        <pitch><step>${step}</step><octave>${octave}</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>`
}

export const LEDGER_LINE_PROGRESSION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${wholeNote('C', 4)}
    </measure>
    <measure number="2">
${wholeNote('A', 5)}
    </measure>
    <measure number="3">
${wholeNote('C', 6)}
    </measure>
    <measure number="4">
${wholeNote('E', 6)}
    </measure>
  </part>
</score-partwise>`

// Grand staff with middle C rendered on the treble side (appearing as the
// ledger line just below the treble staff — which is visually "between" the
// two staves in the grand staff layout). Bass staff holds a whole rest.
export const GRAND_STAFF_MIDDLE_C_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <staff>1</staff>
      </note>
      <backup>
        <duration>4</duration>
      </backup>
      <note>
        <rest measure="yes"/>
        <duration>4</duration>
        <voice>2</voice>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

// C major scale ascending from C4 to C5 — eight quarter notes across two
// 4/4 measures. Demonstrates the seven-letter alphabet walking up the
// treble staff from the first ledger below to the third space.

const SCALE_NOTES: Array<{ step: string; octave: number }> = [
  { step: 'C', octave: 4 },
  { step: 'D', octave: 4 },
  { step: 'E', octave: 4 },
  { step: 'F', octave: 4 },
  { step: 'G', octave: 4 },
  { step: 'A', octave: 4 },
  { step: 'B', octave: 4 },
  { step: 'C', octave: 5 },
]

function noteXml(n: { step: string; octave: number }): string {
  return `      <note>
        <pitch><step>${n.step}</step><octave>${n.octave}</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>`
}

export const C_MAJOR_SCALE_ASCENDING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${SCALE_NOTES.slice(0, 4).map(noteXml).join('\n')}
    </measure>
    <measure number="2">
${SCALE_NOTES.slice(4, 8).map(noteXml).join('\n')}
    </measure>
  </part>
</score-partwise>`

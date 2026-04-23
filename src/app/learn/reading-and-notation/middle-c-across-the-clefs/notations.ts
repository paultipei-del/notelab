// Four parts stacked vertically, each a single staff with one of the four
// clefs and a whole-note middle C. OSMD renders multi-part scores with
// parts stacked top-to-bottom, so declaring parts in order treble → alto →
// tenor → bass produces the stack we want.

function part(id: string, clef: { sign: string; line: string }): string {
  return `  <part id="${id}">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>${clef.sign}</sign><line>${clef.line}</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
  </part>`
}

export const FOUR_CLEFS_STACKED_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
    <score-part id="P2"><part-name></part-name></score-part>
    <score-part id="P3"><part-name></part-name></score-part>
    <score-part id="P4"><part-name></part-name></score-part>
  </part-list>
${part('P1', { sign: 'G', line: '2' })}
${part('P2', { sign: 'C', line: '3' })}
${part('P3', { sign: 'C', line: '4' })}
${part('P4', { sign: 'F', line: '4' })}
</score-partwise>`

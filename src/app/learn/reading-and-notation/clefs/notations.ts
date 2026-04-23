// Four consecutive measures, each with a different clef and a whole-note
// middle C. Shows how the same pitch sits in a different staff position
// depending on the clef. Clef changes are declared via <attributes> at the
// start of each measure after the first.

function measure(num: number, clef: { sign: string; line: string }, attrsOnly = false, firstMeasure = false): string {
  const attrs = `      <attributes>
        ${firstMeasure ? `<divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        ` : ''}<clef><sign>${clef.sign}</sign><line>${clef.line}</line></clef>
      </attributes>`
  const note = `      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>`
  return `    <measure number="${num}">
${attrs}
${note}
    </measure>`
}

export const FOUR_CLEFS_MIDDLE_C_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
${measure(1, { sign: 'G', line: '2' }, false, true)}
${measure(2, { sign: 'F', line: '4' })}
${measure(3, { sign: 'C', line: '3' })}
${measure(4, { sign: 'C', line: '4' })}
  </part>
</score-partwise>`

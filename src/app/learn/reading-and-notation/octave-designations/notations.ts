// Five Cs across a grand staff: C2, C3 on the bass staff; C4, C5, C6 on
// the treble staff. One whole note per measure, five measures total.
// Each C sits in its natural staff position — OSMD can't emit labels
// directly, but the caption identifies each pitch.

function grandStaffWhole(step: string, octave: number, staff: 1 | 2, includeAttrs: boolean): string {
  const voice = staff === 1 ? 1 : 2
  const restVoice = staff === 1 ? 2 : 1
  const restStaff = staff === 1 ? 2 : 1
  const attrs = includeAttrs
    ? `      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>\n`
    : ''
  return `${attrs}      <note>
        <pitch><step>${step}</step><octave>${octave}</octave></pitch>
        <duration>4</duration>
        <voice>${voice}</voice>
        <type>whole</type>
        <staff>${staff}</staff>
      </note>
      <backup>
        <duration>4</duration>
      </backup>
      <note>
        <rest measure="yes"/>
        <duration>4</duration>
        <voice>${restVoice}</voice>
        <staff>${restStaff}</staff>
      </note>`
}

const CS: Array<{ step: string; octave: number; staff: 1 | 2 }> = [
  { step: 'C', octave: 2, staff: 2 },
  { step: 'C', octave: 3, staff: 2 },
  { step: 'C', octave: 4, staff: 1 },
  { step: 'C', octave: 5, staff: 1 },
  { step: 'C', octave: 6, staff: 1 },
]

export const FIVE_CS_GRAND_STAFF_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
${CS.map((c, i) => `    <measure number="${i + 1}">
${grandStaffWhole(c.step, c.octave, c.staff, i === 0)}
    </measure>`).join('\n')}
  </part>
</score-partwise>`

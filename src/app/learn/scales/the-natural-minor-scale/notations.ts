function labeledNote(step: string, octave: number, label: string): string {
  return `      <note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric></note>`
}
function plainNote(step: string, octave: number, alter = 0, accidental: string | null = null): string {
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  const accTag = accidental ? `<accidental>${accidental}</accidental>` : ''
  return `      <note><pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${accTag}</note>`
}

export const A_NATURAL_MINOR_STEPS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key><time print-object="no"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${labeledNote('A', 4, 'W')}
${labeledNote('B', 4, 'H')}
${labeledNote('C', 5, 'W')}
${labeledNote('D', 5, 'W')}
    </measure>
    <measure number="2">
${labeledNote('E', 5, 'H')}
${labeledNote('F', 5, 'W')}
${labeledNote('G', 5, 'W')}
${plainNote('A', 5)}
    </measure>
  </part>
</score-partwise>`

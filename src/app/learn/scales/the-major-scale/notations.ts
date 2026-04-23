// C major ascending with W/H labels, G major ascending with W/H labels.

function labeledNote(step: string, octave: number, alter: number, accidental: string | null, label: string): string {
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  const accTag = accidental ? `<accidental>${accidental}</accidental>` : ''
  return `      <note><pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${accTag}<lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric></note>`
}

function plainNote(step: string, octave: number, alter: number, accidental: string | null): string {
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  const accTag = accidental ? `<accidental>${accidental}</accidental>` : ''
  return `      <note><pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${accTag}</note>`
}

export const C_MAJOR_WITH_STEPS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key><time print-object="no"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${labeledNote('C', 4, 0, null, 'W')}
${labeledNote('D', 4, 0, null, 'W')}
${labeledNote('E', 4, 0, null, 'H')}
${labeledNote('F', 4, 0, null, 'W')}
    </measure>
    <measure number="2">
${labeledNote('G', 4, 0, null, 'W')}
${labeledNote('A', 4, 0, null, 'W')}
${labeledNote('B', 4, 0, null, 'H')}
${plainNote('C', 5, 0, null)}
    </measure>
  </part>
</score-partwise>`

export const G_MAJOR_WITH_STEPS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>1</fifths></key><time print-object="no"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${labeledNote('G', 4, 0, null, 'W')}
${labeledNote('A', 4, 0, null, 'W')}
${labeledNote('B', 4, 0, null, 'H')}
${labeledNote('C', 5, 0, null, 'W')}
    </measure>
    <measure number="2">
${labeledNote('D', 5, 0, null, 'W')}
${labeledNote('E', 5, 0, null, 'W')}
${labeledNote('F', 5, 1, null, 'H')}
${plainNote('G', 5, 0, null)}
    </measure>
  </part>
</score-partwise>`

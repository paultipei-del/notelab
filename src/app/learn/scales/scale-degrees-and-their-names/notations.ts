// C major scale with functional names as lyrics.

function labeledNote(step: string, octave: number, label: string): string {
  return `      <note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric></note>`
}

export const SCALE_DEGREE_NAMES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key><time print-object="no"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${labeledNote('C', 4, 'Tonic')}
${labeledNote('D', 4, 'Super.')}
${labeledNote('E', 4, 'Med.')}
${labeledNote('F', 4, 'Sub.')}
    </measure>
    <measure number="2">
${labeledNote('G', 4, 'Dom.')}
${labeledNote('A', 4, 'Subm.')}
${labeledNote('B', 4, 'LT')}
${labeledNote('C', 5, 'Tonic')}
    </measure>
  </part>
</score-partwise>`

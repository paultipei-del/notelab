// C major scale ascending from C4 to C5 with scale-degree numbers as lyrics.

function scaleNote(step: string, octave: number, label: string): string {
  return `      <note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric></note>`
}

export const C_MAJOR_WITH_DEGREES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name></part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key><time print-object="no"><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${scaleNote('C', 4, '1')}
${scaleNote('D', 4, '2')}
${scaleNote('E', 4, '3')}
${scaleNote('F', 4, '4')}
    </measure>
    <measure number="2">
${scaleNote('G', 4, '5')}
${scaleNote('A', 4, '6')}
${scaleNote('B', 4, '7')}
${scaleNote('C', 5, '8')}
    </measure>
  </part>
</score-partwise>`

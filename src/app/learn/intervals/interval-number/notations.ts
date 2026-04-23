// Seven intervals from C, each shown as a harmonic dyad with its number
// as a lyric label. Demonstrates that interval number is purely a count
// of letter names from the lower to the upper note.

function intervalDyad(upperStep: string, upperOctave: number, label: string): string {
  return `      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric>
      </note>
      <note><chord/><pitch><step>${upperStep}</step><octave>${upperOctave}</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note>`
}

export const SEVEN_INTERVALS_FROM_C_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${intervalDyad('D', 4, '2nd')}
    </measure>
    <measure number="2">
${intervalDyad('E', 4, '3rd')}
    </measure>
    <measure number="3">
${intervalDyad('F', 4, '4th')}
    </measure>
    <measure number="4">
${intervalDyad('G', 4, '5th')}
    </measure>
    <measure number="5">
${intervalDyad('A', 4, '6th')}
    </measure>
    <measure number="6">
${intervalDyad('B', 4, '7th')}
    </measure>
    <measure number="7">
${intervalDyad('C', 5, '8ve')}
    </measure>
  </part>
</score-partwise>`

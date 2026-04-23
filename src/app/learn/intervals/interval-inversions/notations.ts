// Two inversion examples:
//   1) C-G (P5) followed by G-C (P4) — classic inversion pair
//   2) C-E (M3) followed by E-C (m6) — quality flips, number sums to 9

function dyad(lowerStep: string, lowerOctave: number, upperStep: string, upperOctave: number, label: string): string {
  return `      <note>
        <pitch><step>${lowerStep}</step><octave>${lowerOctave}</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric>
      </note>
      <note><chord/><pitch><step>${upperStep}</step><octave>${upperOctave}</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note>`
}

export const FIFTH_AND_INVERSION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${dyad('C', 4, 'G', 4, 'P5')}
    </measure>
    <measure number="2">
${dyad('G', 4, 'C', 5, 'P4')}
    </measure>
  </part>
</score-partwise>`

export const THIRD_AND_INVERSION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${dyad('C', 4, 'E', 4, 'M3')}
    </measure>
    <measure number="2">
${dyad('E', 4, 'C', 5, 'm6')}
    </measure>
  </part>
</score-partwise>`

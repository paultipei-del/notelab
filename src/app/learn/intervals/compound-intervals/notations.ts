// Simple M3 vs compound M10 side by side, then a trio of compound
// intervals (m10, P12, M13) for quick reference.

function dyad(lowerStep: string, lowerOctave: number, upperStep: string, upperOctave: number, alter: number, acc: string | null, label: string): string {
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  const accTag = acc ? `<accidental>${acc}</accidental>` : ''
  return `      <note>
        <pitch><step>${lowerStep}</step><octave>${lowerOctave}</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric>
      </note>
      <note>
        <chord/>
        <pitch><step>${upperStep}</step>${alterTag}<octave>${upperOctave}</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        ${accTag}
      </note>`
}

export const THIRD_VS_TENTH_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${dyad('C', 4, 'E', 4, 0, null, 'M3')}
    </measure>
    <measure number="2">
${dyad('C', 4, 'E', 5, 0, null, 'M10')}
    </measure>
  </part>
</score-partwise>`

export const THREE_COMPOUND_INTERVALS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${dyad('C', 4, 'E', 5, -1, 'flat', 'm10')}
    </measure>
    <measure number="2">
${dyad('C', 4, 'G', 5, 0, null, 'P12')}
    </measure>
    <measure number="3">
${dyad('C', 4, 'A', 5, 0, null, 'M13')}
    </measure>
  </part>
</score-partwise>`

// Six key intervals arranged from maximally consonant to strongly
// dissonant — spanning the spectrum: octave, perfect fifth, major third,
// minor third, major second, tritone.

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

export const CONSONANCE_DISSONANCE_SPECTRUM_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${dyad('C', 4, 'C', 5, 0, null, 'P8')}
    </measure>
    <measure number="2">
${dyad('C', 4, 'G', 4, 0, null, 'P5')}
    </measure>
    <measure number="3">
${dyad('C', 4, 'E', 4, 0, null, 'M3')}
    </measure>
    <measure number="4">
${dyad('C', 4, 'E', 4, -1, 'flat', 'm3')}
    </measure>
    <measure number="5">
${dyad('C', 4, 'D', 4, 0, null, 'M2')}
    </measure>
    <measure number="6">
${dyad('C', 4, 'F', 4, 1, 'sharp', 'TT')}
    </measure>
  </part>
</score-partwise>`

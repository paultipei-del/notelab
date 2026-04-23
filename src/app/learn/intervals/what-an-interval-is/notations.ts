// Two simple examples. First: a single harmonic perfect fifth (C and G
// stacked as whole notes), labeled "P5" via lyric. Second: four harmonic
// intervals in a row — 2nd, 3rd, 5th, 8ve — each stacked and labeled.

function intervalChord(lowerStep: string, upperStep: string, upperOctave: number, label: string): string {
  return `      <note>
        <pitch><step>${lowerStep}</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <lyric number="1">
          <syllabic>single</syllabic>
          <text>${label}</text>
        </lyric>
      </note>
      <note>
        <chord/>
        <pitch><step>${upperStep}</step><octave>${upperOctave}</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>`
}

export const SINGLE_PERFECT_FIFTH_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${intervalChord('C', 'G', 4, 'P5')}
    </measure>
  </part>
</score-partwise>`

export const FOUR_INTERVALS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${intervalChord('C', 'D', 4, '2nd')}
    </measure>
    <measure number="2">
${intervalChord('C', 'E', 4, '3rd')}
    </measure>
    <measure number="3">
${intervalChord('C', 'G', 4, '5th')}
    </measure>
    <measure number="4">
${intervalChord('C', 'C', 5, '8ve')}
    </measure>
  </part>
</score-partwise>`

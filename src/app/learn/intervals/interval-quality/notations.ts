// Progression of thirds from C, showing how quality changes the size of
// an interval while the number stays the same. All four are "thirds"
// because they span three letter names (C, D, E), but each has a
// different quality: major, minor, diminished, augmented.

function thirdDyad(alter: -2 | -1 | 0 | 1, accidental: string | null, label: string): string {
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  const accTag = accidental ? `<accidental>${accidental}</accidental>` : ''
  return `      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <lyric number="1"><syllabic>single</syllabic><text>${label}</text></lyric>
      </note>
      <note>
        <chord/>
        <pitch><step>E</step>${alterTag}<octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        ${accTag}
      </note>`
}

export const FOUR_THIRDS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${thirdDyad(0, null, 'M3')}
    </measure>
    <measure number="2">
${thirdDyad(-1, 'flat', 'm3')}
    </measure>
    <measure number="3">
${thirdDyad(-2, 'flat-flat', 'dim 3')}
    </measure>
    <measure number="4">
${thirdDyad(1, 'sharp', 'aug 3')}
    </measure>
  </part>
</score-partwise>`

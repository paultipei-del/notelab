// Four Cs stacked vertically across a grand staff — C2 and C3 on the bass
// staff (voice 2), C4 and C5 on the treble staff (voice 1). All four sound
// simultaneously so the "same note at four octaves" visual reads at a glance.

export const FOUR_CS_STACKED_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <staff>1</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        <staff>1</staff>
      </note>
      <backup>
        <duration>4</duration>
      </backup>
      <note>
        <pitch><step>C</step><octave>2</octave></pitch>
        <duration>4</duration>
        <voice>2</voice>
        <type>whole</type>
        <staff>2</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <voice>2</voice>
        <type>whole</type>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

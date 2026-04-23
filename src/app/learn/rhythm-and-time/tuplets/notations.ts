// Two tuplet examples. Divisions=12 lets both fit as integers — quarter=12,
// eighth=6, triplet-eighth=4, dotted-quarter=18, duplet-eighth=9.

// 4/4 with quarter, eighth triplet (on beat 2), quarter, quarter.
export const TRIPLET_IN_QUARTER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>12</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>12</duration><voice>1</voice><type>quarter</type></note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>
        <beam number="1">begin</beam>
        <notations><tuplet type="start" number="1"/></notations>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>
        <beam number="1">continue</beam>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>
        <beam number="1">end</beam>
        <notations><tuplet type="stop" number="1"/></notations>
      </note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>12</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>12</duration><voice>1</voice><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`

// 6/8 with a dotted-quarter filling beat 1, a duplet on beat 2.
export const DUPLET_IN_SIX_EIGHT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>12</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>6</beats><beat-type>8</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>18</duration>
        <voice>1</voice>
        <type>quarter</type>
        <dot/>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>9</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification><actual-notes>2</actual-notes><normal-notes>3</normal-notes></time-modification>
        <beam number="1">begin</beam>
        <notations><tuplet type="start" number="1"/></notations>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>9</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification><actual-notes>2</actual-notes><normal-notes>3</normal-notes></time-modification>
        <beam number="1">end</beam>
        <notations><tuplet type="stop" number="1"/></notations>
      </note>
    </measure>
  </part>
</score-partwise>`

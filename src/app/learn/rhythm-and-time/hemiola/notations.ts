// Two pairs of 3/4 measures. First pair accents beat 1 of each measure
// (standard triple feel). Second pair accents every other quarter note
// across the two measures (hemiola — implies duple meter).

function quarter(accented: boolean): string {
  const acc = accented
    ? '<notations><articulations><accent/></articulations></notations>'
    : ''
  return `      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type>${acc}</note>`
}

export const STANDARD_THREE_FOUR_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <time><beats>3</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${quarter(true)}
${quarter(false)}
${quarter(false)}
    </measure>
    <measure number="2">
${quarter(true)}
${quarter(false)}
${quarter(false)}
    </measure>
  </part>
</score-partwise>`

// Across two 3/4 measures (six quarter notes total), accents on 1, 3, 5 —
// implying a 2+2+2 duple grouping over what's notated as 3+3.
export const HEMIOLA_THREE_FOUR_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <time><beats>3</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${quarter(true)}
${quarter(false)}
${quarter(true)}
    </measure>
    <measure number="2">
${quarter(false)}
${quarter(true)}
${quarter(false)}
    </measure>
  </part>
</score-partwise>`

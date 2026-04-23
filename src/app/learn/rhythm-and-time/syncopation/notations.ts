// Standard-accent 4/4 vs. syncopated 4/4 — shows how shifting accents to
// weak beats / offbeats creates the syncopated feel.

function accentedQuarter(accented: boolean): string {
  const acc = accented
    ? '<notations><articulations><accent/></articulations></notations>'
    : ''
  return `      <note><pitch><step>B</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type>${acc}</note>`
}

function eighthWithAccent(beamRole: 'begin' | 'continue' | 'end', accented: boolean): string {
  const acc = accented
    ? '<notations><articulations><accent/></articulations></notations>'
    : ''
  return `      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type><beam number="1">${beamRole}</beam>${acc}</note>`
}

export const STANDARD_ACCENTS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${accentedQuarter(true)}
${accentedQuarter(false)}
${accentedQuarter(true)}
${accentedQuarter(false)}
    </measure>
  </part>
</score-partwise>`

// Eight eighth notes. Accents on the 4th and 8th (the "and" of 2 and
// the "and" of 4 — the offbeats that pull the ear off the main beat).
export const SYNCOPATED_ACCENTS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${eighthWithAccent('begin', false)}
${eighthWithAccent('end', false)}
${eighthWithAccent('begin', false)}
${eighthWithAccent('end', true)}
${eighthWithAccent('begin', false)}
${eighthWithAccent('end', false)}
${eighthWithAccent('begin', false)}
${eighthWithAccent('end', true)}
    </measure>
  </part>
</score-partwise>`

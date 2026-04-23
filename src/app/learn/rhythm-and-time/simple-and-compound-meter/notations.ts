// Two comparisons: 3/4 vs 6/8 (both six eighths, grouped differently);
// and 4/4 vs 12/8 (simple-quadruple vs compound-quadruple).

function eighth(beamRole: 'begin' | 'continue' | 'end'): string {
  return `      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>eighth</type><beam number="1">${beamRole}</beam></note>`
}

function beamGroup(size: 2 | 3): string {
  if (size === 2) return [eighth('begin'), eighth('end')].join('\n')
  return [eighth('begin'), eighth('continue'), eighth('end')].join('\n')
}

// 3/4 meter: 6 eighths grouped 2+2+2. 6/8 meter: 6 eighths grouped 3+3.
export const THREE_FOUR_VS_SIX_EIGHT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${beamGroup(2)}
${beamGroup(2)}
${beamGroup(2)}
    </measure>
    <measure number="2">
      <attributes><time><beats>6</beats><beat-type>8</beat-type></time></attributes>
${beamGroup(3)}
${beamGroup(3)}
    </measure>
  </part>
</score-partwise>`

// 4/4: 8 eighths grouped 2+2+2+2. 12/8: 12 eighths grouped 3+3+3+3.
export const FOUR_FOUR_VS_TWELVE_EIGHT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${beamGroup(2)}
${beamGroup(2)}
${beamGroup(2)}
${beamGroup(2)}
    </measure>
    <measure number="2">
      <attributes><time><beats>12</beats><beat-type>8</beat-type></time></attributes>
${beamGroup(3)}
${beamGroup(3)}
${beamGroup(3)}
${beamGroup(3)}
    </measure>
  </part>
</score-partwise>`

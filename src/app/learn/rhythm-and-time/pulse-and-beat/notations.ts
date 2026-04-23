// Four evenly spaced quarter notes in 4/4 on a treble staff, with beat
// numbers (1, 2, 3, 4) attached as lyrics beneath. OSMD renders <lyric>
// elements below the staff, giving us per-note labels without hacks.

function beatNote(pitch: { step: string; octave: number }, beat: number): string {
  return `      <note>
        <pitch><step>${pitch.step}</step><octave>${pitch.octave}</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <lyric number="1">
          <syllabic>single</syllabic>
          <text>${beat}</text>
        </lyric>
      </note>`
}

export const FOUR_BEATS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${[1, 2, 3, 4].map(b => beatNote({ step: 'B', octave: 4 }, b)).join('\n')}
    </measure>
  </part>
</score-partwise>`

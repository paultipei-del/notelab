// One octave of the chromatic scale ascending from C4 to C5, spelled with
// sharps on the ascending form. 13 notes distributed as 4 + 4 + 4 + 1 across
// four 4/4 measures (final measure has a 3-beat rest after the terminal C).

type ChromaticNote = {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  octave: number
  sharp?: boolean
}

const CHROMATIC_ASCENDING: ChromaticNote[] = [
  { step: 'C', octave: 4 },
  { step: 'C', octave: 4, sharp: true },
  { step: 'D', octave: 4 },
  { step: 'D', octave: 4, sharp: true },
  { step: 'E', octave: 4 },
  { step: 'F', octave: 4 },
  { step: 'F', octave: 4, sharp: true },
  { step: 'G', octave: 4 },
  { step: 'G', octave: 4, sharp: true },
  { step: 'A', octave: 4 },
  { step: 'A', octave: 4, sharp: true },
  { step: 'B', octave: 4 },
  { step: 'C', octave: 5 },
]

function noteXml(n: ChromaticNote): string {
  const pitch = `<step>${n.step}</step>${n.sharp ? '<alter>1</alter>' : ''}<octave>${n.octave}</octave>`
  const acc = n.sharp ? '<accidental>sharp</accidental>' : ''
  return `      <note>
        <pitch>${pitch}</pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        ${acc}
      </note>`
}

function notesSlice(start: number, count: number): string {
  return CHROMATIC_ASCENDING.slice(start, start + count).map(noteXml).join('\n')
}

const REST_BEATS_3 = `      <note>
        <rest/>
        <duration>3</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>`

export const CHROMATIC_SCALE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
${notesSlice(0, 4)}
    </measure>
    <measure number="2">
${notesSlice(4, 4)}
    </measure>
    <measure number="3">
${notesSlice(8, 4)}
    </measure>
    <measure number="4">
${notesSlice(12, 1)}
${REST_BEATS_3}
    </measure>
  </part>
</score-partwise>`

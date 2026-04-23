// First 8 overtones of a C fundamental, rendered one octave above the
// frequencies discussed in the prose (C3 → C6 instead of C2 → C5). The upward
// shift keeps every note on or near the treble staff; the content text still
// refers to C2 as the physical fundamental. Shape is what matters here —
// octave, fifth, fourth, third, third, minor third — not the register.

type OvertoneNote = {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  octave: number
  alter?: -1 | 0 | 1 // -1 flat, 1 sharp
  accidental?: 'flat' | 'natural' | 'sharp'
}

// TODO: verify preview — the 7th partial (Bb) is actually a bit flat of true Bb
// in just intonation. The content text acknowledges this; the notation shows
// conventional Bb without a microtonal inflection, which OSMD can't render.
const OVERTONES_1_TO_8: OvertoneNote[] = [
  { step: 'C', octave: 3 },                                          // 1 — fundamental
  { step: 'C', octave: 4 },                                          // 2 — octave
  { step: 'G', octave: 4 },                                          // 3 — fifth
  { step: 'C', octave: 5 },                                          // 4 — octave
  { step: 'E', octave: 5 },                                          // 5 — major third
  { step: 'G', octave: 5 },                                          // 6 — fifth
  { step: 'B', octave: 5, alter: -1, accidental: 'flat' },           // 7 — flat-ish 7th
  { step: 'C', octave: 6 },                                          // 8 — octave
]

function noteXml(n: OvertoneNote, measure: 1 | 2): string {
  const pitch = `<step>${n.step}</step>${n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.octave}</octave>`
  const acc = n.accidental ? `<accidental>${n.accidental}</accidental>` : ''
  return `      <note>
        <pitch>${pitch}</pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        ${acc}
      </note>`
}

function measureXml(number: 1 | 2, includeAttributes: boolean): string {
  const notes = OVERTONES_1_TO_8.slice((number - 1) * 4, number * 4)
  const attrs = includeAttributes
    ? `      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>\n`
    : ''
  return `    <measure number="${number}">
${attrs}${notes.map(n => noteXml(n, number)).join('\n')}
    </measure>`
}

export const OVERTONE_SERIES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
${measureXml(1, true)}
${measureXml(2, false)}
  </part>
</score-partwise>`

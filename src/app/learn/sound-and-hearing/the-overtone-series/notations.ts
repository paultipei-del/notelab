// First 16 overtones of a C2 fundamental, rendered on a grand staff.
// Measure 1 stays on the bass staff (C2, C3, G3, C4); measures 2-4 live
// entirely on the treble staff (E4 through C6). Each measure uses two
// voices — voice 1 on the treble staff, voice 2 on the bass — with the
// silent voice emitting a whole rest so OSMD aligns the measure cleanly.
//
// Conventional Western spelling used for every pitch. The 7th partial B♭,
// the 11th partial F♯, and the 14th partial B♭ are all slightly flat of
// their nominal equal-temperament equivalents in pure just intonation —
// the prose discusses this; the notation can't show microtonal inflection.
// TODO: verify rendering — grand-staff voice-alignment with <backup> can
// behave differently across OSMD versions; inspect in browser on deploy.

type Overtone = {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  octave: number
  alter?: -1 | 1
  accidental?: 'flat' | 'sharp'
  staff: 1 | 2 // 1 = treble, 2 = bass
}

const OVERTONES: Overtone[] = [
  { step: 'C', octave: 2, staff: 2 },                                       // 1 — fundamental
  { step: 'C', octave: 3, staff: 2 },                                       // 2 — octave
  { step: 'G', octave: 3, staff: 2 },                                       // 3 — P5
  { step: 'C', octave: 4, staff: 2 },                                       // 4 — octave
  { step: 'E', octave: 4, staff: 1 },                                       // 5 — M3
  { step: 'G', octave: 4, staff: 1 },                                       // 6 — P5
  { step: 'B', octave: 4, alter: -1, accidental: 'flat', staff: 1 },        // 7 — ~m7
  { step: 'C', octave: 5, staff: 1 },                                       // 8 — octave
  { step: 'D', octave: 5, staff: 1 },                                       // 9 — M2
  { step: 'E', octave: 5, staff: 1 },                                       // 10 — M3
  { step: 'F', octave: 5, alter: 1, accidental: 'sharp', staff: 1 },        // 11 — ~A4
  { step: 'G', octave: 5, staff: 1 },                                       // 12 — P5
  { step: 'A', octave: 5, staff: 1 },                                       // 13 — M6
  { step: 'B', octave: 5, alter: -1, accidental: 'flat', staff: 1 },        // 14 — ~m7
  { step: 'B', octave: 5, staff: 1 },                                       // 15 — M7
  { step: 'C', octave: 6, staff: 1 },                                       // 16 — octave
]

function noteXml(n: Overtone, voice: 1 | 2): string {
  const pitch = `<step>${n.step}</step>${n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.octave}</octave>`
  const acc = n.accidental ? `<accidental>${n.accidental}</accidental>` : ''
  return `      <note>
        <pitch>${pitch}</pitch>
        <duration>1</duration>
        <voice>${voice}</voice>
        <type>quarter</type>
        ${acc}
        <staff>${n.staff}</staff>
      </note>`
}

function restFullMeasure(voice: 1 | 2, staff: 1 | 2): string {
  return `      <note>
        <rest measure="yes"/>
        <duration>4</duration>
        <voice>${voice}</voice>
        <staff>${staff}</staff>
      </note>`
}

const BACKUP_FULL = `      <backup>
        <duration>4</duration>
      </backup>`

// Each measure holds 4 notes. Measure 1's notes are all staff 2 (bass);
// measures 2-4 are all staff 1 (treble). Voice 1 plays treble notes, voice
// 2 plays bass notes; the silent voice emits a whole rest so the measure
// durations line up.
function measure(index: number, includeAttributes: boolean): string {
  const slice = OVERTONES.slice(index * 4, (index + 1) * 4)
  const hasBass = slice.some(n => n.staff === 2)
  const hasTreble = slice.some(n => n.staff === 1)

  const attrs = includeAttributes
    ? `      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time print-object="no"><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>\n`
    : ''

  // Voice 1 first (treble).
  const v1 = hasTreble
    ? slice.filter(n => n.staff === 1).map(n => noteXml(n, 1)).join('\n')
    : restFullMeasure(1, 1)
  // Voice 2 (bass).
  const v2 = hasBass
    ? slice.filter(n => n.staff === 2).map(n => noteXml(n, 2)).join('\n')
    : restFullMeasure(2, 2)

  return `    <measure number="${index + 1}">
${attrs}${v1}
${BACKUP_FULL}
${v2}
    </measure>`
}

export const OVERTONE_SERIES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
${measure(0, true)}
${measure(1, false)}
${measure(2, false)}
${measure(3, false)}
  </part>
</score-partwise>`

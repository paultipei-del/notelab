// MusicXML string constants for the five key-signature previews used on this
// page. Each is a single 4/4 measure with a treble clef, the key signature of
// interest, and a measure rest (OSMD expects at least one note per measure).
// No title, composer, or part-name elements so OSMD renders cleanly.

const KEY_SIGNATURE_TEMPLATE = (fifths: number): string => `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name></part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>${fifths}</fifths>
          <mode>major</mode>
        </key>
        <time print-object="no">
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <rest measure="yes"/>
        <duration>4</duration>
        <voice>1</voice>
      </note>
    </measure>
  </part>
</score-partwise>`

// Fifths convention: positive = sharps, negative = flats, 0 = none.
export const C_MAJOR_XML      = KEY_SIGNATURE_TEMPLATE(0)
export const G_MAJOR_XML      = KEY_SIGNATURE_TEMPLATE(1)
export const D_MAJOR_XML      = KEY_SIGNATURE_TEMPLATE(2)
export const F_MAJOR_XML      = KEY_SIGNATURE_TEMPLATE(-1)
export const B_FLAT_MAJOR_XML = KEY_SIGNATURE_TEMPLATE(-2)

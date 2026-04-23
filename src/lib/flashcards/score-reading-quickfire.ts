import { Card } from '../types'

// Score Reading Quickfire — Application & Review / Applied Reading
// Rapid-fire identification of score-surface features (clef, key, meter,
// tempo, dynamic, articulation) in a single prompt.
export const SCORE_READING_QUICKFIRE_CARDS: Card[] = [
  {
    id: 1,
    type: 'text',
    front:
      'A 2-measure excerpt: bass clef, 3 flats in key signature, 3/4 time, marked "Andante, p", first chord is E♭ major triad with staccato dots on all three notes.\n\n1. What clef?\n2. What key signature?\n3. What time signature?\n4. What tempo marking?\n5. What dynamic?\n6. What articulation on the first chord?',
    back:
      '1. Bass clef.\n2. Three flats — E♭ major or C minor.\n3. 3/4 (simple triple).\n4. Andante ("walking," moderately slow).\n5. Piano (soft).\n6. Staccato (short, detached).',
  },
  {
    id: 2,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, 2 sharps, 6/8 time, marked "Allegro, ff", a series of eighth notes with a slur spanning all six notes.\n\n1. What clef?\n2. What key signature?\n3. What time signature?\n4. What tempo marking?\n5. What dynamic?\n6. What articulation applies to the six eighth notes?',
    back:
      '1. Treble clef.\n2. Two sharps — D major or B minor.\n3. 6/8 (compound duple — two dotted-quarter beats).\n4. Allegro (fast, lively).\n5. Fortissimo (very loud).\n6. Legato (slurred — played smoothly connected, without separation).',
  },
  {
    id: 3,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, 4 sharps, common time (C), marked "Adagio espressivo, pp", ends with a fermata over a whole note.\n\n1. What clef?\n2. What key signature?\n3. What time signature?\n4. What is the character of the tempo marking?\n5. What dynamic?\n6. What does the fermata indicate?',
    back:
      '1. Treble clef.\n2. Four sharps — E major or C♯ minor.\n3. Common time (4/4).\n4. Adagio espressivo — slow and expressive, with emotional weight (55–75 BPM).\n5. Pianissimo (very soft).\n6. Hold the note longer than its written value; the exact duration is up to the performer.',
  },
  {
    id: 4,
    type: 'text',
    front:
      'A 2-measure excerpt: bass clef, no sharps or flats, 2/4 time, "Presto, mf", with "sfz" marked on beat 1 of the first measure and an accent (>) on beat 1 of the second.\n\n1. What clef?\n2. What key (major and minor possibilities)?\n3. What tempo?\n4. What does sfz mean?\n5. How is an accent different from sfz?',
    back:
      '1. Bass clef.\n2. No sharps/flats — C major or A minor.\n3. Presto — very fast (168–200 BPM).\n4. Sforzando — a sudden, sharp accent; the note is strongly emphasized and played louder than its surroundings.\n5. An accent (>) makes a note noticeably louder but less dramatically than sfz. Sfz is a stronger, more sudden emphasis.',
  },
  {
    id: 5,
    type: 'text',
    front:
      'A 2-measure excerpt: alto clef, 1 flat, 4/4, "Largo, p", with "sul ponticello" marked at the start.\n\n1. What clef and what instrument typically uses it?\n2. What key?\n3. What is sul ponticello and what sound does it produce?\n4. What is the character of Largo?',
    back:
      '1. Alto clef — the viola\'s primary clef; middle line = middle C.\n2. One flat — F major or D minor.\n3. "On the bridge" — the bowed string player bows very close to the bridge, producing a thin, glassy, sometimes whistling tone.\n4. Broad, slow, dignified (40–60 BPM).',
  },
  {
    id: 6,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, 3 sharps, 12/8, "Andantino, mp", marked "pizz." at the start.\n\n1. What key?\n2. What time signature and its meter type?\n3. What is pizzicato?\n4. When does the player return to normal bowing?\n5. What dynamic is "mp"?',
    back:
      '1. Three sharps — A major or F♯ minor.\n2. 12/8 — compound quadruple (four dotted-quarter beats per measure).\n3. The string player plucks the strings with the fingers rather than bowing.\n4. When "arco" is marked.\n5. Mezzo-piano — moderately soft.',
  },
  {
    id: 7,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, 2 flats, 3/8 time, marked "Vivace ♪ = 160", with a trill (tr) on the second beat and a crescendo hairpin beneath the measure.\n\n1. What key?\n2. What tempo (words and BPM)?\n3. What does 3/8 mean for the beat unit?\n4. What does tr mean?\n5. What does the crescendo hairpin indicate?',
    back:
      '1. Two flats — B♭ major or G minor.\n2. Vivace (lively, fast) at eighth note = 160 BPM.\n3. 3/8 indicates three eighth-note beats per measure (simple triple); the eighth is the beat unit.\n4. Trill — rapid alternation between the written note and the note above it (usually a step higher).\n5. Gradually get louder.',
  },
  {
    id: 8,
    type: 'text',
    front:
      'A 2-measure excerpt: grand staff, 5 flats, 4/4, "Moderato, mf", with a pedal marking "Ped." at beat 1 and "✻" at the end of measure 2.\n\n1. What key?\n2. What instrument?\n3. What do "Ped." and "✻" indicate?\n4. What effect does the pedal produce?',
    back:
      '1. Five flats — D♭ major or B♭ minor.\n2. Piano (grand staff + pedal markings).\n3. Press the sustain (damper) pedal at Ped. and release at the asterisk.\n4. Lifts the dampers off the strings so played notes continue to ring after the keys are released; creates resonance and legato connection.',
  },
  {
    id: 9,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, no key signature, 5/4 time, marked "Lento, ppp", with a double bar line followed by a coda sign (𝄌) at the end.\n\n1. What key?\n2. What is unusual about 5/4?\n3. What is ppp?\n4. What does the coda sign indicate?',
    back:
      '1. No sharps/flats — C major or A minor (or possibly atonal, since no signature).\n2. 5/4 is an asymmetric/irregular meter — five quarter-note beats grouped in uneven patterns (commonly 3+2 or 2+3).\n3. Pianississimo — extremely soft, barely audible.\n4. Marks where the coda begins, or the target of a "To Coda" jump in a D.C./D.S. navigation.',
  },
  {
    id: 10,
    type: 'text',
    front:
      'A 2-measure excerpt: treble clef, 4 flats, 4/4, marked "Allegretto grazioso, mp", with a marcato (^) wedge on the first note and "con sordino" at the start.\n\n1. What key?\n2. What is the character of "grazioso"?\n3. What is marcato?\n4. What does "con sordino" mean, and for what instruments?',
    back:
      '1. Four flats — A♭ major or F minor.\n2. "Gracefully" — a flowing, refined character.\n3. Marcato (^) — a strongly emphasized, sometimes shorter attack; heavier than a standard accent.\n4. "With mute" — a mute is inserted on/into the instrument, producing a veiled, muted tone. Used by bowed strings (with a bridge mute) and brass (with a mute in the bell).',
  },
]

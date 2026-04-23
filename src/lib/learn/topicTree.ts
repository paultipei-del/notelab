// src/lib/learn/topicTree.ts
//
// The complete topic tree for NoteLab's /learn reference layer.
// hasPage: true only for pages that have been written. Navigation hides
// nodes where hasPage is false. Every flashcard deck maps to at least
// one page in this tree (see practice-links on the individual pages).

export type LearnSubtopic = {
  slug: string;
  title: string;
  hasPage: boolean;
};

export type LearnTopic = {
  slug: string;
  title: string;
  description: string;
  subtopics: LearnSubtopic[];
};

export const TOPIC_TREE: LearnTopic[] = [
  {
    slug: 'sound-and-hearing',
    title: 'Sound and How We Hear It',
    description:
      'Where music begins — vibration, pitch, the overtone series, and why Western music is built the way it is.',
    subtopics: [
      { slug: 'what-sound-is', title: 'What Sound Is', hasPage: true },
      { slug: 'from-sound-to-pitch', title: 'From Sound to Pitch', hasPage: true },
      { slug: 'the-overtone-series', title: 'The Overtone Series', hasPage: true },
      { slug: 'consonance-and-dissonance', title: 'Consonance and Dissonance', hasPage: true },
      { slug: 'the-chromatic-scale', title: 'The Chromatic Scale', hasPage: true },
      { slug: 'octaves-and-pitch-classes', title: 'Octaves and Pitch Classes', hasPage: true },
    ],
  },
  {
    slug: 'reading-and-notation',
    title: 'Reading and Writing Music',
    description:
      'How pitches become symbols on a page — the staff, clefs, note names, and accidentals.',
    subtopics: [
      { slug: 'the-staff', title: 'The Staff', hasPage: true },
      { slug: 'clefs', title: 'Clefs', hasPage: true },
      { slug: 'ledger-lines-and-the-grand-staff', title: 'Ledger Lines and the Grand Staff', hasPage: true },
      { slug: 'middle-c-across-the-clefs', title: 'Middle C Across the Clefs', hasPage: true },
      { slug: 'note-names-and-the-musical-alphabet', title: 'Note Names and the Musical Alphabet', hasPage: true },
      { slug: 'octave-designations', title: 'Octave Designations', hasPage: true },
      { slug: 'accidentals', title: 'Accidentals', hasPage: true },
      { slug: 'enharmonic-equivalents', title: 'Enharmonic Equivalents', hasPage: true },
    ],
  },
  {
    slug: 'rhythm-and-time',
    title: 'Rhythm and Time',
    description:
      'How music is organized in time — pulse, note values, meters, and the felt shape of rhythm.',
    subtopics: [
      { slug: 'pulse-and-beat', title: 'Pulse and Beat', hasPage: true },
      { slug: 'note-values', title: 'Note Values', hasPage: true },
      { slug: 'rest-values', title: 'Rest Values', hasPage: true },
      { slug: 'dots-and-ties', title: 'Dots and Ties', hasPage: true },
      { slug: 'time-signatures', title: 'Time Signatures', hasPage: true },
      { slug: 'simple-and-compound-meter', title: 'Simple and Compound Meter', hasPage: true },
      { slug: 'tuplets', title: 'Tuplets', hasPage: true },
      { slug: 'syncopation', title: 'Syncopation', hasPage: true },
      { slug: 'hemiola', title: 'Hemiola', hasPage: true },
      { slug: 'anacrusis', title: 'Anacrusis', hasPage: true },
    ],
  },
  {
    slug: 'intervals',
    title: 'Intervals',
    description:
      'The distance between two pitches — the building block of scales, chords, and harmony.',
    subtopics: [
      { slug: 'what-an-interval-is', title: 'What an Interval Is', hasPage: true },
      { slug: 'half-steps-and-whole-steps', title: 'Half Steps and Whole Steps', hasPage: true },
      { slug: 'melodic-and-harmonic-intervals', title: 'Melodic and Harmonic Intervals', hasPage: true },
      { slug: 'interval-number', title: 'Interval Number', hasPage: true },
      { slug: 'interval-quality', title: 'Interval Quality', hasPage: true },
      { slug: 'the-seven-reference-intervals', title: 'The Seven Reference Intervals', hasPage: true },
      { slug: 'interval-inversions', title: 'Interval Inversions', hasPage: true },
      { slug: 'enharmonic-intervals', title: 'Enharmonic Intervals', hasPage: true },
      { slug: 'compound-intervals', title: 'Compound Intervals', hasPage: true },
      { slug: 'consonance-and-dissonance-revisited', title: 'Consonance and Dissonance Revisited', hasPage: true },
    ],
  },
  {
    slug: 'scales',
    title: 'Scales',
    description:
      'Ordered collections of pitches that define the tonal world of a piece — major, minor, modal, and beyond.',
    subtopics: [
      { slug: 'what-a-scale-is', title: 'What a Scale Is', hasPage: true },
      { slug: 'the-major-scale', title: 'The Major Scale', hasPage: true },
      { slug: 'scale-degrees-and-their-names', title: 'Scale Degrees and Their Names', hasPage: true },
      { slug: 'the-natural-minor-scale', title: 'The Natural Minor Scale', hasPage: true },
      { slug: 'the-harmonic-minor-scale', title: 'The Harmonic Minor Scale', hasPage: true },
      { slug: 'the-melodic-minor-scale', title: 'The Melodic Minor Scale', hasPage: true },
      { slug: 'the-modes', title: 'The Modes', hasPage: true },
      { slug: 'pentatonic-scales', title: 'Pentatonic Scales', hasPage: true },
      { slug: 'blues-scales', title: 'Blues Scales', hasPage: true },
      { slug: 'chromatic-scale-spelling', title: 'Chromatic Scale Spelling', hasPage: true },
      { slug: 'whole-tone-and-octatonic-scales', title: 'Whole Tone and Octatonic Scales', hasPage: true },
    ],
  },
  {
    slug: 'pitch',
    title: 'Key Signatures',
    description:
      'The shorthand for scales — how composers mark which notes are altered throughout a piece.',
    subtopics: [
      { slug: 'what-a-key-signature-is', title: 'What a Key Signature Is', hasPage: true },
      { slug: 'major-key-signatures', title: 'Major Key Signatures', hasPage: true },
      { slug: 'minor-key-signatures', title: 'Minor Key Signatures', hasPage: true },
      { slug: 'relative-major-and-minor', title: 'Relative Major and Minor', hasPage: true },
      { slug: 'parallel-major-and-minor', title: 'Parallel Major and Minor', hasPage: true },
      { slug: 'the-circle-of-fifths', title: 'The Circle of Fifths', hasPage: true },
      { slug: 'modulation', title: 'Modulation', hasPage: true },
    ],
  },
  {
    slug: 'harmony',
    title: 'Chords and Harmony',
    description:
      'How notes combine — triads, seventh chords, inversions, Roman numerals, and the logic of progression.',
    subtopics: [
      { slug: 'what-a-chord-is', title: 'What a Chord Is', hasPage: true },
      { slug: 'triads', title: 'Triads: The Fundamental Chord', hasPage: true },
      { slug: 'triad-qualities', title: 'Triad Qualities', hasPage: true },
      { slug: 'triads-on-scale-degrees', title: 'Triads on Scale Degrees', hasPage: true },
      { slug: 'triad-inversions', title: 'Triad Inversions', hasPage: true },
      { slug: 'figured-bass', title: 'Figured Bass', hasPage: true },
      { slug: 'seventh-chords', title: 'Seventh Chords', hasPage: true },
      { slug: 'seventh-chord-inversions', title: 'Seventh Chord Inversions', hasPage: true },
      { slug: 'roman-numeral-analysis', title: 'Roman Numeral Analysis', hasPage: true },
      { slug: 'primary-chords', title: 'Primary Chords — I, IV, V', hasPage: true },
      { slug: 'secondary-chords', title: 'Secondary Chords', hasPage: true },
      { slug: 'the-leading-tone-chord', title: 'The Leading-Tone Chord', hasPage: true },
      { slug: 'cadences', title: 'Cadences', hasPage: true },
      { slug: 'non-chord-tones', title: 'Non-Chord Tones', hasPage: true },
      { slug: 'voice-leading', title: 'Voice Leading', hasPage: true },
    ],
  },
  {
    slug: 'form-and-structure',
    title: 'Form and Structure',
    description:
      'How music is organized at the larger scale — phrases, sections, and complete forms.',
    subtopics: [
      { slug: 'motive-phrase-and-period', title: 'Motive, Phrase, and Period', hasPage: true },
      { slug: 'binary-form', title: 'Binary Form', hasPage: true },
      { slug: 'ternary-form', title: 'Ternary Form', hasPage: true },
      { slug: 'rondo-form', title: 'Rondo Form', hasPage: true },
      { slug: 'theme-and-variations', title: 'Theme and Variations', hasPage: true },
      { slug: 'sonata-form', title: 'Sonata Form', hasPage: true },
      { slug: '32-bar-song-form', title: '32-Bar Song Form', hasPage: true },
      { slug: '12-bar-blues', title: '12-Bar Blues', hasPage: true },
      { slug: 'fugue-and-imitative-counterpoint', title: 'Fugue and Imitative Counterpoint', hasPage: true },
    ],
  },
  {
    slug: 'expression-and-performance',
    title: 'Expression and Performance Practice',
    description:
      'How composers tell performers what to do — dynamics, tempo, articulation, ornamentation, and the vocabulary of interpretation.',
    subtopics: [
      { slug: 'dynamics', title: 'Dynamics', hasPage: true },
      { slug: 'crescendo-and-decrescendo', title: 'Crescendo and Decrescendo', hasPage: true },
      { slug: 'tempo-markings', title: 'Tempo Markings', hasPage: true },
      { slug: 'tempo-changes', title: 'Tempo Changes', hasPage: true },
      { slug: 'articulation', title: 'Articulation', hasPage: true },
      { slug: 'phrasing-and-slurs', title: 'Phrasing and Slurs', hasPage: true },
      { slug: 'italian-terms', title: 'Italian Performance Terms', hasPage: true },
      { slug: 'german-and-french-terms', title: 'German and French Performance Terms', hasPage: true },
      { slug: 'ornaments', title: 'Ornaments', hasPage: true },
      { slug: 'pedal-markings', title: 'Pedal Markings', hasPage: true },
      { slug: 'repeat-signs-and-navigation', title: 'Repeat Signs and Navigation', hasPage: true },
      { slug: 'texture-markings', title: 'Texture Markings', hasPage: true },
      { slug: 'reading-a-scores-opening', title: "Reading a Score's Opening", hasPage: true },
      { slug: 'interpretation-and-personal-style', title: 'Interpretation and Personal Style', hasPage: true },
    ],
  },
  {
    slug: 'notation-details',
    title: 'Notation Details and Reading',
    description:
      "The mechanics of notation — beaming, stems, voices on a staff, transposition, score reading, lead sheets, tablature, and historical conventions.",
    subtopics: [
      { slug: 'beaming-rules', title: 'Beaming Rules', hasPage: true },
      { slug: 'stem-direction', title: 'Stem Direction', hasPage: true },
      { slug: 'voices-on-a-single-staff', title: 'Voices on a Single Staff', hasPage: true },
      { slug: 'cautionary-accidentals', title: 'Cautionary Accidentals', hasPage: true },
      { slug: 'transposition', title: 'Transposition', hasPage: true },
      { slug: 'transposing-instruments', title: 'Transposing Instruments', hasPage: true },
      { slug: 'score-reading', title: 'Score Reading', hasPage: true },
      { slug: 'lead-sheets-and-chord-symbols', title: 'Lead Sheets and Chord Symbols', hasPage: true },
      { slug: 'tablature', title: 'Tablature', hasPage: true },
      { slug: 'historical-notation-oddities', title: 'Historical Notation Oddities', hasPage: true },
    ],
  },
  {
    slug: 'aural-skills',
    title: 'Aural Skills',
    description:
      'How to hear what you read — interval recognition, chord quality, dictation, and the ear that every musician builds.',
    subtopics: [
      { slug: 'what-aural-skills-are', title: 'What Aural Skills Are', hasPage: false },
      { slug: 'hearing-intervals', title: 'Hearing Intervals', hasPage: false },
      { slug: 'hearing-chord-qualities', title: 'Hearing Chord Qualities', hasPage: false },
      { slug: 'hearing-scales-and-modes', title: 'Hearing Scales and Modes', hasPage: false },
      { slug: 'hearing-cadences', title: 'Hearing Cadences', hasPage: false },
      { slug: 'rhythmic-dictation', title: 'Rhythmic Dictation', hasPage: false },
      { slug: 'melodic-dictation', title: 'Melodic Dictation', hasPage: false },
      { slug: 'hearing-keys-and-modulation', title: 'Hearing Keys and Modulation', hasPage: false },
    ],
  },
];

/** Topics that have at least one published subtopic — used for /learn visibility. */
export function visibleTopics(): LearnTopic[] {
  return TOPIC_TREE.filter(t => t.subtopics.some(s => s.hasPage))
}

/** Published subtopics within a section — used for /learn/[topic] visibility. */
export function visibleSubtopics(topic: LearnTopic): LearnSubtopic[] {
  return topic.subtopics.filter(s => s.hasPage)
}

export function getTopic(slug: string): LearnTopic | undefined {
  return TOPIC_TREE.find(t => t.slug === slug)
}

export function getSubtopic(topicSlug: string, subtopicSlug: string): {
  topic: LearnTopic
  subtopic: LearnSubtopic
} | undefined {
  const topic = getTopic(topicSlug)
  if (!topic) return undefined
  const subtopic = topic.subtopics.find(s => s.slug === subtopicSlug)
  if (!subtopic) return undefined
  return { topic, subtopic }
}

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
      { slug: 'the-staff', title: 'The Staff', hasPage: false },
      { slug: 'clefs', title: 'Clefs', hasPage: false },
      { slug: 'ledger-lines-and-the-grand-staff', title: 'Ledger Lines and the Grand Staff', hasPage: false },
      { slug: 'middle-c-across-the-clefs', title: 'Middle C Across the Clefs', hasPage: false },
      { slug: 'note-names-and-the-musical-alphabet', title: 'Note Names and the Musical Alphabet', hasPage: false },
      { slug: 'octave-designations', title: 'Octave Designations', hasPage: false },
      { slug: 'accidentals', title: 'Accidentals', hasPage: false },
      { slug: 'enharmonic-equivalents', title: 'Enharmonic Equivalents', hasPage: false },
    ],
  },
  {
    slug: 'rhythm-and-time',
    title: 'Rhythm and Time',
    description:
      'How music is organized in time — pulse, note values, meters, and the felt shape of rhythm.',
    subtopics: [
      { slug: 'pulse-and-beat', title: 'Pulse and Beat', hasPage: false },
      { slug: 'note-values', title: 'Note Values', hasPage: false },
      { slug: 'rest-values', title: 'Rest Values', hasPage: false },
      { slug: 'dots-and-ties', title: 'Dots and Ties', hasPage: false },
      { slug: 'time-signatures', title: 'Time Signatures', hasPage: false },
      { slug: 'simple-and-compound-meter', title: 'Simple and Compound Meter', hasPage: false },
      { slug: 'tuplets', title: 'Tuplets', hasPage: false },
      { slug: 'syncopation', title: 'Syncopation', hasPage: false },
      { slug: 'hemiola', title: 'Hemiola', hasPage: false },
      { slug: 'anacrusis', title: 'Anacrusis', hasPage: false },
    ],
  },
  {
    slug: 'intervals',
    title: 'Intervals',
    description:
      'The distance between two pitches — the building block of scales, chords, and harmony.',
    subtopics: [
      { slug: 'what-an-interval-is', title: 'What an Interval Is', hasPage: false },
      { slug: 'half-steps-and-whole-steps', title: 'Half Steps and Whole Steps', hasPage: false },
      { slug: 'melodic-and-harmonic-intervals', title: 'Melodic and Harmonic Intervals', hasPage: false },
      { slug: 'interval-number', title: 'Interval Number', hasPage: false },
      { slug: 'interval-quality', title: 'Interval Quality', hasPage: false },
      { slug: 'the-seven-reference-intervals', title: 'The Seven Reference Intervals', hasPage: false },
      { slug: 'interval-inversions', title: 'Interval Inversions', hasPage: false },
      { slug: 'enharmonic-intervals', title: 'Enharmonic Intervals', hasPage: false },
      { slug: 'compound-intervals', title: 'Compound Intervals', hasPage: false },
      { slug: 'consonance-and-dissonance-revisited', title: 'Consonance and Dissonance Revisited', hasPage: false },
    ],
  },
  {
    slug: 'scales',
    title: 'Scales',
    description:
      'Ordered collections of pitches that define the tonal world of a piece — major, minor, modal, and beyond.',
    subtopics: [
      { slug: 'what-a-scale-is', title: 'What a Scale Is', hasPage: false },
      { slug: 'the-major-scale', title: 'The Major Scale', hasPage: false },
      { slug: 'scale-degrees-and-their-names', title: 'Scale Degrees and Their Names', hasPage: false },
      { slug: 'the-natural-minor-scale', title: 'The Natural Minor Scale', hasPage: false },
      { slug: 'the-harmonic-minor-scale', title: 'The Harmonic Minor Scale', hasPage: false },
      { slug: 'the-melodic-minor-scale', title: 'The Melodic Minor Scale', hasPage: false },
      { slug: 'the-modes', title: 'The Modes', hasPage: false },
      { slug: 'pentatonic-scales', title: 'Pentatonic Scales', hasPage: false },
      { slug: 'blues-scales', title: 'Blues Scales', hasPage: false },
      { slug: 'chromatic-scale-spelling', title: 'Chromatic Scale Spelling', hasPage: false },
      { slug: 'whole-tone-and-octatonic-scales', title: 'Whole Tone and Octatonic Scales', hasPage: false },
    ],
  },
  {
    slug: 'pitch',
    title: 'Key Signatures',
    description:
      'The shorthand for scales — how composers mark which notes are altered throughout a piece.',
    subtopics: [
      { slug: 'what-a-key-signature-is', title: 'What a Key Signature Is', hasPage: false },
      { slug: 'major-key-signatures', title: 'Major Key Signatures', hasPage: true },
      { slug: 'minor-key-signatures', title: 'Minor Key Signatures', hasPage: false },
      { slug: 'relative-major-and-minor', title: 'Relative Major and Minor', hasPage: false },
      { slug: 'parallel-major-and-minor', title: 'Parallel Major and Minor', hasPage: false },
      { slug: 'the-circle-of-fifths', title: 'The Circle of Fifths', hasPage: false },
      { slug: 'modulation', title: 'Modulation', hasPage: false },
    ],
  },
  {
    slug: 'harmony',
    title: 'Chords and Harmony',
    description:
      'How notes combine — triads, seventh chords, inversions, Roman numerals, and the logic of progression.',
    subtopics: [
      { slug: 'what-a-chord-is', title: 'What a Chord Is', hasPage: false },
      { slug: 'triads', title: 'Triads: The Fundamental Chord', hasPage: false },
      { slug: 'triad-qualities', title: 'Triad Qualities', hasPage: false },
      { slug: 'triads-on-scale-degrees', title: 'Triads on Scale Degrees', hasPage: false },
      { slug: 'triad-inversions', title: 'Triad Inversions', hasPage: false },
      { slug: 'figured-bass', title: 'Figured Bass', hasPage: false },
      { slug: 'seventh-chords', title: 'Seventh Chords', hasPage: false },
      { slug: 'seventh-chord-inversions', title: 'Seventh Chord Inversions', hasPage: false },
      { slug: 'roman-numeral-analysis', title: 'Roman Numeral Analysis', hasPage: false },
      { slug: 'the-primary-chords', title: 'The Primary Chords', hasPage: false },
      { slug: 'the-secondary-chords', title: 'The Secondary Chords', hasPage: false },
      { slug: 'the-leading-tone-chord', title: 'The Leading Tone Chord', hasPage: false },
      { slug: 'cadences', title: 'Cadences', hasPage: false },
      { slug: 'non-chord-tones', title: 'Non-Chord Tones', hasPage: false },
      { slug: 'voice-leading', title: 'Voice Leading', hasPage: false },
    ],
  },
  {
    slug: 'form-and-structure',
    title: 'Form and Structure',
    description:
      'How music is organized at the larger scale — phrases, sections, and complete forms.',
    subtopics: [
      { slug: 'motive-phrase-and-period', title: 'Motive, Phrase, and Period', hasPage: false },
      { slug: 'the-sentence-and-the-period', title: 'The Sentence and the Period', hasPage: false },
      { slug: 'binary-form', title: 'Binary Form', hasPage: false },
      { slug: 'ternary-form', title: 'Ternary Form', hasPage: false },
      { slug: 'theme-and-variations', title: 'Theme and Variations', hasPage: false },
      { slug: 'rondo-form', title: 'Rondo Form', hasPage: false },
      { slug: 'sonata-form', title: 'Sonata Form', hasPage: false },
      { slug: 'fugue', title: 'Fugue', hasPage: false },
      { slug: 'through-composed-form', title: 'Through-Composed Form', hasPage: false },
    ],
  },
  {
    slug: 'expression-and-performance',
    title: 'Expression and Performance Practice',
    description:
      'How composers tell performers what to do — dynamics, tempo, articulation, ornamentation, and the vocabulary of interpretation.',
    subtopics: [
      { slug: 'dynamics', title: 'Dynamics', hasPage: false },
      { slug: 'tempo-markings', title: 'Tempo Markings', hasPage: false },
      { slug: 'character-and-mood-markings', title: 'Character and Mood Markings', hasPage: false },
      { slug: 'articulation', title: 'Articulation', hasPage: false },
      { slug: 'tempo-modifications', title: 'Tempo Modifications', hasPage: false },
      { slug: 'modifying-words', title: 'Modifying Words', hasPage: false },
      { slug: 'german-performance-directions', title: 'German Performance Directions', hasPage: false },
      { slug: 'french-performance-directions', title: 'French Performance Directions', hasPage: false },
      { slug: 'ornaments-overview', title: 'Ornaments: An Overview', hasPage: false },
      { slug: 'the-trill', title: 'The Trill', hasPage: false },
      { slug: 'mordents-and-turns', title: 'Mordents and Turns', hasPage: false },
      { slug: 'grace-notes-and-appoggiatura', title: 'Grace Notes, Appoggiatura, and Acciaccatura', hasPage: false },
      { slug: 'baroque-ornament-execution', title: 'Ornament Execution: Baroque Practice', hasPage: false },
      { slug: 'classical-romantic-ornament-execution', title: 'Ornament Execution: Classical and Romantic Practice', hasPage: false },
    ],
  },
  {
    slug: 'notation-details',
    title: 'Notation Details and Reading',
    description:
      'The practical details of reading real music — repeats, octave signs, pedaling, fingering, and piano-specific markings.',
    subtopics: [
      { slug: 'repeat-signs-and-structure', title: 'Repeat Signs and Structural Markings', hasPage: false },
      { slug: 'bar-lines', title: 'Bar Lines and Their Types', hasPage: false },
      { slug: 'slur-vs-tie', title: 'The Slur vs. the Tie', hasPage: false },
      { slug: 'octave-signs', title: 'Octave Signs', hasPage: false },
      { slug: 'glissando-and-portamento', title: 'Glissando and Portamento', hasPage: false },
      { slug: 'pedal-markings', title: 'Pedal Markings', hasPage: false },
      { slug: 'fingering-conventions', title: 'Fingering Conventions', hasPage: false },
      { slug: 'hand-division-markings', title: 'Hand Division Markings', hasPage: false },
      { slug: 'arpeggiated-chord-notation', title: 'Arpeggiated Chord Notation', hasPage: false },
      { slug: 'tremolo-notation', title: 'Tremolo Notation', hasPage: false },
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

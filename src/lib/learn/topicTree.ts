// Reference layer topic tree. The tree definition is complete (all eight
// sections), but only subtopics with `hasPage: true` render in navigation.
// Empty sections (no published pages) are hidden from the /learn landing page
// entirely — see src/app/learn/page.tsx.

export type LearnSubtopic = {
  slug: string
  title: string
  hasPage: boolean
}

export type LearnTopic = {
  slug: string
  title: string
  description: string
  subtopics: LearnSubtopic[]
}

export const TOPIC_TREE: LearnTopic[] = [
  {
    slug: 'reading-and-notation',
    title: 'Reading and Notation',
    description: 'How music is written down — the staff, clefs, accidentals, and the visual language of notation.',
    subtopics: [],
  },
  {
    slug: 'rhythm-and-meter',
    title: 'Rhythm and Meter',
    description: 'How time is organized in music — note values, meters, tuplets, and rhythmic patterns.',
    subtopics: [],
  },
  {
    slug: 'pitch',
    title: 'Pitch and Scales',
    description: 'How pitches are organized — intervals, scales, modes, and key signatures.',
    subtopics: [
      { slug: 'intervals',                      title: 'Intervals',                         hasPage: false },
      { slug: 'major-scales',                   title: 'Major Scales',                      hasPage: false },
      { slug: 'minor-scales',                   title: 'Minor Scales',                      hasPage: false },
      { slug: 'modes',                          title: 'Modes',                             hasPage: false },
      { slug: 'pentatonic-and-blues-scales',    title: 'Pentatonic and Blues Scales',       hasPage: false },
      { slug: 'whole-tone-and-chromatic-scales', title: 'Whole Tone and Chromatic Scales',  hasPage: false },
      { slug: 'major-key-signatures',           title: 'Major Key Signatures',              hasPage: true  },
      { slug: 'minor-key-signatures',           title: 'Minor Key Signatures',              hasPage: false },
      { slug: 'circle-of-fifths',               title: 'Circle of Fifths',                  hasPage: false },
      { slug: 'enharmonic-equivalents',         title: 'Enharmonic Equivalents',            hasPage: false },
    ],
  },
  {
    slug: 'harmony',
    title: 'Chords and Harmony',
    description: 'How notes combine — triads, seventh chords, inversions, Roman numerals, and harmonic progression.',
    subtopics: [],
  },
  {
    slug: 'form-and-analysis',
    title: 'Form and Analysis',
    description: 'How music is structured at the larger scale — phrases, sections, and complete forms.',
    subtopics: [],
  },
  {
    slug: 'performance-practice',
    title: 'Performance Practice',
    description: 'How music is performed — tempo, dynamics, articulation, ornamentation, and era-specific conventions.',
    subtopics: [],
  },
  {
    slug: 'aural-skills',
    title: 'Aural Skills',
    description: 'How to hear and identify what you read — interval recognition, chord quality, and dictation.',
    subtopics: [],
  },
  {
    slug: 'keyboard-and-piano',
    title: 'Keyboard and Piano-Specific',
    description: 'Concepts specific to the keyboard — pedaling, fingering, voicing, and hand independence.',
    subtopics: [],
  },
]

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

export type LessonTool = 'mc-quiz' | 'staff-note-quiz' | 'line-space-quiz' | 'flash-session' | 'mixed-quiz' | 'grand-staff-lesson' | 'line-space-lesson' | 'treble-clef-lesson' | 'bass-clef-lesson' | 'sharps-flats-lesson' | 'half-whole-lesson' | 'intervals-lesson' | 'major-patterns-lesson' | 'minor-patterns-lesson' | 'review-patterns-lesson' | 'review-1to9-lesson' | 'key-signatures-lesson' | 'major-scales-lesson' | 'time-signatures-lesson'

export interface CMPrepLesson {
  slug: string
  number: string       // '1'–'13', 'R', or 'T'
  title: string
  subtitle: string
  description: string
  type: 'lesson' | 'review'
  tool: LessonTool
  unlockAfter: string | null  // slug of preceding module (null = always open)
  passingScore: number        // 0–1
}

export const CM_PREP_LESSONS: CMPrepLesson[] = [
  {
    slug: 'grand-staff',
    number: '1',
    title: 'The Grand Staff',
    subtitle: 'Staff structure, clef signs, and measures',
    description: "Every piece of written music lives on a staff — a grid of five lines and four spaces. When treble and bass staves are joined by a curved brace, they form the grand staff that piano music is written on. This lesson builds your foundational vocabulary for reading any notated music.",
    type: 'lesson',
    tool: 'grand-staff-lesson',
    unlockAfter: null,
    passingScore: 0.7,
  },
  {
    slug: 'line-space-notes',
    number: '2',
    title: 'Lines and Spaces',
    subtitle: 'Where notes sit on the staff',
    description: "A note placed directly on a staff line is a line note. A note resting between two lines sits in a space. Recognizing this instantly narrows your search to exactly half the possible names — the five line names or the four space names.",
    type: 'lesson',
    tool: 'line-space-lesson',
    unlockAfter: 'grand-staff',
    passingScore: 0.8,
  },
  {
    slug: 'treble-clef-notes',
    number: '3',
    title: 'Treble Clef Note Names',
    subtitle: 'Reading notes in the upper staff',
    description: "The treble clef anchors G on the second line. Working outward from that anchor, every line and space has a letter name from A through G that cycles endlessly. Lines bottom to top: E G B D F. Spaces bottom to top: F A C E.",
    type: 'lesson',
    tool: 'treble-clef-lesson',
    unlockAfter: 'line-space-notes',
    passingScore: 0.8,
  },
  {
    slug: 'bass-clef-notes',
    number: '4',
    title: 'Bass Clef Note Names',
    subtitle: 'Reading notes in the lower staff',
    description: "The bass clef anchors F on the fourth line. Lines bottom to top: G B D F A. Spaces bottom to top: A C E G. Middle C sits just above the bass staff on its own short ledger line — it is the same C that sits just below the treble staff.",
    type: 'lesson',
    tool: 'bass-clef-lesson',
    unlockAfter: 'treble-clef-notes',
    passingScore: 0.8,
  },
  {
    slug: 'review-letter-names',
    number: 'R',
    title: 'Review: Letter Names',
    subtitle: 'Treble and bass combined',
    description: "Mixed note identification across both staves. Letter names A through G repeat the same cycle on every staff — once you can navigate either staff fluently, reading the grand staff becomes twice as fast.",
    type: 'review',
    tool: 'staff-note-quiz',
    unlockAfter: 'bass-clef-notes',
    passingScore: 0.75,
  },
  {
    slug: 'sharps-flats-naturals',
    number: '5',
    title: 'Sharps, Flats, and Naturals',
    subtitle: 'Modifying pitch with accidentals',
    description: "A sharp (♯) raises a note by one half step — one key to the right on the piano. A flat (♭) lowers it by one half step — one key to the left. A natural (♮) cancels any sharp or flat, returning the note to its unaltered pitch for the rest of the measure.",
    type: 'lesson',
    tool: 'sharps-flats-lesson',
    unlockAfter: 'review-letter-names',
    passingScore: 0.8,
  },
  {
    slug: 'half-whole-steps',
    number: '6',
    title: 'Half Steps and Whole Steps',
    subtitle: 'The building blocks of scales and patterns',
    description: "A half step is the smallest distance in Western music — from one key to the immediately adjacent key, with no keys between them. A whole step is exactly two half steps wide, skipping over one key. These two distances are the ingredients of every scale, pattern, and chord you will play.",
    type: 'lesson',
    tool: 'half-whole-lesson',
    unlockAfter: 'sharps-flats-naturals',
    passingScore: 0.8,
  },
  {
    slug: 'intervals',
    number: '7',
    title: 'Intervals',
    subtitle: 'Measuring the distance between notes',
    description: "An interval is the distance between two notes, counted by including both note names. A 2nd moves to the next letter; a 3rd skips one; a 4th spans four letters; a 5th spans five. On the staff, a 2nd always moves from line to space or space to line; a 3rd always moves line to line or space to space.",
    type: 'lesson',
    tool: 'intervals-lesson',
    unlockAfter: 'half-whole-steps',
    passingScore: 0.8,
  },
  {
    slug: 'major-patterns',
    number: '8',
    title: 'Major Five-Finger Patterns and Triads',
    subtitle: 'C, F, G, and D major',
    description: "A major five-finger pattern spans five adjacent notes following the step sequence Whole-Whole-Half-Whole — producing the bright, settled sound we associate with major keys. The triad built on the first, third, and fifth notes of each pattern is the tonic chord of that key.",
    type: 'lesson',
    tool: 'major-patterns-lesson',
    unlockAfter: 'intervals',
    passingScore: 0.8,
  },
  {
    slug: 'minor-patterns',
    number: '9',
    title: 'Minor Five-Finger Patterns and Triads',
    subtitle: 'c, f, g, and d minor',
    description: "A minor five-finger pattern follows Whole-Half-Whole-Whole — shifting the half step one position earlier than major, lowering the third note by one half step. This single change gives minor its darker, more expressive quality. The four tonics are the same as in Lesson 8: C, F, G, and D.",
    type: 'lesson',
    tool: 'minor-patterns-lesson',
    unlockAfter: 'major-patterns',
    passingScore: 0.8,
  },
  {
    slug: 'review-patterns',
    number: 'R',
    title: 'Review: Five-Finger Patterns and Triads',
    subtitle: 'Major and minor combined',
    description: "Major and minor patterns share the same tonic — only one note changes. This review sharpens your ability to distinguish them by step formula, by sound, and by the notes they contain.",
    type: 'review',
    tool: 'review-patterns-lesson',
    unlockAfter: 'minor-patterns',
    passingScore: 0.75,
  },
  {
    slug: 'review-lessons-1-9',
    number: 'R',
    title: 'Review: Lessons 1–9',
    subtitle: 'Comprehensive checkpoint',
    description: "A cumulative check covering everything from staff anatomy through five-finger patterns. Pass this before moving on to key signatures, major scales, and musical vocabulary.",
    type: 'review',
    tool: 'review-1to9-lesson',
    unlockAfter: 'review-patterns',
    passingScore: 0.75,
  },
  {
    slug: 'key-signatures',
    number: '10',
    title: 'Key Signatures',
    subtitle: 'C, F, and G major',
    description: "A key signature appears right after the clef sign and tells you which notes are consistently sharp or flat throughout the piece. C major has no sharps or flats. G major has one sharp: F♯. F major has one flat: B♭. Knowing these three is the foundation for reading most beginning piano literature.",
    type: 'lesson',
    tool: 'key-signatures-lesson',
    unlockAfter: 'review-lessons-1-9',
    passingScore: 0.8,
  },
  {
    slug: 'major-scales',
    number: '11',
    title: 'Major Scales',
    subtitle: 'C, F, and G major — eight notes, one pattern',
    description: "Every major scale follows the same step sequence: W W H W W W H. This pattern is identical in every key — only the starting note changes. Knowing the scale spelling for C, F, and G major lets you predict the key signature and navigate the staff with confidence.",
    type: 'lesson',
    tool: 'major-scales-lesson',
    unlockAfter: 'key-signatures',
    passingScore: 0.8,
  },
  {
    slug: 'time-signatures',
    number: '12',
    title: 'Time Signatures',
    subtitle: 'Counting beats and note values',
    description: "The time signature sits at the beginning of every piece, stacked like a fraction. The top number tells you how many beats belong in each measure. The bottom number tells you which note value receives one beat — a 4 on the bottom means the quarter note gets the beat.",
    type: 'lesson',
    tool: 'time-signatures-lesson',
    unlockAfter: 'major-scales',
    passingScore: 0.8,
  },
  {
    slug: 'signs-terms',
    number: '13',
    title: 'Signs and Terms',
    subtitle: 'Preparatory-level musical vocabulary',
    description: "Tempo markings, dynamic symbols, articulation signs, and structural directions — these words and symbols control how music is performed. Knowing them is the difference between playing the right notes and playing music as it was written.",
    type: 'lesson',
    tool: 'flash-session',
    unlockAfter: 'time-signatures',
    passingScore: 0.8,
  },
  {
    slug: 'review-lessons-10-13',
    number: 'R',
    title: 'Review: Lessons 10–13',
    subtitle: 'Key signatures, scales, time, and terms',
    description: "A focused review of everything from the second half of the preparatory level: key signatures for C, F, and G major; scale spellings; time signatures and note values; and the complete set of signs and terms.",
    type: 'review',
    tool: 'mixed-quiz',
    unlockAfter: 'signs-terms',
    passingScore: 0.75,
  },
  {
    slug: 'review-test',
    number: 'T',
    title: 'Review Test',
    subtitle: 'Full preparatory level assessment',
    description: "A comprehensive test covering all preparatory-level material — staff reading, accidentals, steps, intervals, patterns, key signatures, scales, time signatures, and signs and terms. Pass this to complete the Preparatory level.",
    type: 'review',
    tool: 'mixed-quiz',
    unlockAfter: 'review-lessons-10-13',
    passingScore: 0.8,
  },
]

export function getCMPrepLesson(slug: string): CMPrepLesson | undefined {
  return CM_PREP_LESSONS.find(l => l.slug === slug)
}

export function getCMPrepLessonIndex(slug: string): number {
  return CM_PREP_LESSONS.findIndex(l => l.slug === slug)
}

export function nextCMPrepLesson(slug: string): CMPrepLesson | undefined {
  const idx = getCMPrepLessonIndex(slug)
  return idx >= 0 ? CM_PREP_LESSONS[idx + 1] : undefined
}

/**
 * Lesson-derived flashcard decks.
 *
 * Workflow (option 1 from the design discussion):
 *   1. In a lesson's `page.mdx`, extend `learnPage` with a `flashcards` array:
 *        flashcards: [
 *          { q: 'What is staccato?', a: 'A short, detached articulation.' },
 *          { q: 'What is legato?',   a: 'Smooth, connected.' },
 *        ]
 *   2. Register the lesson here by importing its `learnPage` and adding it to
 *      `LESSON_PAGES` below. The build pipeline turns each registered page
 *      with non-empty flashcards into a `Deck` that:
 *        - lives at /study/lesson-<topic>-<subtopic>
 *        - shows up on the library shelf matching the lesson's topic
 *        - is reachable from the lesson page's Practice section automatically
 *
 * Why not auto-discover every MDX file? Two reasons:
 *   - Static imports keep the dependency graph explicit so dead code remains
 *     dead and TS can typecheck the registry.
 *   - Authors can opt in or out (some lessons may never want a deck — e.g.,
 *     overview/synthesis pages).
 */

import type { Deck, Card } from '@/lib/types'
import { TOPIC_TREE, type LearnTier } from './topicTree'
import { lessonDeckId, type LessonFlashCard, type LessonPageData } from './lessonDeckMeta'

export type { LessonFlashCard, LessonPageData } from './lessonDeckMeta'
export { lessonDeckId } from './lessonDeckMeta'

// Registered lesson pages — see LESSON_PAGES below.
// I. Sound and Hearing
import { learnPage as whatSoundIs }            from '@/app/learn/sound-and-hearing/what-sound-is/page.mdx'
import { learnPage as fromSoundToPitch }       from '@/app/learn/sound-and-hearing/from-sound-to-pitch/page.mdx'
import { learnPage as theOvertoneSeries }      from '@/app/learn/sound-and-hearing/the-overtone-series/page.mdx'
import { learnPage as consonanceAndDissonance } from '@/app/learn/sound-and-hearing/consonance-and-dissonance/page.mdx'
import { learnPage as theChromaticScale }      from '@/app/learn/sound-and-hearing/the-chromatic-scale/page.mdx'
import { learnPage as octavesAndPitchClasses } from '@/app/learn/sound-and-hearing/octaves-and-pitch-classes/page.mdx'
// II. Reading and Notation
import { learnPage as theStaff }               from '@/app/learn/reading-and-notation/the-staff/page.mdx'
import { learnPage as clefs }                  from '@/app/learn/reading-and-notation/clefs/page.mdx'
import { learnPage as ledgerLinesGrandStaff }  from '@/app/learn/reading-and-notation/ledger-lines-and-the-grand-staff/page.mdx'
import { learnPage as middleCAcrossClefs }     from '@/app/learn/reading-and-notation/middle-c-across-the-clefs/page.mdx'
import { learnPage as noteNamesAlphabet }      from '@/app/learn/reading-and-notation/note-names-and-the-musical-alphabet/page.mdx'
import { learnPage as octaveDesignations }     from '@/app/learn/reading-and-notation/octave-designations/page.mdx'
import { learnPage as accidentals }            from '@/app/learn/reading-and-notation/accidentals/page.mdx'
import { learnPage as enharmonicEquivalents }  from '@/app/learn/reading-and-notation/enharmonic-equivalents/page.mdx'
// III. Rhythm and Time
import { learnPage as pulseAndBeat }           from '@/app/learn/rhythm-and-time/pulse-and-beat/page.mdx'
import { learnPage as noteValues }             from '@/app/learn/rhythm-and-time/note-values/page.mdx'
import { learnPage as restValues }             from '@/app/learn/rhythm-and-time/rest-values/page.mdx'
import { learnPage as dotsAndTies }            from '@/app/learn/rhythm-and-time/dots-and-ties/page.mdx'
import { learnPage as timeSignatures }         from '@/app/learn/rhythm-and-time/time-signatures/page.mdx'
import { learnPage as simpleAndCompoundMeter } from '@/app/learn/rhythm-and-time/simple-and-compound-meter/page.mdx'
import { learnPage as tuplets }                from '@/app/learn/rhythm-and-time/tuplets/page.mdx'
import { learnPage as syncopation }            from '@/app/learn/rhythm-and-time/syncopation/page.mdx'
import { learnPage as hemiola }                from '@/app/learn/rhythm-and-time/hemiola/page.mdx'
import { learnPage as anacrusis }              from '@/app/learn/rhythm-and-time/anacrusis/page.mdx'

// Topic slug from `topicTree.ts` → topic tag used by the library to color
// & shelf the deck. Picks the closest concept shelf; lessons whose parent
// topic doesn't map cleanly default to `notation`.
const LESSON_TOPIC_TAG: Record<string, string> = {
  'sound-and-hearing':          'pitch',
  'reading-and-notation':       'notation',
  'rhythm-and-time':            'rhythm',
  'intervals':                  'pitch',
  'scales':                     'pitch',
  'pitch':                      'pitch',
  'harmony':                    'harmony',
  'form-and-structure':         'form',
  'expression-and-performance': 'expression',
  'notation-details':           'notation',
  'aural-skills':               'aural',
}

const LESSON_TIER_FROM_LEARN_TIER: Record<LearnTier, 'foundations' | 'intermediate' | 'advanced'> = {
  Foundations:        'foundations',
  'Building blocks':  'foundations',
  'Core theory':      'intermediate',
  'Practical reading':'intermediate',
  Practice:           'advanced',
}


export function buildLessonDeck(page: LessonPageData): Deck | null {
  const cards = page.flashcards ?? []
  if (cards.length === 0) return null

  const topicNode = TOPIC_TREE.find(t => t.slug === page.topic)
  const tier = topicNode ? LESSON_TIER_FROM_LEARN_TIER[topicNode.tier] : 'intermediate'
  const subtopicIdx = topicNode?.subtopics.findIndex(s => s.slug === page.subtopic) ?? 0
  const topicTag = LESSON_TOPIC_TAG[page.topic] ?? 'notation'

  const deckCards: Card[] = cards.map((c, i) => ({
    id: i + 1,
    front: c.q,
    back: c.a,
    type: 'text',
  }))

  return {
    id: lessonDeckId(page.topic, page.subtopic),
    title: page.title,
    description: `Concept review for the "${page.title}" lesson.`,
    tag: 'free',
    tier,
    // Sort lesson decks toward the end of their tier shelves so they
    // don't elbow out the curated symbol decks at low order numbers.
    tierOrder: 500 + subtopicIdx,
    category: 'Notation & Terms',
    tags: [`topic:${topicTag}`, 'type:lesson-cards'],
    cards: deckCards,
  }
}

/**
 * Registry of lessons whose flashcards should be turned into library decks.
 * Add an entry here as you author flashcards on a lesson's `learnPage`:
 *
 *   import { learnPage as articulation } from '@/app/learn/expression-and-performance/articulation/page.mdx'
 *   ...
 *   const LESSON_PAGES: LessonPageData[] = [articulation]
 */
const LESSON_PAGES: LessonPageData[] = [
  // I. Sound and Hearing
  whatSoundIs,
  fromSoundToPitch,
  theOvertoneSeries,
  consonanceAndDissonance,
  theChromaticScale,
  octavesAndPitchClasses,
  // II. Reading and Notation
  theStaff,
  clefs,
  ledgerLinesGrandStaff,
  middleCAcrossClefs,
  noteNamesAlphabet,
  octaveDesignations,
  accidentals,
  enharmonicEquivalents,
  // III. Rhythm and Time
  pulseAndBeat,
  noteValues,
  restValues,
  dotsAndTies,
  timeSignatures,
  simpleAndCompoundMeter,
  tuplets,
  syncopation,
  hemiola,
  anacrusis,
]

export const LESSON_DECKS: Deck[] = LESSON_PAGES
  .map(buildLessonDeck)
  .filter((d): d is Deck => d !== null)

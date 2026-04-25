/**
 * Per-topic lesson content for the rhythm program. Each entry drives the
 * Concept page (and optionally Listen / Check) for one topic — keyed by
 * the canonical category slug (`categorySlug(category.name)` from
 * `@/lib/programs/rhythm/config`).
 *
 * Topics not listed here fall back to a generic "no concept yet" placeholder
 * on the concept page. As you add curriculum content, append entries here.
 */

export interface ConceptParagraph {
  /** Optional small heading shown above the paragraph. */
  heading?: string
  /** Paragraph body text. Plain prose; no inline markdown rendering for now. */
  body: string
}

export interface LessonConcept {
  /** Big serif title at the top of the concept page. */
  title: string
  /** One-line subtitle below the title (the "what you'll learn" pitch). */
  subtitle: string
  /** Body paragraphs — written in teaching voice, ~2–4 short paragraphs total. */
  paragraphs: ConceptParagraph[]
  /** Tempo (BPM) the topic targets at mastery. Drives the goal-tempo display + check threshold. */
  goalBpm: number
  /** Optional ID of an exercise to use as the visual notation example on the concept page.
   * Falls back to the first exercise of the topic if not specified. */
  exampleExerciseId?: string
  /** A reminder line shown at the bottom of the concept page — like a "remember this" cue. */
  remember?: string
}

const CONCEPTS: Record<string, LessonConcept> = {
  // categorySlug('Pulse Games & Meter Basics') === 'pulse-games--meter-basics'
  // (the existing slugifier collapses the ampersand, leaving a double dash —
  // ugly but consistent with other topics like 'core-values--rests').
  'pulse-games--meter-basics': {
    title: 'Pulse and Meter',
    subtitle: 'Where the beat lives, and how it groups.',
    paragraphs: [
      {
        heading: 'What is the pulse?',
        body: 'Pulse is the steady beat that runs underneath every piece of music. If you tap your foot while listening to a song, that\'s the pulse. It doesn\'t change when the rhythm gets complicated — the pulse keeps moving regardless.',
      },
      {
        heading: 'What is meter?',
        body: 'Meter is how we group those pulses. Some music groups beats in twos (march time, 2/4), some in threes (waltz time, 3/4), and most popular music groups them in fours (4/4). The first beat of each group feels the strongest — that\'s the downbeat.',
      },
      {
        heading: 'Reading time signatures',
        body: 'A time signature like 4/4 has two numbers stacked on top of each other. The top number tells you how many beats are in each measure. The bottom number tells you what kind of note gets one beat — a 4 means the quarter note. So 4/4 reads as "four quarter notes per measure."',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll tap quarter notes — one tap per beat — across three time signatures. Start in 4/4, then move to 3/4 (waltz time), then 2/4 (march time). The notes themselves are the same; only the way they group changes.',
      },
    ],
    goalBpm: 80,
    remember: 'The pulse keeps moving. The time signature tells you how to group it.',
  },

  // categorySlug('Quarter/Half/Whole Notes') === 'quarterhalfwhole-notes'
  'quarterhalfwhole-notes': {
    title: 'Note Values',
    subtitle: 'Notes have lengths. The shape tells you how long to hold.',
    paragraphs: [
      {
        heading: 'Quarter, half, whole',
        body: 'These are the three foundational note values you\'ll see most often. A quarter note lasts one beat. A half note lasts two beats. A whole note lasts four beats — a full measure of 4/4. Each one is drawn slightly differently so you can tell them apart at a glance.',
      },
      {
        heading: 'How to read them',
        body: 'Tap once on the start of each note. Then count out loud — "one, two" for a half note, "one, two, three, four" for a whole note — while letting that single tap "ring" through the held beats. The tap doesn\'t happen again until the next note starts.',
      },
      {
        heading: 'Why mixing matters',
        body: 'Music breathes when you alternate short and long notes. A whole note after a string of quarters gives the listener (and you) a place to settle. Reading these mixed values is the foundation of everything else — once you can hold a note for the right number of beats, every other rhythm builds on top.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with quarter and half notes in 4/4, then add whole notes, then move the same vocabulary into 3/4. By the end, your hand will know what "two beats" and "four beats" feel like without you having to count.',
      },
    ],
    goalBpm: 80,
    remember: 'Quarter = 1 beat. Half = 2. Whole = 4. Tap once at the start; let it ring.',
  },

  'basic-rests': {
    title: 'Basic Rests',
    subtitle: 'Silence is a rhythm too — learning to hold a beat without playing it.',
    paragraphs: [
      {
        heading: 'What is a rest?',
        body: 'A rest is a pause. It looks different from a note, but it has a length, just like a note does. A quarter rest takes up one beat. A half rest takes up two beats. A whole rest takes up four beats — a full bar in 4/4.',
      },
      {
        heading: 'Why rests matter',
        body: 'Music isn\'t just sound. The space between sounds shapes the rhythm. A rhythm with quarter notes on every beat feels relentless; the same rhythm with rests on beats 2 and 4 feels open and breathable. Reading rests well is half of reading rhythm.',
      },
      {
        heading: 'How to count them',
        body: 'Count out loud while you tap. In 4/4, count "one, two, three, four." When a beat has a note, you tap and say the number. When a beat has a rest, you say the number but don\'t tap. The pulse keeps moving in your head; only the tapping stops.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with quarter rests on the strong beats (1 and 3) alternating with quarter notes on the weak beats (2 and 4). From there you\'ll layer in half rests, whole rests, and patterns that mix all three.',
      },
    ],
    goalBpm: 80,
    remember: 'A rest has a length. Count it like a note, but don\'t tap.',
  },

  // ── Fundamentals — remaining topics in curriculum order (post-reorder) ──

  'eighth-notes': {
    title: 'Eighth Notes',
    subtitle: 'Splitting the beat in half — counting "one and, two and..."',
    paragraphs: [
      {
        heading: 'What is an eighth note?',
        body: 'An eighth note is half the length of a quarter note. Two eighth notes fit in the time of one quarter note. Visually, eighths are usually beamed together in pairs — they look like quarter notes connected by a horizontal beam at the top.',
      },
      {
        heading: 'How to count them',
        body: 'Count out loud: "1-and-2-and-3-and-4-and." The numbers fall on the beats; the "ands" fall halfway between. Tap on every syllable. The pulse you established with quarter notes is still there — eighths just slot in between each beat.',
      },
      {
        heading: 'Why this matters',
        body: 'Eighth notes are the most common subdivision in popular music. Reading them fluently is the gateway to almost every rhythm beyond simple block chords. Once your hand understands "two notes per beat," the rest of the curriculum opens up.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with measures of pure eighth notes (a steady stream), then mix eighths with quarter notes, then add rests. Each level adds one new wrinkle without changing what you already know.',
      },
    ],
    goalBpm: 80,
    remember: 'Two eighths per beat. Count "1-and-2-and..." Tap on every syllable.',
  },

  'ties': {
    title: 'Ties',
    subtitle: 'Connecting notes across beats and barlines into one sustained tone.',
    paragraphs: [
      {
        heading: 'What is a tie?',
        body: 'A tie is a small curved line connecting two notes of the same pitch. It tells you to play the first note and hold it through the second one — don\'t re-attack. The two tied notes function as a single longer note.',
      },
      {
        heading: 'Why we need ties',
        body: 'Some durations can\'t be written as a single note. A note that lasts 5 eighth notes — for example, half a measure plus an eighth — has no single symbol. We tie a quarter note to an eighth note to express it. Ties also let composers show how a note crosses a beat or a bar without breaking the visual pulse of the measure.',
      },
      {
        heading: 'Ties vs slurs',
        body: 'Slurs look similar but mean something different. A slur connects notes of *different* pitches and asks you to play them smoothly. A tie connects notes of the *same* pitch and asks you to hold through. In rhythm reading you\'ll only see ties.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with ties within a beat (e.g., a quarter tied to a quarter), then ties across beats (the more common case), then ties across barlines — where the tie helps you read a note that spans the end of one measure into the start of the next.',
      },
    ],
    goalBpm: 80,
    remember: 'A tie holds through. Tap once at the start; don\'t re-attack the second note.',
  },

  'dotted-rhythms': {
    title: 'Dotted Rhythms',
    subtitle: 'A small dot adds half — a half note becomes 3 beats, a quarter becomes 1½.',
    paragraphs: [
      {
        heading: 'How the dot works',
        body: 'A dot to the right of a note adds half of that note\'s value to it. A half note (2 beats) plus a dot becomes 3 beats. A quarter note (1 beat) plus a dot becomes 1½ beats — a quarter note plus an eighth note in length.',
      },
      {
        heading: 'Dotted half — the 3-beat sustain',
        body: 'A dotted half note holds for 3 beats. In 4/4 it\'s a quarter note plus a dotted half (or vice versa). In 3/4 a dotted half fills the entire measure. Reading dotted halves trains your inner clock to count past the natural break of beat 2.',
      },
      {
        heading: 'Dotted quarter — the rhythmic backbone of pop music',
        body: 'A dotted quarter note (1½ beats) followed by an eighth note (½ beat) sums to 2 beats — the same as two quarter notes, but with a long-short feel instead of equal. This pattern is *everywhere* in popular music: think the opening hit of "Hey Jude" or the rhythmic engine of countless ballads. Mastering it unlocks half the rhythmic vocabulary you\'ll ever read.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with dotted halves in 3/4, where they fill the bar cleanly. Then move to dotted quarter + eighth in 4/4 — the long-short pattern. Finally, mixed dotted figures combined with regular note values.',
      },
    ],
    goalBpm: 80,
    remember: 'The dot adds half the note\'s value. Dotted half = 3 beats. Dotted quarter = 1½.',
  },

  'simple-syncopation': {
    title: 'Simple Syncopation',
    subtitle: 'Off-beat eighths and tied figures that displace the strong beats.',
    paragraphs: [
      {
        heading: 'What is syncopation?',
        body: 'Syncopation is when the rhythm emphasizes the *weak* parts of the beat instead of the strong ones. In 4/4, beats 1 and 3 are strong; beats 2 and 4 are weak; the "and" of any beat is even weaker. When the notes land on those weak positions instead of the strong ones, the music feels like it\'s pushing against the pulse — that\'s syncopation.',
      },
      {
        heading: 'The eighth-quarter-eighth pattern',
        body: 'The most common syncopation in 4/4 is eighth-quarter-eighth: a short note on the beat, a longer note off the beat, then back on. The middle quarter note "covers" the next beat without ever attacking it directly. Your foot still taps the underlying pulse, but your ear hears the weight on the "and."',
      },
      {
        heading: 'Why it matters',
        body: 'Almost every style outside of classical era marches uses syncopation: jazz, blues, rock, pop, R&B, Latin music, hip-hop. Reading it fluently is the difference between "playing the dots" and feeling the music. You already have the building blocks — eighth notes, ties, dotted figures — syncopation is mostly the art of placing them off the obvious beats.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with off-beat entries (notes that begin on the "and" of a beat), then layered syncopation patterns, then patterns that combine syncopation with rests for breath. Keep tapping your foot on the underlying beat — it\'s the anchor that lets the syncopation feel like syncopation.',
      },
    ],
    goalBpm: 80,
    remember: 'The note is on the "and"; the beat itself is silent. Foot keeps the pulse.',
  },

  'sixteenth-notes': {
    title: 'Sixteenth Notes',
    subtitle: 'Splitting the beat into four — counting "1-e-and-a, 2-e-and-a..."',
    paragraphs: [
      {
        heading: 'What is a sixteenth note?',
        body: 'A sixteenth note is half the length of an eighth note — and four sixteenth notes fit in the time of one quarter note. Visually, sixteenths look like eighth notes but with two beams instead of one. They\'re usually beamed in groups of four (one beat\'s worth).',
      },
      {
        heading: 'How to count them',
        body: 'The standard counting is "1-e-and-a, 2-e-and-a, 3-e-and-a, 4-e-and-a." Each beat divides into four syllables. The "1" and "and" land on the eighth-note positions you already know; the "e" and "a" fill in the gaps between.',
      },
      {
        heading: 'Reading sixteenth patterns',
        body: 'Sixteenth notes don\'t usually appear as a continuous stream — they\'re mixed with eighths and quarters to form patterns. The most common patterns are dotted-eighth + sixteenth (a long-short feel), four sixteenths (a "Scotch snap" run), and eighth + two sixteenths (a flam-like opener).',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with measures of straight sixteenth notes (the grid), then sixteenth cells mixed into eighth-note patterns, then sixteenths combined with rests and other values. Keep the pulse slow enough that every "e" and "a" is clean — speed comes later.',
      },
    ],
    goalBpm: 100,
    remember: 'Four sixteenths per beat. Count "1-e-and-a." Each syllable gets its own tap.',
  },

  '68-foundations': {
    title: '6/8 Foundations',
    subtitle: 'Compound meter — two big beats per measure, three eighths each.',
    paragraphs: [
      {
        heading: 'What is compound meter?',
        body: 'Until now, every time signature has been *simple* — each beat divides into two equal halves. In *compound* meter, each beat divides into three. The most common compound meter is 6/8: six eighth notes per measure, but felt as two big beats with three eighths inside each.',
      },
      {
        heading: 'How to feel 6/8',
        body: 'Don\'t count "1-2-3-4-5-6" — that turns 6/8 into a fast 3/4. Instead, count "ONE-and-a, TWO-and-a." Two felt beats per measure. The "ONE" lands on eighth note 1; the "TWO" lands on eighth note 4. Each big beat is a dotted-quarter long.',
      },
      {
        heading: 'Why it matters',
        body: 'Compound meter has a different *lilt* than simple meter — think of a fast jig, a slow ballad in 12/8, or "House of the Rising Sun." Almost any music that swings or has a triplet feel can be notated in compound meter. Once you can feel two big beats with three eighths inside, you\'ll start hearing compound time everywhere.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with the "big beats" only (dotted-quarter feel, hitting eighth note 1 and eighth note 4 of each measure). Then fill in with the inner eighths. Then add rests and ties to make real musical patterns.',
      },
    ],
    goalBpm: 70,
    remember: '6/8 = two big beats per bar, three eighths each. Count "ONE-and-a, TWO-and-a."',
  },

  'mixed-review': {
    title: 'Mixed Review',
    subtitle: 'Combining everything — values, rests, ties, dots, and subdivisions in one piece.',
    paragraphs: [
      {
        heading: 'Why review matters',
        body: 'Each topic so far has focused on one new concept. But real music doesn\'t isolate concepts — a single passage might combine quarter notes, eighth-rest figures, ties across the bar, and dotted patterns all at once. The skill of *integrating* what you\'ve learned is different from any individual technique. This topic builds that skill.',
      },
      {
        heading: 'How to read mixed material',
        body: 'When you encounter dense notation, slow down. Look at the time signature first, then scan the whole measure before tapping. Identify any ties, dots, or rest patterns before you commit to a tempo. It\'s much faster to read accurately at half tempo than to crash through at full speed.',
      },
      {
        heading: 'Spiral review',
        body: 'You\'ll see exercises that look like Basic Rests, exercises that look like Eighth Notes, exercises that look like Dotted Rhythms — but blended into longer phrases. The goal isn\'t to learn anything new; it\'s to make every prior topic feel automatic in context.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels of mixed-content sight reading: Spiral Review A (gentler), Spiral Review B (intermediate), and Checkpoint (the densest). By the end, you should be able to play any combination of Fundamentals topics at goal tempo without preparation.',
      },
    ],
    goalBpm: 80,
    remember: 'Slow down to read it; speed up once it\'s clear in your head.',
  },

  // ── Personal Practice — ten topics for the working musician ──

  'pulse-refresh': {
    title: 'Pulse Refresh',
    subtitle: 'Re-establish the steady beat at the start of every practice session.',
    paragraphs: [
      {
        heading: 'Why this exists',
        body: 'Even experienced players drift when they don\'t practice. After a few days off, your inner clock loses precision. This topic is a short, deliberate warmup that grounds you back in the pulse before you tackle anything harder.',
      },
      {
        heading: 'How to use it',
        body: 'Run through one or two of these exercises at the start of every session — even a 30-second steady-quarter-note tap re-anchors your timing. It\'s the same reason scales and long tones exist for instrumentalists: you\'re re-establishing the body memory of "in time."',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: the simplest pulse drill (quarter notes only), a slightly richer version (quarter + half), and a smooth warmup line that connects your warmup to actual reading.',
      },
    ],
    goalBpm: 80,
    remember: 'Don\'t skip the warmup. Even pros drift between sessions.',
  },

  'core-values--rests': {
    title: 'Core Values + Rests',
    subtitle: 'Quarter, half, whole — and the rests that match them, in flow.',
    paragraphs: [
      {
        heading: 'Why a recap',
        body: 'You\'ve seen these note values and rests in Fundamentals. Personal Practice doesn\'t teach you anything new about them — it makes you fluent. The difference is doing them in flow without thinking, the same way an experienced musician sight-reads a hymn.',
      },
      {
        heading: 'What\'s changed',
        body: 'The patterns get longer (6+ measures instead of 4) and the combinations get less predictable. You\'ll see whole notes arriving on beat 1 of one bar and beat 2 of another. Reading at sight means recognizing patterns instantly, not analyzing them.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels building on note-value fluency: pure note values, then layered rests in flow, then mixed values across longer phrases.',
      },
    ],
    goalBpm: 90,
    remember: 'Read patterns, not individual notes. Recognize, don\'t analyze.',
  },

  'eighth-note-fluency': {
    title: 'Eighth-Note Fluency',
    subtitle: 'From reading eighths to feeling them — making the subdivision automatic.',
    paragraphs: [
      {
        heading: 'What fluency means',
        body: 'In Fundamentals you learned to read eighth notes deliberately. Fluency is when you stop reading them and start *feeling* them. Your hand knows what "two notes per beat" feels like; your eye recognizes beamed pairs without counting; the pulse stays rock-solid even as the rhythm gets dense.',
      },
      {
        heading: 'How to build it',
        body: 'Push tempo gradually. Read the same patterns at 80, 90, 100, 110 BPM. The tempo where you start losing accuracy is your edge — work right at it. Don\'t crash through at full speed and lose the pulse.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Straight eighths (the grid), eighth grooves (mixed with quarters), and eighth syncopation (the gateway to groove). Each level gets denser; tempo can rise as your fluency does.',
      },
    ],
    goalBpm: 100,
    remember: 'Push tempo to where you almost lose accuracy. Work the edge.',
  },

  'groove-syncopation': {
    title: 'Groove Syncopation',
    subtitle: 'Pop and funk syncopation — anticipations on the "and" of beats 2 and 4.',
    paragraphs: [
      {
        heading: 'What is groove syncopation?',
        body: 'Where Simple Syncopation introduced the eighth-quarter-eighth pattern, Groove Syncopation builds the rhythmic vocabulary of contemporary popular music: the backbeat (emphasis on 2 and 4), the anticipation (a note that arrives on the "and" of 4 instead of beat 1), and tied figures that span the bar.',
      },
      {
        heading: 'The anticipation',
        body: 'Listen to almost any pop chorus — the chord change that "should" arrive on beat 1 of the next measure often sneaks in early on the "and" of beat 4. That early entry is an anticipation, and reading it confidently is core groove vocabulary.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Four levels: backbeat patterns, sync loops, syncopation with rests, then groove variations — multi-bar grooves that string everything together. By Level 4 you\'re reading what a real funk or R&B tune looks like on the page.',
      },
    ],
    goalBpm: 90,
    remember: 'Tap your foot on every beat; the syncopation lives between them.',
  },

  'dotted-values': {
    title: 'Dotted Values',
    subtitle: 'Dotted half, dotted quarter, dotted eighth — using dots as phrase shapers.',
    paragraphs: [
      {
        heading: 'Beyond reading dots',
        body: 'In Fundamentals you learned what the dot does mathematically. Now you use it musically: dotted half notes that anchor a phrase, dotted quarter + eighth patterns that pull listeners through a measure, dotted eighth + sixteenth figures that drive a march.',
      },
      {
        heading: 'Phrase-level use',
        body: 'A single dotted note can change the whole feel of a measure. A dotted half on beat 1 of a 3/4 phrase fills the bar with sustained motion; the same notes broken up feel choppy. Reading dots fluently means knowing what they\'re doing musically, not just durationally.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: dotted long (dotted half), dotted quarter (the workhorse pattern), and dotted phrase — multi-bar lines that use dots as shaping devices.',
      },
    ],
    goalBpm: 90,
    remember: 'Dots aren\'t just math; they\'re phrasing. Use them to shape the line.',
  },

  'ties--phrase': {
    title: 'Ties + Phrase',
    subtitle: 'Ties as breath marks — using sustained notes to shape musical phrases.',
    paragraphs: [
      {
        heading: 'Ties as phrasing',
        body: 'A tie sustains a note. Two or three carefully placed ties in a phrase can transform a sequence of separate notes into a flowing line. Where Simple Syncopation used ties for displacement, Ties + Phrase uses them for breath — the same way a singer holds a vowel through a beat to make a melody breathe.',
      },
      {
        heading: 'What changes from Fundamentals',
        body: 'In Fundamentals you read tied notes as durations to count through. Here you read them as *phrase events* — moments where the rhythm wants to breathe. The notation is the same; the interpretation is more musical.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: sustain (ties within a phrase), phrase arc (ties shaping multi-bar lines), and ties across the bar — the most common pop/jazz use case.',
      },
    ],
    goalBpm: 90,
    remember: 'A tied note is a held breath. Use it to shape the phrase.',
  },

  'sixteenth-groove': {
    title: 'Sixteenth Groove',
    subtitle: 'Sixteenth-note grooves with mixed eighth/sixteenth subdivisions.',
    paragraphs: [
      {
        heading: 'What is a sixteenth groove?',
        body: 'A sixteenth groove is a repeating pattern that uses sixteenth-note subdivisions to create a tight, locked-in feel. Funk, R&B, modern pop, and most electronic music live in sixteenth grooves. The pulse is still on the quarter, but the *texture* lives at the sixteenth-note level.',
      },
      {
        heading: 'Pocket and locking in',
        body: 'Pocket means staying perfectly aligned to the underlying grid. A sixteenth groove that\'s slightly behind or ahead of the click loses its tightness immediately. Practice these patterns slowly with the metronome and don\'t speed up until every sixteenth lands cleanly.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Four levels: sixteenth pocket (the basic grid), funk fragments (mixed sixteenth + eighth), mixed groove (sixteenths in conversation with other values), and groove etudes (multi-bar studies).',
      },
    ],
    goalBpm: 95,
    remember: 'Pocket = perfectly aligned to the grid. No fudging individual sixteenths.',
  },

  'compound-meter': {
    title: 'Compound Meter',
    subtitle: '6/8, 9/8, 12/8 — feeling the dotted-quarter pulse at different lengths.',
    paragraphs: [
      {
        heading: 'Beyond 6/8',
        body: 'In Fundamentals you learned 6/8 as two big beats. Compound meter generalizes the idea: 9/8 has three big beats; 12/8 has four. The eighths are still grouped in threes, but the number of *felt* beats per measure changes.',
      },
      {
        heading: 'How to read compound meter at scale',
        body: 'Find the dotted-quarter pulse first. Tap it. Then layer the inner eighth notes on top. The temptation in 12/8 is to over-emphasize every eighth note — resist it. The big beats are the home base.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: two big beats (6/8 review), rolling 12/8 (the slow-ballad feel), and compound space (rests within compound time). All at the same tempo target so you can feel how the meter changes the *grouping* without changing the underlying eighth speed.',
      },
    ],
    goalBpm: 75,
    remember: 'Find the big beats first. The eighths fill in around them.',
  },

  'style-modules': {
    title: 'Style Modules',
    subtitle: 'Straight, swing, latin — same notation read with different feel.',
    paragraphs: [
      {
        heading: 'Notation vs feel',
        body: 'Two musicians can read the same notation and play it completely differently. A jazz player reads "two eighth notes" as long-short (swing); a classical player reads them as equal (straight); a Latin player might read them with a clave-derived inflection. Style is the layer of interpretation on top of the notes.',
      },
      {
        heading: 'What "feel" means',
        body: 'Feel is a small, consistent deviation from the printed grid. Swing eighths aren\'t two equal notes — they\'re roughly a long-short of 2:1, getting more even at fast tempos. Latin eighths often have specific accent patterns. Reading the *style* on top of the notation is the difference between "correct" and "musical."',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: straight style (the default), swing feel (long-short eighths), and latin ostinato (the syncopated pulse of clave-based music). Same notation, three different interpretations.',
      },
    ],
    goalBpm: 95,
    remember: 'Same notes, different feel. Style is on top of the notation, not in it.',
  },

  'reading-etudes': {
    title: 'Reading Etudes',
    subtitle: 'Multi-bar reading studies that combine prior topics into a flowing passage.',
    paragraphs: [
      {
        heading: 'What is an etude?',
        body: 'An etude (French for "study") is a short piece written specifically to practice a skill. Reading etudes are concentrated sight-reading exercises — they\'re longer than the topic-specific drills you\'ve been doing, with denser material and more variety.',
      },
      {
        heading: 'Why they exist',
        body: 'Real music doesn\'t isolate one topic per page. A song from a fakebook might have ties, dots, syncopation, and sixteenth runs all in the same eight bars. Etudes simulate that integration — you\'re no longer practicing one technique at a time.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels at increasing density: short etude (combine 2-3 prior topics), mixed concept (4-5 topics layered), and performance read (full integration, audition-length).',
      },
    ],
    goalBpm: 95,
    remember: 'Etudes don\'t teach a single thing — they integrate everything. Read patterns, not notes.',
  },

  // ── Conservatory Prep — audition-grade rhythmic vocabulary ──

  'precision-pulse': {
    title: 'Precision Pulse',
    subtitle: 'Locking the metronome — precision tap practice for audition-grade timing.',
    paragraphs: [
      {
        heading: 'What "precision" means',
        body: 'Auditioners and conductors are listening for timing accuracy down to roughly 30 milliseconds. That\'s the difference between sounding professional and sounding amateur. Precision Pulse drills your timing to a level where every tap lands inside that window.',
      },
      {
        heading: 'How to develop it',
        body: 'You\'ve been tapping with a metronome the whole time, but at this level you\'re striving for *exact* alignment with every click. Slow tempos make this harder, not easier — there\'s nowhere to hide an imprecise tap when you have a full second to think about it.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: metronome drills (quarter notes only, microscopic precision), subdivision ladders (introducing eighths and sixteenths), and grid independence (executing rhythms while the click stays neutral).',
      },
    ],
    goalBpm: 100,
    remember: 'Auditions listen at 30ms precision. Don\'t hide imprecision behind tempo.',
  },

  'advanced-simple-meter': {
    title: 'Advanced Simple Meter',
    subtitle: 'Dense reading in 4/4 and 3/4 — staying inside the beat at speed.',
    paragraphs: [
      {
        heading: 'Density vs complexity',
        body: 'Up to now, harder material has often meant *new* material — new note values, new patterns. Advanced Simple Meter goes the other direction: it\'s the same vocabulary, but *denser* — more notes per beat, longer phrases, fewer breaks.',
      },
      {
        heading: 'Reading at speed',
        body: 'At audition tempos (110+ BPM), there\'s no time to count individual notes. You read patterns of 4-8 notes at a time as units, the way a fluent reader reads words instead of letters. This topic builds that pattern recognition under time pressure.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: dense reading (more notes, same vocabulary), displacement (off-beat patterns at speed), and stamina (long etudes that don\'t let up).',
      },
    ],
    goalBpm: 110,
    remember: 'Read patterns as units, not individual notes. Counting is too slow at audition tempo.',
  },

  'complex-rests': {
    title: 'Complex Rests',
    subtitle: 'Rests as rhythmic content — silence that drives the line forward.',
    paragraphs: [
      {
        heading: 'Rests as content',
        body: 'In Fundamentals, rests were "places where you don\'t play." In Conservatory Prep, rests *are* the rhythm. Audition repertoire often uses dense rest patterns — eighth rests on weak beats, dotted-eighth rests followed by sixteenths, anticipated silences — to create rhythmic interest without changing the note material.',
      },
      {
        heading: 'Anticipated silence',
        body: 'A note that "should" arrive on a beat but is replaced by a rest creates anticipation. The listener\'s ear expects something and gets nothing — and that nothing is rhythmically *louder* than a note would be. Reading these patterns means feeling the absence as strongly as you feel the notes.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: rests as rhythm (dense rest placement), anticipated silence (rests on expected entries), and rest sync (full rest-driven syncopation).',
      },
    ],
    goalBpm: 100,
    remember: 'Silence is rhythmic content. Feel the absence as strongly as the note.',
  },

  'syncopation-systems': {
    title: 'Syncopation Systems',
    subtitle: 'Systematic displacement patterns — every off-beat position covered.',
    paragraphs: [
      {
        heading: 'Systematic syncopation',
        body: 'In Personal Practice you learned individual syncopation patterns. In Conservatory Prep you study them as a system. Every position in a measure can be the syncopated emphasis: the "and" of 1, the "e" of 2, the "a" of 3, etc. A complete syncopation vocabulary covers all of them.',
      },
      {
        heading: 'Cross-beat and cross-bar',
        body: 'Advanced syncopation displaces the strong beats by entire beat lengths, not just an eighth. A note that "should" be on beat 1 might land on beat 2; a phrase ending might cross the bar line via a tie that obscures the downbeat. These patterns are the rhythmic vocabulary of jazz, modern classical, and most contemporary art music.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Four levels: offbeat families (categorizing the basic displacements), cross-beat (one-beat displacements), cross-bar (displacements that span the measure), and sync synthesis (combining all displacement types in one phrase).',
      },
    ],
    goalBpm: 110,
    remember: 'Every beat position can be displaced. Map the system; don\'t guess pattern by pattern.',
  },

  'dottedtied-complexity': {
    title: 'Dotted/Tied Complexity',
    subtitle: 'Combinations that obscure the beat — dotted ties, layered ties, hemiola.',
    paragraphs: [
      {
        heading: 'When dots and ties conspire',
        body: 'A dotted note tied to another note creates durations that don\'t line up with any single beat boundary. A dotted-quarter tied to a quarter spans 2½ beats — it starts on a beat but ends in the middle of one. Reading these requires both the dot mechanic and the tie mechanic running simultaneously.',
      },
      {
        heading: 'Hemiola',
        body: 'Hemiola is a rhythmic illusion where the meter momentarily feels like it\'s changed without actually changing. Three groups of two eighths in 3/4 can sound like 6/8; two groups of three quarters in 4/4 can sound like 3/2. Composers use hemiola to create rhythmic surprise. Reading it means recognizing the *grouping* the composer is implying, even when the time signature hasn\'t changed.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: compound dotted (dotted patterns in compound meter), dots + ties (the conspiracy), and dotted barlines (dotted figures spanning the bar).',
      },
    ],
    goalBpm: 100,
    remember: 'When dots and ties stack, find the start and end of each held note. Forget the middle.',
  },

  'sixteenth-vocabulary': {
    title: 'Sixteenth Vocabulary',
    subtitle: 'Full sixteenth-note vocabulary including dotted-eighth + sixteenth, sixteenth-rest figures.',
    paragraphs: [
      {
        heading: 'Sixteenth idioms',
        body: 'Sixteenth notes appear in a small number of recurring idioms: four straight sixteenths (a run), dotted-eighth + sixteenth (the "Scotch snap"), sixteenth + dotted-eighth (the reversed snap), eighth + two sixteenths, two sixteenths + eighth. Recognizing these as units instead of reading individual notes is what separates fluent readers from struggling ones.',
      },
      {
        heading: 'Sixteenth rests',
        body: 'A sixteenth rest in a sixteenth-note pattern creates a "ghost" — the listener\'s ear fills in the missing note. Funk drumming, Cuban music, and Bach all use sixteenth rests this way. Reading them fluently means counting the rest as carefully as you\'d count a note.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Four levels: permutation (cycling through every sixteenth-rest position), mixed subdivision (sixteenths against eighths), sixteenth density (heavy sixteenth content), and permutation etude (multi-bar synthesis).',
      },
    ],
    goalBpm: 110,
    remember: 'Read sixteenth idioms as units. Recognize the snap, the run, the ghost.',
  },

  'compound-mastery': {
    title: 'Compound Mastery',
    subtitle: '9/8, 12/8, and complex compound figures — fluent compound reading.',
    paragraphs: [
      {
        heading: 'Beyond 6/8',
        body: 'You\'ve felt 6/8 as two big beats. Compound Mastery extends this to 9/8 (three big beats), 12/8 (four big beats), and the rarer 9/4 and 12/4. The principle is the same: find the dotted-quarter pulse, then layer the inner eighths or sixteenths on top.',
      },
      {
        heading: 'Compound at speed',
        body: 'At fast tempos, compound meter starts feeling more like fast simple meter — but it\'s not. The grouping in threes is still there; it\'s just moving by quickly. Audition repertoire often features fast compound passages where the difference between feeling 12/8 vs 4/4 is the difference between in-style and out-of-style playing.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: compound hierarchy (feeling the layered grouping), compound subdivision (sixteenths in compound time), and compound silence (rest-heavy compound passages).',
      },
    ],
    goalBpm: 80,
    remember: 'Compound is grouped in threes regardless of tempo. Find the dotted-quarter pulse first.',
  },

  'mixed-meter': {
    title: 'Mixed Meter',
    subtitle: 'Bar-to-bar meter changes — 5/8, 7/8, 4/4 → 3/4 transitions.',
    paragraphs: [
      {
        heading: 'What is mixed meter?',
        body: 'Mixed meter is when the time signature changes from measure to measure (or even more frequently). A passage might go 4/4, then 3/4, then 5/8, then back to 4/4 — all within a single phrase. Mixed meter is the rhythmic language of 20th and 21st century concert music, much rock and progressive music, and most non-Western traditions.',
      },
      {
        heading: 'How to read it',
        body: 'The trick is to keep the *underlying eighth note* steady. The number of eighths per measure changes; the speed of each eighth doesn\'t. So a measure of 5/8 followed by 7/8 followed by 4/4 is just five then seven then eight steady eighths. Once you stop trying to "feel beats" and start feeling eighths, mixed meter becomes readable.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: grouping in 5/8, pattern switch (5/8 → 7/8 transitions), and full mixed meter (multi-meter etudes that change every bar).',
      },
    ],
    goalBpm: 100,
    remember: 'Keep the eighth steady. The number of eighths per bar changes; the speed doesn\'t.',
  },

  'polyrhythm-prep': {
    title: 'Polyrhythm Prep',
    subtitle: 'Two-against-three and three-against-four feels at the bar level.',
    paragraphs: [
      {
        heading: 'What is polyrhythm?',
        body: 'Polyrhythm is when two different rhythmic groupings happen simultaneously — for instance, three notes evenly distributed across the time of two beats while another voice plays four notes in the same span. The two grouping systems exist at the same time and disagree about where the beats are. The most common polyrhythms in audition repertoire are 2-against-3 and 3-against-4.',
      },
      {
        heading: 'How to feel it',
        body: 'For 2-against-3, count "1-2-3" while tapping "1-and" — three taps in one hand against two in the other, both lasting the same total time. The hands meet only at the start of each cycle. Practice this with metronome on 1 (the cycle start) until both hands are independent.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Three levels: 2-against-3 (the foundational polyrhythm), embedded poly (polyrhythm inside a longer phrase), and full polyrhythm (multi-bar studies).',
      },
    ],
    goalBpm: 90,
    remember: 'Both groupings last the same total time. They only meet at the cycle start.',
  },

  'performance-etudes': {
    title: 'Performance Etudes',
    subtitle: 'Audition-length etudes that string advanced rhythmic vocabulary together.',
    paragraphs: [
      {
        heading: 'What is a performance etude?',
        body: 'A performance etude is a sight-reading-grade composition — long enough to test endurance, dense enough to test fluency, varied enough to test integration. Audition committees ask you to play one cold to test how you read at sight under pressure. Practicing them is the closest thing to simulating an audition without taking one.',
      },
      {
        heading: 'How to use them',
        body: 'Don\'t practice them. *Sight-read* them. Play once, mark anywhere you stumbled, and move on. Coming back later to "fix" the stumbles defeats the point — you\'re training the skill of reading new material accurately the first time. The only way to build that is to keep encountering new material.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'Four levels: controlled etude (gentler), combined demands (intermediate), jury checkpoint (audition-grade), and final capstone (the longest, densest sight-read in the curriculum).',
      },
    ],
    goalBpm: 110,
    remember: 'Sight-read, don\'t practice. Coming back to "fix" defeats the training.',
  },
}

/** Look up the lesson concept for a topic slug, or null if no concept is configured. */
export function getLessonConcept(categorySlug: string): LessonConcept | null {
  return CONCEPTS[categorySlug] ?? null
}

/** Topics that have a configured concept — used to decide whether to show "Lesson" CTAs. */
export function hasLessonConcept(categorySlug: string): boolean {
  return categorySlug in CONCEPTS
}

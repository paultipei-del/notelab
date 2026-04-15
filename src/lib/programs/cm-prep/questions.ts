export interface MCQuestion {
  q: string
  options: string[]
  answer: string
}

// ── Lesson 1: Grand Staff ──────────────────────────────────────────────────
export const GRAND_STAFF_QUESTIONS: MCQuestion[] = [
  { q: 'How many lines does each staff have?', options: ['3', '4', '5', '6'], answer: '5' },
  { q: 'How many spaces does each staff have?', options: ['3', '4', '5', '6'], answer: '4' },
  { q: 'What is the curved bracket that joins the treble and bass staves called?', options: ['Bar line', 'Brace', 'Tie', 'Slur'], answer: 'Brace' },
  { q: 'The space between two bar lines is called a...', options: ['Beat', 'Phrase', 'Measure', 'Section'], answer: 'Measure' },
  { q: 'Which staff is used for higher-pitched notes?', options: ['Bass staff', 'Treble staff', 'Alto staff', 'Tenor staff'], answer: 'Treble staff' },
  { q: 'The bass clef is also called the...', options: ['G clef', 'F clef', 'C clef', 'B clef'], answer: 'F clef' },
  { q: 'The treble clef is also called the...', options: ['F clef', 'C clef', 'G clef', 'D clef'], answer: 'G clef' },
  { q: 'When treble and bass staves are combined, the result is called the...', options: ['Double staff', 'Full staff', 'Grand staff', 'Open staff'], answer: 'Grand staff' },
  { q: 'Staff lines are numbered...', options: ['Top to bottom, starting at 1', 'Bottom to top, starting at 1', 'Left to right', 'Right to left'], answer: 'Bottom to top, starting at 1' },
  { q: 'The treble clef anchors which letter name on its second line?', options: ['E', 'F', 'G', 'A'], answer: 'G' },
  { q: 'The bass clef anchors which letter name on its fourth line?', options: ['D', 'E', 'F', 'G'], answer: 'F' },
  { q: 'A vertical line on the staff that divides music into measures is called a...', options: ['Clef', 'Brace', 'Bar line', 'Rest'], answer: 'Bar line' },
]

// ── Lesson 5: Sharps, Flats, Naturals ─────────────────────────────────────
export const ACCIDENTALS_QUESTIONS: MCQuestion[] = [
  { q: 'A sharp sign (♯) raises a note by...', options: ['A whole step', 'A half step', 'Two half steps', 'An octave'], answer: 'A half step' },
  { q: 'A flat sign (♭) lowers a note by...', options: ['A whole step', 'Two half steps', 'A half step', 'An octave'], answer: 'A half step' },
  { q: 'What does a natural sign (♮) do?', options: ['Raises the note', 'Lowers the note', 'Cancels a previous sharp or flat', 'Doubles the note value'], answer: 'Cancels a previous sharp or flat' },
  { q: 'Accidentals apply for the rest of...', options: ['The piece', 'The phrase', 'The measure', 'The page'], answer: 'The measure' },
  { q: 'On a piano, a sharp moves one key...', options: ['To the left', 'To the right', 'Upward', 'Downward'], answer: 'To the right' },
  { q: 'On a piano, a flat moves one key...', options: ['To the right', 'To the left', 'Two keys right', 'Two keys left'], answer: 'To the left' },
  { q: 'C♯ and D♭ sound the same. They are called...', options: ['Parallel notes', 'Enharmonic equivalents', 'Chromatic pairs', 'Mirror notes'], answer: 'Enharmonic equivalents' },
  { q: 'A double sharp raises a note by...', options: ['One half step', 'Three half steps', 'Two half steps (a whole step)', 'One whole step and a half'], answer: 'Two half steps (a whole step)' },
  { q: 'Which symbol lowers B by a half step?', options: ['B♯', 'B♮', 'B♭', 'Bb♮'], answer: 'B♭' },
  { q: 'If a note is marked sharp in a measure, the next note on the same pitch in that same measure is...', options: ['Also sharp', 'Natural by default', 'Always flat', 'Unaffected'], answer: 'Also sharp' },
]

// ── Lesson 6: Half Steps and Whole Steps ──────────────────────────────────
export const STEPS_QUESTIONS: MCQuestion[] = [
  { q: 'A half step is the distance from one key to...', options: ['The key two away', 'The very next key (no keys between)', 'The same key an octave up', 'The key three away'], answer: 'The very next key (no keys between)' },
  { q: 'A whole step equals how many half steps?', options: ['1', '2', '3', '4'], answer: '2' },
  { q: 'From E to F on the piano is a...', options: ['Whole step', 'Half step', 'Minor third', 'Major second'], answer: 'Half step' },
  { q: 'From B to C on the piano is a...', options: ['Whole step', 'Minor second', 'Half step', 'Major second'], answer: 'Half step' },
  { q: 'From C to D on the piano is a...', options: ['Half step', 'Whole step', 'Minor third', 'Major third'], answer: 'Whole step' },
  { q: 'From E to F# is a...', options: ['Half step', 'Whole step', 'Minor third', 'Major third'], answer: 'Whole step' },
  { q: 'On the piano, which pair of white keys has no black key between them?', options: ['C and D', 'D and E', 'E and F', 'G and A'], answer: 'E and F' },
  { q: 'The step from C to C# is a...', options: ['Whole step', 'Half step', 'Minor second', 'Minor third'], answer: 'Half step' },
  { q: 'Two whole steps equal how many half steps?', options: ['2', '3', '4', '5'], answer: '4' },
  { q: 'Which two adjacent white keys also have no black key between them?', options: ['C–D', 'A–B', 'B–C', 'F–G'], answer: 'B–C' },
]

// ── Lesson 7: Intervals ────────────────────────────────────────────────────
export const INTERVALS_QUESTIONS: MCQuestion[] = [
  { q: 'An interval spanning two adjacent letter names is called a...', options: ['Unison', '2nd', '3rd', '4th'], answer: '2nd' },
  { q: 'An interval skipping one letter name (e.g., C to E) is called a...', options: ['2nd', '3rd', '4th', '5th'], answer: '3rd' },
  { q: 'C up to F is what interval?', options: ['2nd', '3rd', '4th', '5th'], answer: '4th' },
  { q: 'C up to G is what interval?', options: ['3rd', '4th', '5th', '6th'], answer: '5th' },
  { q: 'On the staff, a 2nd always moves from...', options: ['Line to line or space to space', 'Line to space or space to line', 'Any position to any position', 'Bottom line to top line'], answer: 'Line to space or space to line' },
  { q: 'On the staff, a 3rd always moves from...', options: ['Line to space or space to line', 'Line to line or space to space', 'Line to top space', 'Bottom to top'], answer: 'Line to line or space to space' },
  { q: 'When counting an interval, you...', options: ['Count only the notes between', 'Count both the starting and ending notes', 'Count half steps only', 'Start counting at 0'], answer: 'Count both the starting and ending notes' },
  { q: 'D up to A is what interval?', options: ['3rd', '4th', '5th', '6th'], answer: '5th' },
  { q: 'G up to B is what interval?', options: ['2nd', '3rd', '4th', '5th'], answer: '3rd' },
  { q: 'A to B is what interval?', options: ['Unison', '2nd', '3rd', '4th'], answer: '2nd' },
  { q: 'F up to C is what interval?', options: ['3rd', '4th', '5th', '6th'], answer: '5th' },
  { q: 'E up to A is what interval?', options: ['2nd', '3rd', '4th', '5th'], answer: '4th' },
]

// ── Lesson 8: Major Five-Finger Patterns & Triads ─────────────────────────
export const MAJOR_PATTERNS_QUESTIONS: MCQuestion[] = [
  { q: 'What is the step formula for a major five-finger pattern?', options: ['W H W W', 'H W W H', 'W W H W', 'W W W H'], answer: 'W W H W' },
  { q: 'A major five-finger pattern sounds...', options: ['Dark and expressive', 'Tense and dissonant', 'Bright and settled', 'Unstable'], answer: 'Bright and settled' },
  { q: 'The C major five-finger pattern uses which notes?', options: ['C D E F# G', 'C D Eb F G', 'C D E F G', 'C Db E F G'], answer: 'C D E F G' },
  { q: 'The G major five-finger pattern uses which notes?', options: ['G A B C D', 'G A Bb C D', 'G Ab B C D', 'G A B C D#'], answer: 'G A B C D' },
  { q: 'The F major five-finger pattern uses which notes?', options: ['F G A B C', 'F G Ab Bb C', 'F G A Bb C', 'F Gb A Bb C'], answer: 'F G A Bb C' },
  { q: 'The D major five-finger pattern uses which notes?', options: ['D E F G A', 'D E F# G A', 'D Eb F# G A', 'D E F# G# A'], answer: 'D E F# G A' },
  { q: 'A triad is built from the...', options: ['1st, 2nd, and 3rd notes', '1st, 3rd, and 5th notes', '1st, 4th, and 5th notes', '2nd, 4th, and 6th notes'], answer: '1st, 3rd, and 5th notes' },
  { q: 'The C major triad is...', options: ['C E G', 'C Eb G', 'C E G#', 'C D G'], answer: 'C E G' },
  { q: 'The G major triad is...', options: ['G B D', 'G Bb D', 'G B D#', 'G A D'], answer: 'G B D' },
  { q: 'The F major triad is...', options: ['F A C', 'F Ab C', 'F A C#', 'F G C'], answer: 'F A C' },
  { q: 'The D major triad is...', options: ['D F A', 'D F# A', 'D Eb A', 'D F# A#'], answer: 'D F# A' },
  { q: 'A triad in root position has the...', options: ['3rd in the lowest position', '5th in the lowest position', 'Root in the lowest position', 'Any note in the lowest position'], answer: 'Root in the lowest position' },
]

// ── Lesson 9: Minor Five-Finger Patterns & Triads ─────────────────────────
export const MINOR_PATTERNS_QUESTIONS: MCQuestion[] = [
  { q: 'What is the step formula for a minor five-finger pattern?', options: ['W W H W', 'H W W H', 'W H W W', 'H H W W'], answer: 'W H W W' },
  { q: 'Compared to major, a minor five-finger pattern sounds...', options: ['Brighter and more stable', 'Darker and more expressive', 'Exactly the same', 'Louder and more energetic'], answer: 'Darker and more expressive' },
  { q: 'To convert a major five-finger pattern to minor, you lower which note?', options: ['The 1st (root)', 'The 2nd', 'The 3rd', 'The 5th'], answer: 'The 3rd' },
  { q: 'The c minor five-finger pattern uses which notes?', options: ['C D E F G', 'C D Eb F G', 'C Db Eb F G', 'C D E Fb G'], answer: 'C D Eb F G' },
  { q: 'The g minor five-finger pattern uses which notes?', options: ['G A B C D', 'G A Bb C D', 'G Ab Bb C D', 'G A Bb Cb D'], answer: 'G A Bb C D' },
  { q: 'The f minor five-finger pattern uses which notes?', options: ['F G A Bb C', 'F G Ab Bb C', 'F Gb Ab Bb C', 'F G A B C'], answer: 'F G Ab Bb C' },
  { q: 'The d minor five-finger pattern uses which notes?', options: ['D E F# G A', 'D Eb F G A', 'D E F G A', 'D Eb F# G A'], answer: 'D E F G A' },
  { q: 'The c minor triad is...', options: ['C E G', 'C Eb G', 'C E Gb', 'C Db G'], answer: 'C Eb G' },
  { q: 'The g minor triad is...', options: ['G B D', 'G Bb Db', 'G Bb D', 'G B Db'], answer: 'G Bb D' },
  { q: 'The d minor triad is...', options: ['D F# A', 'D F A', 'D Eb A', 'D F Ab'], answer: 'D F A' },
  { q: 'A minor triad has a minor third...', options: ['On top', 'On the bottom', 'In the middle', 'It has no thirds'], answer: 'On the bottom' },
]

// ── Review: Patterns (combined from lessons 8 & 9) ────────────────────────
export const REVIEW_PATTERNS_QUESTIONS: MCQuestion[] = [
  { q: 'What is the step formula for a MAJOR five-finger pattern?', options: ['W H W W', 'H W W H', 'W W H W', 'W W W H'], answer: 'W W H W' },
  { q: 'What is the step formula for a MINOR five-finger pattern?', options: ['W W H W', 'H W W H', 'W H W W', 'H H W W'], answer: 'W H W W' },
  { q: 'The C major triad is C–E–G. The c minor triad is...', options: ['C–Eb–G', 'C–E–Gb', 'C–Db–G', 'C–Eb–Gb'], answer: 'C–Eb–G' },
  { q: 'The G major triad is G–B–D. The g minor triad is...', options: ['G–Bb–D', 'G–B–Db', 'G–Bb–Db', 'G–Ab–D'], answer: 'G–Bb–D' },
  { q: 'Which note is lowered when moving from a major to a minor five-finger pattern?', options: ['The root', 'The 2nd', 'The 3rd', 'The 5th'], answer: 'The 3rd' },
  { q: 'The D major five-finger pattern: D E F# G A. The d minor pattern is...', options: ['D E F G A', 'D Eb F G A', 'D E F# Gb A', 'D Db F G A'], answer: 'D E F G A' },
  { q: 'A major triad has a major third on the...', options: ['Top', 'Middle', 'Bottom', 'Outside'], answer: 'Bottom' },
  { q: 'A minor triad has a minor third on the...', options: ['Top', 'Middle', 'Bottom', 'Outside'], answer: 'Bottom' },
  { q: 'The F major triad is F–A–C. The f minor triad is...', options: ['F–Ab–C', 'F–A–Cb', 'F–Ab–Cb', 'F–G–C'], answer: 'F–Ab–C' },
  { q: 'In a triad, the distance from root to fifth is always a...', options: ['3rd', '4th', '5th', '6th'], answer: '5th' },
]

// ── Lesson 10: Key Signatures ─────────────────────────────────────────────
export const KEY_SIGNATURES_QUESTIONS: MCQuestion[] = [
  { q: 'C major has how many sharps or flats in its key signature?', options: ['None', '1 sharp', '1 flat', '2 sharps'], answer: 'None' },
  { q: 'G major has which key signature?', options: ['No sharps or flats', '1 flat (Bb)', '1 sharp (F#)', '2 sharps'], answer: '1 sharp (F#)' },
  { q: 'F major has which key signature?', options: ['1 sharp (F#)', '1 flat (Bb)', 'No sharps or flats', '2 flats'], answer: '1 flat (Bb)' },
  { q: 'Where does a key signature appear on the staff?', options: ['At the end of the piece', 'After the clef, before the time signature', 'After the time signature', 'At each bar line'], answer: 'After the clef, before the time signature' },
  { q: 'A key signature tells you...', options: ['The tempo of the piece', 'Which notes are consistently sharp or flat', 'How many beats per measure', 'The dynamic level'], answer: 'Which notes are consistently sharp or flat' },
  { q: 'In G major, which note is always sharp?', options: ['C', 'D', 'E', 'F'], answer: 'F' },
  { q: 'In F major, which note is always flat?', options: ['A', 'B', 'C', 'E'], answer: 'B' },
  { q: 'Key signatures apply to...', options: ['Just the first measure', 'The entire piece (unless cancelled)', 'Only notes on the staff line shown', 'Only forte passages'], answer: 'The entire piece (unless cancelled)' },
  { q: 'If you see one sharp in the key signature, you are likely in...', options: ['C major', 'F major', 'G major', 'D major'], answer: 'G major' },
  { q: 'If you see one flat in the key signature, you are likely in...', options: ['G major', 'F major', 'C major', 'Bb major'], answer: 'F major' },
]

// ── Lesson 11: Major Scales ────────────────────────────────────────────────
export const MAJOR_SCALES_QUESTIONS: MCQuestion[] = [
  { q: 'The step formula for a major scale is...', options: ['W H W W W H W', 'W W W H W W H', 'W W H W W W H', 'H W W W H W W'], answer: 'W W H W W W H' },
  { q: 'The C major scale uses which notes?', options: ['C D E F G A B C', 'C D Eb F G Ab Bb C', 'C D E F# G A B C', 'C Db E F G A Bb C'], answer: 'C D E F G A B C' },
  { q: 'The G major scale uses which notes?', options: ['G A B C D E F G', 'G A Bb C D E F# G', 'G A B C D E F# G', 'G Ab B C D Eb F# G'], answer: 'G A B C D E F# G' },
  { q: 'The F major scale uses which notes?', options: ['F G A B C D E F', 'F G A Bb C D E F', 'F G Ab Bb C D E F', 'F G A Bb C Db E F'], answer: 'F G A Bb C D E F' },
  { q: 'A major scale has how many notes (including the repeated tonic)?', options: ['5', '6', '7', '8'], answer: '8' },
  { q: 'Where does the half step occur in a major scale (counting from the bottom)?', options: ['2–3 and 6–7', '1–2 and 5–6', '3–4 and 7–8', '4–5 and 8–9'], answer: '3–4 and 7–8' },
  { q: 'G major has one sharp. That sharp is...', options: ['C#', 'D#', 'E#', 'F#'], answer: 'F#' },
  { q: 'F major has one flat. That flat is...', options: ['Ab', 'Bb', 'Cb', 'Db'], answer: 'Bb' },
  { q: 'The 8th note of a major scale is the same as the 1st, but...', options: ['Lower by a half step', 'Higher by an octave', 'Lower by a whole step', 'The same pitch'], answer: 'Higher by an octave' },
  { q: 'Which scale has no sharps or flats?', options: ['G major', 'F major', 'D major', 'C major'], answer: 'C major' },
]

// ── Lesson 12: Time Signatures ────────────────────────────────────────────
export const TIME_SIG_QUESTIONS: MCQuestion[] = [
  { q: 'In a time signature, the top number tells you...', options: ['Which note gets the beat', 'How many beats are in each measure', 'The tempo', 'The dynamic level'], answer: 'How many beats are in each measure' },
  { q: 'In a time signature, the bottom number tells you...', options: ['How many measures in the piece', 'How many beats per measure', 'Which note value receives one beat', 'The key signature'], answer: 'Which note value receives one beat' },
  { q: 'When the bottom number is 4, which note gets one beat?', options: ['Whole note', 'Half note', 'Quarter note', 'Eighth note'], answer: 'Quarter note' },
  { q: 'In 4/4 time, how many beats are in each measure?', options: ['2', '3', '4', '6'], answer: '4' },
  { q: 'In 3/4 time, how many beats are in each measure?', options: ['2', '3', '4', '6'], answer: '3' },
  { q: 'In 2/4 time, how many beats are in each measure?', options: ['1', '2', '3', '4'], answer: '2' },
  { q: 'A whole note in 4/4 time receives how many beats?', options: ['1', '2', '3', '4'], answer: '4' },
  { q: 'A half note receives how many beats (when the quarter gets the beat)?', options: ['1', '2', '3', '4'], answer: '2' },
  { q: 'A quarter note receives how many beats (when the quarter gets the beat)?', options: ['½', '1', '2', '3'], answer: '1' },
  { q: 'An eighth note receives how many beats (when the quarter gets the beat)?', options: ['¼', '½', '1', '2'], answer: '½' },
  { q: 'A whole rest represents...', options: ['One beat of silence', 'Two beats of silence', 'Four beats of silence', 'An entire measure of silence in any time signature'], answer: 'An entire measure of silence in any time signature' },
  { q: 'A half rest sits...', options: ['Hanging below a line', 'On top of a line', 'In a space', 'Across the whole staff'], answer: 'On top of a line' },
]

// ── Mixed quizzes (reviews) ────────────────────────────────────────────────
// Review 1–9: draw from lessons 1, 5, 6, 7, 8, 9
export const REVIEW_1_9_QUESTIONS: MCQuestion[] = [
  ...GRAND_STAFF_QUESTIONS.slice(0, 4),
  ...ACCIDENTALS_QUESTIONS.slice(0, 3),
  ...STEPS_QUESTIONS.slice(0, 3),
  ...INTERVALS_QUESTIONS.slice(0, 4),
  ...MAJOR_PATTERNS_QUESTIONS.slice(0, 3),
  ...MINOR_PATTERNS_QUESTIONS.slice(0, 3),
]

// Review 10–13: draw from lessons 10, 11, 12 (signs & terms handled separately)
export const REVIEW_10_13_QUESTIONS: MCQuestion[] = [
  ...KEY_SIGNATURES_QUESTIONS.slice(0, 4),
  ...MAJOR_SCALES_QUESTIONS.slice(0, 4),
  ...TIME_SIG_QUESTIONS.slice(0, 5),
  { q: 'What does "forte" (f) mean?', options: ['Soft', 'Loud', 'Medium', 'Gradually louder'], answer: 'Loud' },
  { q: 'What does "piano" (p) mean?', options: ['Loud', 'Gradually slower', 'Soft', 'With emphasis'], answer: 'Soft' },
  { q: 'What does "ritardando" (rit.) mean?', options: ['Gradually louder', 'Gradually softer', 'Return to original tempo', 'Gradually slower'], answer: 'Gradually slower' },
  { q: 'A slur connects two or more different pitches and means...', options: ['Hold extra long', 'Play detached', 'Play smoothly (legato)', 'Repeat the passage'], answer: 'Play smoothly (legato)' },
]

// Review Test: comprehensive sample
export const REVIEW_TEST_QUESTIONS: MCQuestion[] = [
  ...GRAND_STAFF_QUESTIONS.slice(0, 3),
  ...ACCIDENTALS_QUESTIONS.slice(0, 2),
  ...STEPS_QUESTIONS.slice(0, 2),
  ...INTERVALS_QUESTIONS.slice(0, 3),
  ...MAJOR_PATTERNS_QUESTIONS.slice(0, 2),
  ...MINOR_PATTERNS_QUESTIONS.slice(0, 2),
  ...KEY_SIGNATURES_QUESTIONS.slice(0, 3),
  ...MAJOR_SCALES_QUESTIONS.slice(0, 3),
  ...TIME_SIG_QUESTIONS.slice(0, 4),
  { q: 'What does "a tempo" mean?', options: ['Gradually faster', 'Return to the original tempo', 'Gradually slower', 'Hold the note longer'], answer: 'Return to the original tempo' },
  { q: 'What does "D.C. al Fine" mean?', options: ['Go to the coda', 'Gradually slower', 'Return to the beginning, play to Fine', 'Repeat the last measure'], answer: 'Return to the beginning, play to Fine' },
  { q: 'A fermata tells you to...', options: ['Repeat from the beginning', 'Play louder', 'Hold the note longer than its written value', 'Play softer'], answer: 'Hold the note longer than its written value' },
]

// ── Note pools for staff quiz sessions ────────────────────────────────────

export interface StaffNoteItem {
  note: string
  clef: 'treble' | 'bass'
  answer: string  // letter name only (A–G)
}

// Treble: C4 (middle C ledger), D4–G5 (all natural, no ledger except C4)
export const TREBLE_NOTE_POOL: StaffNoteItem[] = [
  { note: 'C4', clef: 'treble', answer: 'C' },
  { note: 'D4', clef: 'treble', answer: 'D' },
  { note: 'E4', clef: 'treble', answer: 'E' },
  { note: 'F4', clef: 'treble', answer: 'F' },
  { note: 'G4', clef: 'treble', answer: 'G' },
  { note: 'A4', clef: 'treble', answer: 'A' },
  { note: 'B4', clef: 'treble', answer: 'B' },
  { note: 'C5', clef: 'treble', answer: 'C' },
  { note: 'D5', clef: 'treble', answer: 'D' },
  { note: 'E5', clef: 'treble', answer: 'E' },
  { note: 'F5', clef: 'treble', answer: 'F' },
  { note: 'G5', clef: 'treble', answer: 'G' },
]

// Bass: G2–C4 (C4 = middle C on first ledger above bass staff)
export const BASS_NOTE_POOL: StaffNoteItem[] = [
  { note: 'G2', clef: 'bass', answer: 'G' },
  { note: 'A2', clef: 'bass', answer: 'A' },
  { note: 'B2', clef: 'bass', answer: 'B' },
  { note: 'C3', clef: 'bass', answer: 'C' },
  { note: 'D3', clef: 'bass', answer: 'D' },
  { note: 'E3', clef: 'bass', answer: 'E' },
  { note: 'F3', clef: 'bass', answer: 'F' },
  { note: 'G3', clef: 'bass', answer: 'G' },
  { note: 'A3', clef: 'bass', answer: 'A' },
  { note: 'B3', clef: 'bass', answer: 'B' },
  { note: 'C4', clef: 'bass', answer: 'C' },
]

export const MIXED_NOTE_POOL: StaffNoteItem[] = [
  ...TREBLE_NOTE_POOL,
  ...BASS_NOTE_POOL,
]

// Line/space classification for treble staff
export interface LineSpaceItem {
  note: string
  clef: 'treble'
  isLine: boolean
}

// Treble staff: lines = E4, G4, B4, D5, F5 | spaces = F4, A4, C5, E5
export const LINE_SPACE_POOL: LineSpaceItem[] = [
  { note: 'E4', clef: 'treble', isLine: true },
  { note: 'F4', clef: 'treble', isLine: false },
  { note: 'G4', clef: 'treble', isLine: true },
  { note: 'A4', clef: 'treble', isLine: false },
  { note: 'B4', clef: 'treble', isLine: true },
  { note: 'C5', clef: 'treble', isLine: false },
  { note: 'D5', clef: 'treble', isLine: true },
  { note: 'E5', clef: 'treble', isLine: false },
  { note: 'F5', clef: 'treble', isLine: true },
  { note: 'G5', clef: 'treble', isLine: false },
]

// Selects questions for a given lesson slug
export function getQuestionsForLesson(slug: string): MCQuestion[] {
  switch (slug) {
    case 'grand-staff': return GRAND_STAFF_QUESTIONS
    case 'sharps-flats-naturals': return ACCIDENTALS_QUESTIONS
    case 'half-whole-steps': return STEPS_QUESTIONS
    case 'intervals': return INTERVALS_QUESTIONS
    case 'major-patterns': return MAJOR_PATTERNS_QUESTIONS
    case 'minor-patterns': return MINOR_PATTERNS_QUESTIONS
    case 'review-patterns': return REVIEW_PATTERNS_QUESTIONS
    case 'review-lessons-1-9': return REVIEW_1_9_QUESTIONS
    case 'key-signatures': return KEY_SIGNATURES_QUESTIONS
    case 'major-scales': return MAJOR_SCALES_QUESTIONS
    case 'time-signatures': return TIME_SIG_QUESTIONS
    case 'review-lessons-10-13': return REVIEW_10_13_QUESTIONS
    case 'review-test': return REVIEW_TEST_QUESTIONS
    default: return []
  }
}

export function getNotePoolForLesson(slug: string): StaffNoteItem[] {
  switch (slug) {
    case 'treble-clef-notes': return TREBLE_NOTE_POOL
    case 'bass-clef-notes': return BASS_NOTE_POOL
    case 'review-letter-names': return MIXED_NOTE_POOL
    default: return MIXED_NOTE_POOL
  }
}

/** Fisher-Yates shuffle */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

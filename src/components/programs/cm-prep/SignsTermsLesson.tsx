'use client'

import { useMemo, useRef, useState } from 'react'
import { NotationSymbol } from './visuals/NotationSymbols'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const DARK    = '#1A1A18'
const GREY    = '#7A7060'
const ACCENT  = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG   = '#a0381c'

// Matches the preparatory.ts card ids 101–119.
export interface SignCard { id: number; term: string; def: string }

export const SIGN_CARDS: SignCard[] = [
  { id: 101, term: 'a tempo',                def: 'Return to the original tempo' },
  { id: 102, term: 'Accent',                 def: 'With emphasis or stress on a note' },
  { id: 103, term: 'Bar line',               def: 'A vertical line that separates notes on the staff into measures' },
  { id: 104, term: 'Bass clef (F clef)',     def: 'Names the fourth line of the bass staff, used for lower notes' },
  { id: 105, term: 'Brace',                  def: 'A wavy line that joins the treble and bass staves of a grand staff' },
  { id: 106, term: 'Da Capo al Fine',        def: 'Return to the beginning, play to Fine (the end)' },
  { id: 107, term: 'Dynamics',               def: 'Symbols or terms that indicate loud or soft · variations in volume' },
  { id: 108, term: 'Fermata',                def: 'Hold longer · sustain the note beyond its normal value' },
  { id: 109, term: 'Fine',                   def: 'The end' },
  { id: 110, term: 'Forte (f)',              def: 'Loud' },
  { id: 111, term: 'Grand staff',            def: 'Two staves joined together by a brace · treble and bass clef combined' },
  { id: 112, term: 'Measure',                def: 'The space between two bar lines' },
  { id: 113, term: 'Piano',                  def: 'Soft' },
  { id: 114, term: 'Repeat sign',            def: 'A sign with two dots that indicates a section of music should be repeated' },
  { id: 115, term: 'Ritardando / rit.',      def: 'Gradually slower' },
  { id: 116, term: 'Slur',                   def: 'A curved line connecting two or more different pitches · play smoothly (legato)' },
  { id: 117, term: 'Staccato',               def: 'Separated, detached, not connected' },
  { id: 118, term: 'Tie',                    def: 'A curved line connecting notes of the same pitch · hold for full value, do not re-strike' },
  { id: 119, term: 'Treble clef (G clef)',   def: 'Names the second line of the treble staff, used for higher notes' },
]

// Category mapping for Ex 4
type Category = 'Dynamics' | 'Articulation' | 'Tempo' | 'Form & Structure'
const CATEGORIES: Category[] = ['Dynamics', 'Articulation', 'Tempo', 'Form & Structure']

const CARD_CATEGORY: Record<number, Category> = {
  101: 'Tempo',
  102: 'Articulation',
  103: 'Form & Structure',
  104: 'Form & Structure',
  105: 'Form & Structure',
  106: 'Form & Structure',
  107: 'Dynamics',
  108: 'Articulation',
  109: 'Form & Structure',
  110: 'Dynamics',
  111: 'Form & Structure',
  112: 'Form & Structure',
  113: 'Dynamics',
  114: 'Form & Structure',
  115: 'Tempo',
  116: 'Articulation',
  117: 'Articulation',
  118: 'Articulation',
  119: 'Form & Structure',
}

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }
function byId(id: number): SignCard { return SIGN_CARDS.find(c => c.id === id)! }

// ── UI primitives ─────────────────────────────────────────────────────────
function ProgressBar({ done, total, color = ACCENT }: { done: number; total: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: color,
          borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
        {done + 1} / {total}
      </span>
    </div>
  )
}

function ExerciseLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
      {children}
    </p>
  )
}

// ── Ex 1: Match the sign with its definition ──────────────────────────────
function MatchEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(SIGN_CARDS).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const options = useMemo(() => {
    const others = SIGN_CARDS.filter(c => c.id !== item.id).map(c => c.def)
    return shuffled([item.def, ...shuffled(others).slice(0, 3)])
  }, [item])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.def
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1400 : 2600)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 1 · Match the sign with its definition</ExerciseLabel>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <div style={{ background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: 14,
        padding: '18px 20px 12px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 120, marginBottom: 4 }}>
          <NotationSymbol cardId={item.id} />
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500,
          color: DARK, textAlign: 'center', margin: '0 0 2px' }}>{item.term}</p>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.6,
        margin: '0 0 10px', textAlign: 'center' }}>
        Which definition matches this sign or term?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {options.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === item.def} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<><strong style={{ color: CORRECT }}>{item.term}</strong> means:{' '}
          <strong style={{ color: CORRECT }}>{item.def}</strong></>} />
    </div>
  )
}

// ── Ex 2: Identify the sign (symbol → term) ───────────────────────────────
function IdentifyEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(SIGN_CARDS).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const options = useMemo(() => {
    const others = SIGN_CARDS.filter(c => c.id !== item.id).map(c => c.term)
    return shuffled([item.term, ...shuffled(others).slice(0, 3)])
  }, [item])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.term
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1100 : 2200)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 2 · Identify the sign</ExerciseLabel>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <div style={{ background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: 14,
        padding: '22px 20px', marginBottom: 14, minHeight: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NotationSymbol cardId={item.id} />
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.6,
        margin: '0 0 10px', textAlign: 'center' }}>
        What is this sign or term called?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {options.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === item.term} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<>This is <strong style={{ color: CORRECT }}>{item.term}</strong></>} />
    </div>
  )
}

// ── Ex 3: Memory match (pair symbols with terms) ──────────────────────────
interface MatchSlot { pairId: number; type: 'symbol' | 'term' }
const MEMORY_PAIR_COUNT = 4

function MemoryMatchEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  // Initialize a shuffled 4×2 grid of 4 pairs.
  const [slots] = useState<MatchSlot[]>(() => {
    const pairs = shuffled(SIGN_CARDS).slice(0, MEMORY_PAIR_COUNT).map(c => c.id)
    const entries: MatchSlot[] = pairs.flatMap(pid => [
      { pairId: pid, type: 'symbol' as const },
      { pairId: pid, type: 'term' as const },
    ])
    return shuffled(entries)
  })
  const [flipped,   setFlipped]   = useState<number[]>([])   // slot indices currently revealed
  const [matched,   setMatched]   = useState<Set<number>>(new Set())  // pair ids completed
  const [mistakes,  setMistakes]  = useState(0)
  const [done,      setDone]      = useState(false)
  const lockedRef = useRef(false)

  function tap(slotIdx: number) {
    if (lockedRef.current || done) return
    if (flipped.includes(slotIdx)) return
    if (matched.has(slots[slotIdx].pairId)) return

    const nextFlipped = [...flipped, slotIdx]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      lockedRef.current = true
      const [a, b] = nextFlipped
      const cardA = slots[a], cardB = slots[b]
      const isMatch = cardA.pairId === cardB.pairId && cardA.type !== cardB.type
      setTimeout(() => {
        if (isMatch) {
          const newMatched = new Set(matched)
          newMatched.add(cardA.pairId)
          setMatched(newMatched)
          setFlipped([])
          if (newMatched.size === MEMORY_PAIR_COUNT) {
            setDone(true)
            // Score: perfect if no mistakes, degrades with extras
            const rawScore = MEMORY_PAIR_COUNT - Math.min(mistakes, MEMORY_PAIR_COUNT) * 0.5
            const final = Math.max(rawScore, 1)
            setTimeout(() => onDone(final, MEMORY_PAIR_COUNT), 1200)
          }
        } else {
          setMistakes(m => m + 1)
          setFlipped([])
        }
        lockedRef.current = false
      }, isMatch ? 700 : 1100)
    }
  }

  return (
    <div>
      <ExerciseLabel>Exercise 3 · Memory match</ExerciseLabel>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.6, margin: '0 0 14px' }}>
        Tap two cards at a time to flip them. When a <strong style={{ color: DARK }}>symbol</strong>
        {' '}and its <strong style={{ color: DARK }}>term</strong> match, they stay face-up. Clear the
        board with as few wrong flips as possible.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, fontFamily: F, fontSize: 13, color: GREY }}>
        <span>Matched: <strong style={{ color: CORRECT }}>{matched.size}</strong> / {MEMORY_PAIR_COUNT}</span>
        <span>Mistakes: <strong style={{ color: mistakes === 0 ? DARK : WRONG }}>{mistakes}</strong></span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 10, marginBottom: 14,
      }}>
        {slots.map((slot, i) => {
          const isMatched = matched.has(slot.pairId)
          const isFlipped = flipped.includes(i) || isMatched
          return (
            <MemoryCard key={i} slot={slot} visible={isFlipped} matched={isMatched}
              onClick={() => tap(i)} />
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: done ? CORRECT : '#B0ACA4' }}>
        {done && `✓ All ${MEMORY_PAIR_COUNT} pairs matched${mistakes > 0 ? ` with ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ' with no mistakes'}.`}
      </p>
    </div>
  )
}

function MemoryCard({ slot, visible, matched, onClick }: {
  slot: MatchSlot; visible: boolean; matched: boolean; onClick: () => void
}) {
  const card = byId(slot.pairId)
  return (
    <button onClick={onClick} disabled={matched}
      style={{
        background: matched ? 'rgba(42,107,30,0.08)' : visible ? 'white' : '#ECE3CC',
        border: `1.5px solid ${matched ? 'rgba(42,107,30,0.4)' : '#D9CFAE'}`,
        borderRadius: 12,
        padding: 8,
        minHeight: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: matched ? 'default' : 'pointer',
        transition: 'all 0.2s',
      }}>
      {visible ? (
        slot.type === 'symbol' ? (
          <NotationSymbol cardId={slot.pairId} />
        ) : (
          <span style={{
            fontFamily: SERIF, fontSize: 17, fontWeight: 500,
            color: DARK, textAlign: 'center', lineHeight: 1.3,
          }}>{card.term}</span>
        )
      ) : (
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: ACCENT, opacity: 0.25,
        }} />
      )}
    </button>
  )
}

// ── Ex 4: Group by category ───────────────────────────────────────────────
function CategoryEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(SIGN_CARDS).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = CARD_CATEGORY[item.id]
  const options = useMemo(() => shuffled([...CATEGORIES]), [idx])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === answer
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1100 : 2200)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 4 · Which category?</ExerciseLabel>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <div style={{ background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: 14,
        padding: '18px 20px 12px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 120, marginBottom: 4 }}>
          <NotationSymbol cardId={item.id} />
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500,
          color: DARK, textAlign: 'center', margin: '0 0 2px' }}>{item.term}</p>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.6,
        margin: '0 0 10px', textAlign: 'center' }}>
        Which category does this belong to?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {options.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === answer} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<><strong style={{ color: CORRECT }}>{item.term}</strong> belongs to{' '}
          <strong style={{ color: CORRECT }}>{answer}</strong></>} />
    </div>
  )
}

// ── Shared bits ───────────────────────────────────────────────────────────
function MCButton({ label, isPicked, isAnswer, locked, onClick }: {
  label: string; isPicked: boolean; isAnswer: boolean; locked: boolean; onClick: () => void
}) {
  const bg = locked && isAnswer ? CORRECT
           : locked && isPicked && !isAnswer ? WRONG
           : 'white'
  const color = locked && (isAnswer || isPicked) ? 'white' : DARK
  const border = locked && isAnswer ? CORRECT
               : locked && isPicked && !isAnswer ? WRONG
               : '#D9CFAE'
  return (
    <button onClick={onClick} disabled={locked}
      style={{
        padding: '14px 16px', borderRadius: 10,
        border: `1.5px solid ${border}`, background: bg, color,
        fontFamily: F, fontSize: 15, fontWeight: 500,
        textAlign: 'left', lineHeight: 1.5,
        cursor: locked ? 'default' : 'pointer',
      }}>{label}</button>
  )
}

function FeedbackLine({ feedback, wrongContent }: {
  feedback: { ok: boolean } | null
  wrongContent: React.ReactNode
}) {
  return (
    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
      color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
      {feedback !== null && feedback.ok && '✓ Correct'}
      {feedback !== null && !feedback.ok && wrongContent}
    </p>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4']

export default function SignsTermsLesson({
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('ex1')
  const [keyN,  setKeyN]  = useState(0)
  const phaseScoresRef = useRef<Map<Phase, { correct: number; total: number }>>(new Map())

  void previouslyCompleted

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      let correct = 0, total = 0
      for (const v of phaseScoresRef.current.values()) { correct += v.correct; total += v.total }
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    setPhase(PHASE_ORDER[idx + 1])
    setKeyN(k => k + 1)
  }

  function scored(correct: number, total: number) {
    phaseScoresRef.current.set(phase, { correct, total })
    next()
  }

  return (
    <div>
      {phase === 'ex1' && <MatchEx        key={keyN} onDone={scored} />}
      {phase === 'ex2' && <IdentifyEx     key={keyN} onDone={scored} />}
      {phase === 'ex3' && <MemoryMatchEx  key={keyN} onDone={scored} />}
      {phase === 'ex4' && <CategoryEx     key={keyN} onDone={scored} />}
    </div>
  )
}

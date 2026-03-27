'use client'

import { useState, useCallback } from 'react'
import type { ReactElement } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// ── Data ─────────────────────────────────────────────────────────────────────

const SHARPS_ORDER = ['F','C','G','D','A','E','B']
const FLATS_ORDER  = ['B','E','A','D','G','C','F']

const KEYS = [
  { name: 'C',  sharps: 0, flats: 0 },
  { name: 'G',  sharps: 1, flats: 0 },
  { name: 'D',  sharps: 2, flats: 0 },
  { name: 'A',  sharps: 3, flats: 0 },
  { name: 'E',  sharps: 4, flats: 0 },
  { name: 'B',  sharps: 5, flats: 0 },
  { name: 'F#', sharps: 6, flats: 0 },
  { name: 'C#', sharps: 7, flats: 0 },
  { name: 'F',  sharps: 0, flats: 1 },
  { name: 'Bb', sharps: 0, flats: 2 },
  { name: 'Eb', sharps: 0, flats: 3 },
  { name: 'Ab', sharps: 0, flats: 4 },
  { name: 'Db', sharps: 0, flats: 5 },
  { name: 'Gb', sharps: 0, flats: 6 },
  { name: 'Cb', sharps: 0, flats: 7 },
]

const MINOR_KEYS = [
  { name: 'A',  sharps: 0, flats: 0 },
  { name: 'E',  sharps: 1, flats: 0 },
  { name: 'B',  sharps: 2, flats: 0 },
  { name: 'F#', sharps: 3, flats: 0 },
  { name: 'C#', sharps: 4, flats: 0 },
  { name: 'G#', sharps: 5, flats: 0 },
  { name: 'D#', sharps: 6, flats: 0 },
  { name: 'A#', sharps: 7, flats: 0 },
  { name: 'D',  sharps: 0, flats: 1 },
  { name: 'G',  sharps: 0, flats: 2 },
  { name: 'C',  sharps: 0, flats: 3 },
  { name: 'F',  sharps: 0, flats: 4 },
  { name: 'Bb', sharps: 0, flats: 5 },
  { name: 'Eb', sharps: 0, flats: 6 },
  { name: 'Ab', sharps: 0, flats: 7 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Mini staff with accidentals ───────────────────────────────────────────────
const SHARP_POS_TREBLE = [0,3,-1,2,5,1,4]
const FLAT_POS_TREBLE  = [4,1,5,2,6,3,7]
const STEP = 6
const STAFF_TOP = 28

function AccidentalStaff({ sharps, flats }: { sharps: number; flats: number }) {
  const w = 180
  const h = 80
  const staffLeft = 16
  const staffRight = w - 16
  const lineY = (i: number) => STAFF_TOP + i * STEP
  const noteY  = (pos: number) => STAFF_TOP + pos * STEP * 0.5

  const accidentals: ReactElement[] = []
  const count = sharps || flats
  const positions = sharps > 0 ? SHARP_POS_TREBLE : FLAT_POS_TREBLE
  const symbol = sharps > 0 ? '♯' : '♭'
  const color = '#1A1A18'
  let x = staffLeft + 24

  for (let i = 0; i < count; i++) {
    const y = noteY(positions[i])
    accidentals.push(
      <text key={i} x={x} y={y + 5} fontSize={sharps > 0 ? 13 : 16}
        fontFamily="serif" fill={color} textAnchor="middle">{symbol}</text>
    )
    x += 14
  }

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {/* Treble clef simplified */}
      <text x={staffLeft} y={STAFF_TOP + 14} fontSize={38} fontFamily="Bravura, serif" fill="#1A1A18">𝄞</text>
      {/* Staff lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1={staffLeft} x2={staffRight} y1={lineY(i)} y2={lineY(i)}
          stroke="#1A1A18" strokeWidth={0.75} />
      ))}
      {accidentals}
      {count === 0 && (
        <text x={x} y={STAFF_TOP + 14} fontSize={11} fontFamily={F} fill="#888780">no accidentals</text>
      )}
    </svg>
  )
}

// ── Mode: Order Drill ─────────────────────────────────────────────────────────
function OrderDrill() {
  const [mode, setMode] = useState<'sharps' | 'flats'>('sharps')
  const [revealed, setRevealed] = useState(false)
  const order = mode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const mnemonic = mode === 'sharps' ? 'Father Charles Goes Down And Ends Battle' : 'Battle Ends And Down Goes Charles\'s Father'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['sharps', 'flats'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setRevealed(false) }}
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid ' + (mode === m ? '#1A1A18' : '#D3D1C7'), background: mode === m ? '#1A1A18' : 'white', color: mode === m ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
            {m === 'sharps' ? '♯ Sharps' : '♭ Flats'}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '28px 24px', textAlign: 'center' as const }}>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
          Order of {mode === 'sharps' ? 'Sharps' : 'Flats'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          {order.map((note, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: revealed ? '#1A1A18' : '#F5F2EC', border: '1px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '18px', color: revealed ? 'white' : '#D3D1C7', transition: 'all 0.2s' }}>
                {revealed ? note : i + 1}
              </div>
              <span style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setRevealed(r => !r)}
          style={{ background: revealed ? '#F5F2EC' : '#1A1A18', color: revealed ? '#1A1A18' : 'white', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer', marginBottom: '20px' }}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        {revealed && (
          <p style={{ fontFamily: SERIF, fontSize: '16px', fontStyle: 'italic', color: '#888780', lineHeight: 1.6 }}>
            "{mnemonic}"
          </p>
        )}
      </div>

      {/* Blank drill */}
      <OrderBlankDrill mode={mode} />
    </div>
  )
}

function OrderBlankDrill({ mode }: { mode: 'sharps' | 'flats' }) {
  const order = mode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const [blankIdx, setBlankIdx] = useState(() => Math.floor(Math.random() * 7))
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  const next = useCallback(() => {
    setBlankIdx(Math.floor(Math.random() * 7))
    setAnswer('')
    setResult(null)
  }, [])

  const check = () => {
    const correct = order[blankIdx].toLowerCase()
    const given = answer.trim().toLowerCase().replace('♯','#').replace('♭','b')
    setResult(given === correct.replace('♯','#').replace('♭','b') ? 'correct' : 'wrong')
  }

  const bg = result === 'correct' ? '#EAF3DE' : result === 'wrong' ? '#FCEBEB' : 'white'
  const border = result === 'correct' ? '#7EC86E' : result === 'wrong' ? '#F09595' : '#D3D1C7'

  return (
    <div style={{ background: bg, borderRadius: '16px', border: '1px solid ' + border, padding: '24px', transition: 'all 0.2s' }}>
      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Fill in the blank</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {order.map((note, i) => (
          i === blankIdx ? (
            <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: result === 'correct' ? '#7EC86E' : result === 'wrong' ? '#F09595' : '#EDE8DF', border: '2px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '16px', color: result ? 'white' : '#1A1A18' }}>
              {result ? order[blankIdx] : '?'}
            </div>
          ) : (
            <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F2EC', border: '1px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '18px', color: '#1A1A18' }}>
              {note}
            </div>
          )
        ))}
      </div>
      <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', marginBottom: '12px', textAlign: 'center' as const }}>
        What is {mode === 'sharps' ? 'sharp' : 'flat'} #{blankIdx + 1}?
      </p>
      {!result ? (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <input value={answer} onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="e.g. F" maxLength={2}
            style={{ width: '80px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #D3D1C7', fontFamily: SERIF, fontSize: '18px', textAlign: 'center' as const, outline: 'none', background: '#F5F2EC' }} />
          <button onClick={check}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Check
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' as const }}>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: result === 'correct' ? '#4CAF50' : '#E53935', marginBottom: '12px' }}>
            {result === 'correct' ? '✓ Correct!' : `✗ The answer is ${order[blankIdx]}`}
          </p>
          <button onClick={next}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 24px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// ── Mode: Key ID Quiz ─────────────────────────────────────────────────────────
type QuizQuestion = {
  key: string
  isMinor: boolean
  sharps: number
  flats: number
  type: 'name-to-count' | 'count-to-name' | 'staff-to-name'
}

function buildQuestion(pool: typeof KEYS, minorPool: typeof MINOR_KEYS): QuizQuestion {
  const useMinor = Math.random() > 0.5
  const source = useMinor ? minorPool : pool
  const k = source[Math.floor(Math.random() * source.length)]
  const types: QuizQuestion['type'][] = ['name-to-count', 'count-to-name', 'staff-to-name']
  const type = types[Math.floor(Math.random() * types.length)]
  return { key: k.name, isMinor: useMinor, sharps: k.sharps, flats: k.flats, type }
}

function KeyQuiz() {
  const [q, setQ] = useState<QuizQuestion>(() => buildQuestion(KEYS, MINOR_KEYS))
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const next = useCallback(() => {
    setQ(buildQuestion(KEYS, MINOR_KEYS))
    setSelected(null)
    setResult(null)
  }, [])

  const checkAnswer = (answer: string) => {
    if (result) return
    setSelected(answer)
    const correct = q.type === 'name-to-count'
      ? (q.sharps > 0 ? `${q.sharps}♯` : q.flats > 0 ? `${q.flats}♭` : '0')
      : q.key + (q.isMinor ? ' minor' : ' major')
    const isCorrect = answer === correct
    setResult(isCorrect ? 'correct' : 'wrong')
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  // Build choices
  const choices: string[] = []
  if (q.type === 'name-to-count') {
    const correct = q.sharps > 0 ? `${q.sharps}♯` : q.flats > 0 ? `${q.flats}♭` : '0'
    const allChoices = ['0','1♯','2♯','3♯','4♯','5♯','6♯','7♯','1♭','2♭','3♭','4♭','5♭','6♭','7♭']
    const distractors = shuffle(allChoices.filter(c => c !== correct)).slice(0, 3)
    choices.push(...shuffle([correct, ...distractors]))
  } else {
    const source = q.isMinor ? MINOR_KEYS : KEYS
    const correct = q.key + (q.isMinor ? ' minor' : ' major')
    const distractors = shuffle(source.filter(k => k.name !== q.key)).slice(0, 3).map(k => k.name + (q.isMinor ? ' minor' : ' major'))
    choices.push(...shuffle([correct, ...distractors]))
  }

  const prompt = q.type === 'name-to-count'
    ? `How many sharps or flats does ${q.key} ${q.isMinor ? 'minor' : 'major'} have?`
    : q.type === 'count-to-name'
    ? `Which ${q.isMinor ? 'minor' : 'major'} key has ${q.sharps > 0 ? q.sharps + ' sharp' + (q.sharps > 1 ? 's' : '') : q.flats > 0 ? q.flats + ' flat' + (q.flats > 1 ? 's' : '') : 'no sharps or flats'}?`
    : `What key signature is shown below?`

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      {/* Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Key ID Quiz</p>
        <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>
          {score.total > 0 ? `${score.correct}/${score.total} · ${Math.round(score.correct/score.total*100)}%` : '—'}
        </p>
      </div>

      {/* Question card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '28px 24px', textAlign: 'center' as const }}>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', marginBottom: '20px', lineHeight: 1.6 }}>{prompt}</p>
        {q.type === 'staff-to-name' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <AccidentalStaff sharps={q.sharps} flats={q.flats} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {choices.map((choice, i) => {
            const isSelected = selected === choice
            const correct = q.type === 'name-to-count'
              ? (q.sharps > 0 ? `${q.sharps}♯` : q.flats > 0 ? `${q.flats}♭` : '0')
              : q.key + (q.isMinor ? ' minor' : ' major')
            const isCorrectChoice = choice === correct
            let bg = 'white', border = '1px solid #D3D1C7', color = '#1A1A18'
            if (result && isCorrectChoice) { bg = '#EAF3DE'; border = '1px solid #7EC86E'; color = '#2E6B3E' }
            else if (result && isSelected && !isCorrectChoice) { bg = '#FCEBEB'; border = '1px solid #F09595'; color = '#E53935' }
            return (
              <button key={i} onClick={() => checkAnswer(choice)}
                style={{ padding: '12px 8px', borderRadius: '12px', border, background: bg, color, fontFamily: SERIF, fontSize: '17px', fontWeight: 300, cursor: result ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                {choice}
              </button>
            )
          })}
        </div>
      </div>

      {result && (
        <div style={{ textAlign: 'center' as const }}>
          <button onClick={next}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 32px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Drill Component ───────────────────────────────────────────────────────
export default function KeyDrill() {
  const [mode, setMode] = useState<'order' | 'quiz'>('order')

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['order', 'quiz'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding: '7px 18px', borderRadius: '20px', border: '1px solid ' + (mode === m ? '#BA7517' : '#D3D1C7'), background: mode === m ? '#BA7517' : 'white', color: mode === m ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
            {m === 'order' ? '♯♭ Order' : '? Key ID'}
          </button>
        ))}
      </div>
      {mode === 'order' ? <OrderDrill /> : <KeyQuiz />}
    </div>
  )
}

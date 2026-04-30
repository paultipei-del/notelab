'use client'

import { useState, useCallback, useEffect } from 'react'

const SERIF = 'var(--font-cormorant), serif'

// ── Data ─────────────────────────────────────────────────────────────────────

const SHARPS_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLATS_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

const MAJOR_COF = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']
const MINOR_COF = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab']

const KEYS = [
  { name: 'C', sharps: 0, flats: 0 },
  { name: 'G', sharps: 1, flats: 0 },
  { name: 'D', sharps: 2, flats: 0 },
  { name: 'A', sharps: 3, flats: 0 },
  { name: 'E', sharps: 4, flats: 0 },
  { name: 'B', sharps: 5, flats: 0 },
  { name: 'F#', sharps: 6, flats: 0 },
  { name: 'C#', sharps: 7, flats: 0 },
  { name: 'F', sharps: 0, flats: 1 },
  { name: 'Bb', sharps: 0, flats: 2 },
  { name: 'Eb', sharps: 0, flats: 3 },
  { name: 'Ab', sharps: 0, flats: 4 },
  { name: 'Db', sharps: 0, flats: 5 },
  { name: 'Gb', sharps: 0, flats: 6 },
  { name: 'Cb', sharps: 0, flats: 7 },
]

const MINOR_KEYS = [
  { name: 'A', sharps: 0, flats: 0 },
  { name: 'E', sharps: 1, flats: 0 },
  { name: 'B', sharps: 2, flats: 0 },
  { name: 'F#', sharps: 3, flats: 0 },
  { name: 'C#', sharps: 4, flats: 0 },
  { name: 'G#', sharps: 5, flats: 0 },
  { name: 'D#', sharps: 6, flats: 0 },
  { name: 'A#', sharps: 7, flats: 0 },
  { name: 'D', sharps: 0, flats: 1 },
  { name: 'G', sharps: 0, flats: 2 },
  { name: 'C', sharps: 0, flats: 3 },
  { name: 'F', sharps: 0, flats: 4 },
  { name: 'Bb', sharps: 0, flats: 5 },
  { name: 'Eb', sharps: 0, flats: 6 },
  { name: 'Ab', sharps: 0, flats: 7 },
]

const KEYS_SHARPS_ONLY = KEYS.filter(k => k.flats === 0)
const KEYS_FLATS_ONLY = KEYS.filter(k => k.sharps === 0)
const KEYS_EASY = KEYS.filter(k => k.sharps <= 2 && k.flats <= 2)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cofNeighbors(name: string, isMinor: boolean, count: number): string[] {
  const cof = isMinor ? MINOR_COF : MAJOR_COF
  const idx = cof.indexOf(name)
  if (idx === -1) return shuffle(cof.filter(n => n !== name)).slice(0, count)
  const neighbors: string[] = []
  for (let d = 1; neighbors.length < count * 2; d++) {
    if (idx - d >= 0) neighbors.push(cof[idx - d])
    if (idx + d < cof.length) neighbors.push(cof[idx + d])
    if (d > cof.length) break
  }
  return shuffle(neighbors.filter(n => n !== name)).slice(0, count)
}

const SHARP_POS_S = [0, 3, -1, 2, 5, 1, 4]
const FLAT_POS_S = [4, 1, 5, 2, 6, 3, 7]

function AccidentalStaff({ sharps, flats }: { sharps: number; flats: number }) {
  const step = 6
  const staffTop = 30
  const staffLeft = 16
  const width = 300
  const staffWidth = width - 32
  const H = 100
  const accStartX = staffLeft + 54
  const sharpNames = ['F', 'C', 'G', 'D', 'A', 'E', 'B'].slice(0, sharps)
  const flatNames = ['B', 'E', 'A', 'D', 'G', 'C', 'F'].slice(0, flats)
  const staffLines = [0, 2, 4, 6, 8].map(p => (
    <line
      key={p}
      x1={staffLeft}
      y1={staffTop + p * step}
      x2={staffLeft + staffWidth}
      y2={staffTop + p * step}
      stroke="#1A1A18"
      strokeWidth="1.2"
    />
  ))
  const accidentals =
    sharps > 0
      ? sharpNames.map((name, i) => (
          <text
            key={name}
            x={accStartX + i * 13}
            y={staffTop + SHARP_POS_S[i] * step}
            fontSize="40"
            fontFamily="Bravura, serif"
            fill="#1A1A18"
            dominantBaseline="central"
            textAnchor="middle"
          >
            {String.fromCodePoint(0xe262)}
          </text>
        ))
      : flats > 0
        ? flatNames.map((name, i) => (
            <text
              key={name}
              x={accStartX + i * 13}
              y={staffTop + FLAT_POS_S[i] * step}
              fontSize="40"
              fontFamily="Bravura, serif"
              fill="#1A1A18"
              dominantBaseline="central"
              textAnchor="middle"
            >
              {String.fromCodePoint(0xe260)}
            </text>
          ))
        : []
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      {staffLines}
      <text x={staffLeft} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">
        𝄞
      </text>
      {accidentals}
    </svg>
  )
}

function loadScore(): { correct: number; total: number } {
  try {
    const s = localStorage.getItem('keydrill-score')
    return s ? JSON.parse(s) : { correct: 0, total: 0 }
  } catch {
    return { correct: 0, total: 0 }
  }
}
function saveScore(score: { correct: number; total: number }) {
  try {
    localStorage.setItem('keydrill-score', JSON.stringify(score))
  } catch {}
}
function loadOrderStreak(): number {
  try {
    return parseInt(localStorage.getItem('keydrill-order-streak') || '0')
  } catch {
    return 0
  }
}
function saveOrderStreak(n: number) {
  try {
    localStorage.setItem('keydrill-order-streak', String(n))
  } catch {}
}

// ── Order drill ───────────────────────────────────────────────────────────────

function OrderDrill({ accMode }: { accMode: 'sharps' | 'flats' }) {
  const [revealed, setRevealed] = useState(false)
  const [drillMode, setDrillMode] = useState<'blank' | 'sequence'>('blank')

  useEffect(() => {
    setRevealed(false)
  }, [accMode])

  const order = accMode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const mnemonic =
    accMode === 'sharps'
      ? 'Father Charles Goes Down And Ends Battle'
      : "Battle Ends And Down Goes Charles's Father"

  return (
    <div className="nl-key-drill__block">
      <div className="nl-key-drill-card">
        <p className="nl-key-drill-card__title">Order of {accMode === 'sharps' ? 'Sharps' : 'Flats'}</p>
        <div className="nl-key-drill-order-dots">
          {order.map((note, i) => (
            <div key={i} className="nl-key-drill-order-dot">
              <div
                className={`nl-key-drill-order-dot__circle ${revealed ? 'nl-key-drill-order-dot__circle--lit' : 'nl-key-drill-order-dot__circle--muted'}`}
              >
                {revealed ? note : i + 1}
              </div>
              <span className="nl-key-drill-order-dot__idx">{i + 1}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="nl-key-drill-reveal"
          data-revealed={revealed}
          onClick={() => setRevealed(r => !r)}
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        {revealed && <p className="nl-key-drill-mnemonic">&ldquo;{mnemonic}&rdquo;</p>}
      </div>

      <div>
        <p className="nl-key-drill__label">Exercise</p>
        <div className="nl-key-drill__pill-row">
          {(['blank', 'sequence'] as const).map(m => (
            <button
              key={m}
              type="button"
              className={`nl-key-drill-pill nl-key-drill-pill--accent${drillMode === m ? ' nl-key-drill-pill--active' : ''}`}
              onClick={() => setDrillMode(m)}
            >
              {m === 'blank' ? 'Fill in blank' : 'Full sequence'}
            </button>
          ))}
        </div>
      </div>

      {drillMode === 'blank' ? <OrderBlankDrill mode={accMode} /> : <OrderSequenceDrill mode={accMode} />}
    </div>
  )
}

function OrderBlankDrill({ mode }: { mode: 'sharps' | 'flats' }) {
  const order = mode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const [blankIdx, setBlankIdx] = useState(() => Math.floor(Math.random() * 7))
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [streak, setStreak] = useState(() => loadOrderStreak())

  const next = useCallback(() => {
    setBlankIdx(Math.floor(Math.random() * 7))
    setAnswer('')
    setResult(null)
  }, [])

  const check = () => {
    if (!answer.trim()) return
    const correct = order[blankIdx]
    const given = answer.trim().toUpperCase().replace('S', '♯').replace('B', '♭')
    const isCorrect = given === correct || answer.trim().toUpperCase() === correct
    setResult(isCorrect ? 'correct' : 'wrong')
    const newStreak = isCorrect ? streak + 1 : 0
    setStreak(newStreak)
    saveOrderStreak(newStreak)
  }

  const exResult = result === null ? 'idle' : result

  return (
    <div className="nl-key-drill-exercise" data-result={exResult}>
      <div className="nl-key-drill-ex-head">
        <p className="nl-key-drill__label" style={{ margin: 0 }}>
          Fill in the blank
        </p>
        {streak > 0 && <p className="nl-key-drill-streak">🔥 {streak}</p>}
      </div>
      <div className="nl-key-drill-blank-row">
        {order.map((note, i) =>
          i === blankIdx ? (
            <div
              key={i}
              className="nl-key-drill-blank-dot nl-key-drill-blank-dot--slot"
              data-outcome={result || undefined}
            >
              {result ? order[blankIdx] : '?'}
            </div>
          ) : (
            <div key={i} className="nl-key-drill-blank-dot">
              {note}
            </div>
          ),
        )}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 'var(--nl-text-meta)',
          color: '#7A7060',
          margin: '0 0 12px',
          textAlign: 'center',
        }}
      >
        What is {mode === 'sharps' ? 'sharp' : 'flat'} #{blankIdx + 1}?
      </p>
      {!result ? (
        <div className="nl-key-drill-input-row">
          <input
            className="nl-key-drill-input"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="e.g. F"
            maxLength={3}
            autoFocus
          />
          <button type="button" className="nl-key-drill-btn-primary" onClick={check}>
            Check
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p
            className={`nl-key-drill-feedback ${result === 'correct' ? 'nl-key-drill-feedback--ok' : 'nl-key-drill-feedback--bad'}`}
          >
            {result === 'correct' ? '✓ Correct!' : `✗ The answer is ${order[blankIdx]}`}
          </p>
          <button type="button" className="nl-key-drill-btn-primary" onClick={next}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function OrderSequenceDrill({ mode }: { mode: 'sharps' | 'flats' }) {
  const order = mode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const [inputs, setInputs] = useState<string[]>(Array(7).fill(''))
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>(Array(7).fill(false))

  const reset = () => {
    setInputs(Array(7).fill(''))
    setChecked(false)
    setResults(Array(7).fill(false))
  }

  const checkAll = () => {
    const r = inputs.map((inp, i) => inp.trim().toUpperCase() === order[i])
    setResults(r)
    setChecked(true)
  }

  const allCorrect = checked && results.every(Boolean)
  const borderOk = checked ? (allCorrect ? '#7EC86E' : '#F09595') : '#D9CFAE'

  return (
    <div className="nl-key-drill-card" style={{ borderColor: borderOk, transition: 'border-color 0.2s' }}>
      <p className="nl-key-drill-card__title" style={{ marginBottom: 14 }}>
        Write the full {mode === 'sharps' ? 'sharp' : 'flat'} order
      </p>
      <div className="nl-key-drill-seq-grid">
        {order.map((note, i) => (
          <div key={i} className="nl-key-drill-seq-cell">
            <input
              className="nl-key-drill-seq-input"
              value={inputs[i]}
              data-checked={checked ? 'true' : 'false'}
              data-ok={checked ? (results[i] ? 'true' : 'false') : undefined}
              onChange={e => {
                const n = [...inputs]
                n[i] = e.target.value
                setInputs(n)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  checkAll()
                }
              }}
              maxLength={3}
            />
            <span
              className="nl-key-drill-seq-hint"
              data-ok={checked ? (results[i] ? 'true' : 'false') : undefined}
            >
              {checked ? order[i] : i + 1}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {!checked ? (
          <button type="button" className="nl-key-drill-btn-primary" onClick={checkAll}>
            Check all
          </button>
        ) : (
          <button type="button" className="nl-key-drill-btn-primary" onClick={reset}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// ── Key ID quiz ───────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'sharps' | 'flats' | 'all'
type QuizQuestion = {
  key: string
  isMinor: boolean
  sharps: number
  flats: number
  type: 'name-to-count' | 'count-to-name' | 'staff-to-name'
}

function buildQuestion(difficulty: Difficulty): QuizQuestion {
  const useMinor = Math.random() > 0.6
  let majorPool =
    difficulty === 'easy'
      ? KEYS_EASY
      : difficulty === 'sharps'
        ? KEYS_SHARPS_ONLY
        : difficulty === 'flats'
          ? KEYS_FLATS_ONLY
          : KEYS
  let minorPool = MINOR_KEYS
  if (difficulty === 'easy') minorPool = MINOR_KEYS.filter(k => k.sharps <= 2 && k.flats <= 2)
  if (difficulty === 'sharps') minorPool = MINOR_KEYS.filter(k => k.flats === 0)
  if (difficulty === 'flats') minorPool = MINOR_KEYS.filter(k => k.sharps === 0)

  const source = useMinor ? minorPool : majorPool
  const k = source[Math.floor(Math.random() * source.length)]
  const types: QuizQuestion['type'][] = ['name-to-count', 'count-to-name', 'staff-to-name']
  const type = types[Math.floor(Math.random() * types.length)]
  return { key: k.name, isMinor: useMinor, sharps: k.sharps, flats: k.flats, type }
}

function KeyQuiz({ difficulty }: { difficulty: Difficulty }) {
  const [q, setQ] = useState<QuizQuestion>(() => buildQuestion(difficulty))
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(() => loadScore())

  useEffect(() => {
    setQ(buildQuestion(difficulty))
    setSelected(null)
    setResult(null)
  }, [difficulty])

  const next = useCallback(() => {
    setQ(buildQuestion(difficulty))
    setSelected(null)
    setResult(null)
  }, [difficulty])

  const correctAnswer =
    q.type === 'name-to-count'
      ? q.sharps > 0
        ? `${q.sharps}♯`
        : q.flats > 0
          ? `${q.flats}♭`
          : '0 ♮'
      : q.key + (q.isMinor ? ' minor' : ' major')

  const checkAnswer = (answer: string) => {
    if (result) return
    setSelected(answer)
    const isCorrect = answer === correctAnswer
    setResult(isCorrect ? 'correct' : 'wrong')
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 }
    setScore(newScore)
    saveScore(newScore)
  }

  const choices: string[] = []
  if (q.type === 'name-to-count') {
    const allChoices = ['0 ♮', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯', '7♯', '1♭', '2♭', '3♭', '4♭', '5♭', '6♭', '7♭']
    const correct = correctAnswer
    const correctCount = q.sharps || q.flats
    const sameType = allChoices.filter(c => {
      if (c === correct) return false
      const isSharpChoice = c.includes('♯')
      const isFlatChoice = c.includes('♭')
      return (q.sharps > 0 && isSharpChoice) || (q.flats > 0 && isFlatChoice) || (q.sharps === 0 && q.flats === 0)
    })
    const nearChoices = sameType.filter(c => {
      const n = parseInt(c) || 0
      return Math.abs(n - correctCount) <= 2
    })
    const distractors = shuffle([...nearChoices, ...allChoices.filter(c => c !== correct && !nearChoices.includes(c))]).slice(0, 3)
    choices.push(...shuffle([correct, ...distractors]))
  } else {
    const correct = correctAnswer
    const neighbors = cofNeighbors(q.key, q.isMinor, 3)
    const distractors = neighbors.map(n => n + (q.isMinor ? ' minor' : ' major'))
    choices.push(...shuffle([correct, ...distractors]))
  }

  const accLabel =
    q.sharps > 0 ? `${q.sharps} sharp${q.sharps > 1 ? 's' : ''}` : q.flats > 0 ? `${q.flats} flat${q.flats > 1 ? 's' : ''}` : 'no sharps or flats'

  const prompt =
    q.type === 'name-to-count'
      ? `How many sharps or flats does ${q.key} ${q.isMinor ? 'minor' : 'major'} have?`
      : q.type === 'count-to-name'
        ? `Which ${q.isMinor ? 'minor' : 'major'} key has ${accLabel}?`
        : 'What key signature is shown?'

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div className="nl-key-drill__block">
      <div className="nl-key-drill-quiz-score-row">
        <div className="nl-key-drill-score">
          {score.total > 0 && <p className="nl-key-drill-score__text">{score.correct}/{score.total} · {pct}%</p>}
          <button
            type="button"
            className="nl-key-drill-reset"
            onClick={() => {
              const s = { correct: 0, total: 0 }
              setScore(s)
              saveScore(s)
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="nl-key-drill-question">
        <p className="nl-key-drill-prompt">{prompt}</p>
        {q.type === 'staff-to-name' && (
          <div className="nl-key-drill-staff-wrap">
            <AccidentalStaff sharps={q.sharps} flats={q.flats} />
          </div>
        )}
        <div className="nl-key-drill-choices">
          {choices.map((choice, i) => {
            const isCorrectChoice = choice === correctAnswer
            let cls = 'nl-key-drill-choice'
            if (result && isCorrectChoice) cls += ' nl-key-drill-choice--correct'
            else if (result && selected === choice && !isCorrectChoice) cls += ' nl-key-drill-choice--wrong'
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={!!result}
                onClick={() => checkAnswer(choice)}
              >
                {choice}
              </button>
            )
          })}
        </div>
        {result && (
          <p
            className="nl-key-drill-feedback"
            style={{
              marginTop: 14,
              marginBottom: 0,
              color: result === 'correct' ? '#2e6b3e' : '#c62828',
            }}
          >
            {result === 'correct' ? '✓ Correct!' : `✗ ${correctAnswer}`}
          </p>
        )}
      </div>

      {result && (
        <div className="nl-key-drill-next-wrap">
          <button type="button" className="nl-key-drill-btn-primary" onClick={next}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function KeyDrill() {
  const [mode, setMode] = useState<'order' | 'quiz'>('order')
  const [accMode, setAccMode] = useState<'sharps' | 'flats'>('sharps')
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>('easy')

  return (
    <div className="nl-key-drill">
      <p className="nl-key-drill__lead">
        Practice the order of sharps and flats, or quiz key names and signatures. Scores for Key ID save on this device.
      </p>

      <div className="nl-key-drill-controls-row">
        <div className="nl-key-drill-controls-group">
          <p className="nl-key-drill__label">Mode</p>
          <div className="nl-key-drill__pill-row">
            {(['order', 'quiz'] as const).map(m => (
              <button
                key={m}
                type="button"
                className={`nl-key-drill-pill nl-key-drill-pill--accent${mode === m ? ' nl-key-drill-pill--active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m === 'order' ? '♯♭ Order' : 'Key ID'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'order' && (
          <div className="nl-key-drill-controls-group nl-key-drill-controls-group--end">
            <p className="nl-key-drill__label">Accidentals</p>
            <div className="nl-key-drill__pill-row nl-key-drill__pill-row--end">
              {(['sharps', 'flats'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  className={`nl-key-drill-pill${accMode === m ? ' nl-key-drill-pill--active' : ''}`}
                  onClick={() => setAccMode(m)}
                >
                  {m === 'sharps' ? '♯ Sharps' : '♭ Flats'}
                </button>
              ))}
            </div>
          </div>
        )}
        {mode === 'quiz' && (
          <div className="nl-key-drill-controls-group nl-key-drill-controls-group--end">
            <p className="nl-key-drill__label">Pool</p>
            <div className="nl-key-drill__pill-row nl-key-drill__pill-row--end">
              {(['easy', 'sharps', 'flats', 'all'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`nl-key-drill-pill nl-key-drill-pill--accent${quizDifficulty === d ? ' nl-key-drill-pill--active' : ''}`}
                  onClick={() => setQuizDifficulty(d)}
                >
                  {d === 'easy' ? 'Easy' : d === 'sharps' ? '♯ only' : d === 'flats' ? '♭ only' : 'All'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {mode === 'order' ? <OrderDrill accMode={accMode} /> : <KeyQuiz difficulty={quizDifficulty} />}
    </div>
  )
}

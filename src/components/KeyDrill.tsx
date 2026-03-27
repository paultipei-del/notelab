'use client'

import { useState, useCallback } from 'react'
import type { ReactElement } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// ── Data ─────────────────────────────────────────────────────────────────────

const SHARPS_ORDER = ['F','C','G','D','A','E','B']
const FLATS_ORDER  = ['B','E','A','D','G','C','F']

// Circle of fifths order for smart distractors
const MAJOR_COF = ['C','G','D','A','E','B','F#','C#','F','Bb','Eb','Ab','Db','Gb','Cb']
const MINOR_COF = ['A','E','B','F#','C#','G#','D#','A#','D','G','C','F','Bb','Eb','Ab']

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

// Difficulty filter pools
const KEYS_SHARPS_ONLY = KEYS.filter(k => k.flats === 0)
const KEYS_FLATS_ONLY  = KEYS.filter(k => k.sharps === 0)
const KEYS_EASY        = KEYS.filter(k => k.sharps <= 2 && k.flats <= 2)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Get circle-of-fifths neighbors as smart distractors
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

// ── Improved staff rendering ──────────────────────────────────────────────────
// Positions: staff line index (0=top, 4=bottom), with 0.5 steps for spaces
// Treble clef: top line = F5, spaces from top: E5, D5, C5, B4
// Sharp positions (treble): F5(0), C5(2), G5(-1→above staff), D5(1), A5(-2), E5(3), B4(5) — in step units from top line
// Using standard positions in half-steps from top staff line
const SHARP_POS_TREBLE = [0, 3, -1, 2, 5, 1, 4]  // half-steps from top line (0=F5)
const FLAT_POS_TREBLE  = [4, 1, 5, 2, 6, 3, 7]   // half-steps from top line

const STEP = 7   // pixels per staff line gap
const STAFF_TOP = 30

// ── Staff rendering ──────────────────────────────────────────────────────────
const SHARP_POS_S = [0,3,-1,2,5,1,4]
const FLAT_POS_S  = [4,1,5,2,6,3,7]

function AccidentalStaff({ sharps, flats }: { sharps: number; flats: number }) {
  const step = 6
  const staffTop = 30
  const staffLeft = 16
  const width = 300
  const staffWidth = width - 32
  const H = 100
  const accStartX = staffLeft + 54
  const sharpNames = ['F','C','G','D','A','E','B'].slice(0, sharps)
  const flatNames  = ['B','E','A','D','G','C','F'].slice(0, flats)
  const staffLines = [0,2,4,6,8].map(p => (
    <line key={p} x1={staffLeft} y1={staffTop + p*step}
      x2={staffLeft + staffWidth} y2={staffTop + p*step}
      stroke="#1A1A18" strokeWidth="1.2" />
  ))
  const accidentals = sharps > 0
    ? sharpNames.map((name, i) => (
        <text key={name} x={accStartX + i*13} y={staffTop + SHARP_POS_S[i]*step}
          fontSize="40" fontFamily="Bravura, serif" fill="#1A1A18"
          dominantBaseline="central" textAnchor="middle">
          {String.fromCodePoint(0xE262)}
        </text>
      ))
    : flats > 0
    ? flatNames.map((name, i) => (
        <text key={name} x={accStartX + i*13} y={staffTop + FLAT_POS_S[i]*step}
          fontSize="40" fontFamily="Bravura, serif" fill="#1A1A18"
          dominantBaseline="central" textAnchor="middle">
          {String.fromCodePoint(0xE260)}
        </text>
      ))
    : []
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      {staffLines}
      <text x={staffLeft} y={staffTop+36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
      {accidentals}
      {sharps === 0 && flats === 0 && (
        <text x={accStartX} y={staffTop+12} fontSize="13" fontFamily="var(--font-jost), sans-serif" fill="#888780">no accidentals</text>
      )}
    </svg>
  )
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadScore(): { correct: number; total: number } {
  try { const s = localStorage.getItem('keydrill-score'); return s ? JSON.parse(s) : { correct: 0, total: 0 } } catch { return { correct: 0, total: 0 } }
}
function saveScore(score: { correct: number; total: number }) {
  try { localStorage.setItem('keydrill-score', JSON.stringify(score)) } catch {}
}
function loadOrderStreak(): number {
  try { return parseInt(localStorage.getItem('keydrill-order-streak') || '0') } catch { return 0 }
}
function saveOrderStreak(n: number) {
  try { localStorage.setItem('keydrill-order-streak', String(n)) } catch {}
}

// ── Mode: Order Drill ─────────────────────────────────────────────────────────
function OrderDrill() {
  const [accMode, setAccMode] = useState<'sharps' | 'flats'>('sharps')
  const [revealed, setRevealed] = useState(false)
  const [drillMode, setDrillMode] = useState<'blank' | 'sequence'>('blank')
  const order = accMode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const mnemonic = accMode === 'sharps'
    ? 'Father Charles Goes Down And Ends Battle'
    : "Battle Ends And Down Goes Charles's Father"

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      {/* Sharps / Flats toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['sharps', 'flats'] as const).map(m => (
          <button key={m} onClick={() => { setAccMode(m); setRevealed(false) }}
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid ' + (accMode === m ? '#1A1A18' : '#D3D1C7'), background: accMode === m ? '#1A1A18' : 'white', color: accMode === m ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
            {m === 'sharps' ? '♯ Sharps' : '♭ Flats'}
          </button>
        ))}
      </div>

      {/* Reference card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '24px', textAlign: 'center' as const }}>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
          Order of {accMode === 'sharps' ? 'Sharps' : 'Flats'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
          {order.map((note, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: revealed ? '#1A1A18' : '#F5F2EC', border: '1px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '18px', color: revealed ? 'white' : '#D3D1C7', transition: 'all 0.2s' }}>
                {revealed ? note : i + 1}
              </div>
              <span style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setRevealed(r => !r)}
          style={{ background: revealed ? '#F5F2EC' : '#1A1A18', color: revealed ? '#1A1A18' : 'white', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '9px 24px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer', marginBottom: revealed ? '16px' : 0 }}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        {revealed && (
          <p style={{ fontFamily: SERIF, fontSize: '15px', fontStyle: 'italic', color: '#888780', lineHeight: 1.6, marginTop: '12px' }}>
            "{mnemonic}"
          </p>
        )}
      </div>

      {/* Drill mode toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['blank', 'sequence'] as const).map(m => (
          <button key={m} onClick={() => setDrillMode(m)}
            style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid ' + (drillMode === m ? '#BA7517' : '#D3D1C7'), background: drillMode === m ? '#BA7517' : 'white', color: drillMode === m ? 'white' : '#888780', fontFamily: F, fontSize: '11px', fontWeight: 300, cursor: 'pointer' }}>
            {m === 'blank' ? 'Fill in blank' : 'Full sequence'}
          </button>
        ))}
      </div>

      {drillMode === 'blank'
        ? <OrderBlankDrill mode={accMode} />
        : <OrderSequenceDrill mode={accMode} />
      }
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
    const given = answer.trim().toUpperCase().replace('S','♯').replace('B','♭')
    const isCorrect = given === correct || answer.trim().toUpperCase() === correct
    setResult(isCorrect ? 'correct' : 'wrong')
    const newStreak = isCorrect ? streak + 1 : 0
    setStreak(newStreak)
    saveOrderStreak(newStreak)
  }

  const bg = result === 'correct' ? '#EAF3DE' : result === 'wrong' ? '#FCEBEB' : 'white'
  const borderColor = result === 'correct' ? '#7EC86E' : result === 'wrong' ? '#F09595' : '#D3D1C7'

  return (
    <div style={{ background: bg, borderRadius: '16px', border: '1px solid ' + borderColor, padding: '24px', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Fill in the blank</p>
        {streak > 0 && <p style={{ fontFamily: F, fontSize: '11px', color: '#BA7517' }}>🔥 {streak}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {order.map((note, i) => (
          i === blankIdx ? (
            <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: result === 'correct' ? '#7EC86E' : result === 'wrong' ? '#F09595' : '#EDE8DF', border: '2px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '16px', color: result ? 'white' : '#1A1A18' }}>
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
            placeholder="e.g. F" maxLength={3} autoFocus
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

function OrderSequenceDrill({ mode }: { mode: 'sharps' | 'flats' }) {
  const order = mode === 'sharps' ? SHARPS_ORDER : FLATS_ORDER
  const [inputs, setInputs] = useState<string[]>(Array(7).fill(''))
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>(Array(7).fill(false))

  const reset = () => { setInputs(Array(7).fill('')); setChecked(false); setResults(Array(7).fill(false)) }

  const checkAll = () => {
    const r = inputs.map((inp, i) => inp.trim().toUpperCase() === order[i])
    setResults(r)
    setChecked(true)
  }

  const allCorrect = checked && results.every(Boolean)

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid ' + (checked ? (allCorrect ? '#7EC86E' : '#F09595') : '#D3D1C7'), padding: '24px', transition: 'all 0.2s' }}>
      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
        Write the full {mode === 'sharps' ? 'sharp' : 'flat'} order
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {order.map((note, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
            <input value={inputs[i]}
              onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); checkAll() } }}
              maxLength={3}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid ' + (checked ? (results[i] ? '#7EC86E' : '#F09595') : '#D3D1C7'), background: checked ? (results[i] ? '#EAF3DE' : '#FCEBEB') : '#F5F2EC', fontFamily: SERIF, fontSize: '16px', textAlign: 'center' as const, outline: 'none', color: '#1A1A18', padding: 0 }} />
            <span style={{ fontFamily: F, fontSize: '10px', color: checked ? (results[i] ? '#4CAF50' : '#E53935') : '#888780' }}>
              {checked ? order[i] : i + 1}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {!checked ? (
          <button onClick={checkAll}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Check all
          </button>
        ) : (
          <button onClick={reset}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// ── Mode: Key ID Quiz ─────────────────────────────────────────────────────────
type Difficulty = 'easy' | 'sharps' | 'flats' | 'all'
type QuizQuestion = {
  key: string; isMinor: boolean; sharps: number; flats: number
  type: 'name-to-count' | 'count-to-name' | 'staff-to-name'
}

function buildQuestion(difficulty: Difficulty): QuizQuestion {
  const useMinor = Math.random() > 0.6  // favor major slightly
  let majorPool = difficulty === 'easy' ? KEYS_EASY
    : difficulty === 'sharps' ? KEYS_SHARPS_ONLY
    : difficulty === 'flats' ? KEYS_FLATS_ONLY
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

function KeyQuiz() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [q, setQ] = useState<QuizQuestion>(() => buildQuestion('easy'))
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(() => loadScore())

  // Reset score and question when difficulty changes
  const changeDifficulty = (d: Difficulty) => {
    setDifficulty(d)
    setQ(buildQuestion(d))
    setSelected(null)
    setResult(null)
  }

  const next = useCallback(() => {
    setQ(buildQuestion(difficulty))
    setSelected(null)
    setResult(null)
  }, [difficulty])

  const correctAnswer = q.type === 'name-to-count'
    ? (q.sharps > 0 ? `${q.sharps}♯` : q.flats > 0 ? `${q.flats}♭` : '0 ♮')
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

  // Smart distractors
  const choices: string[] = []
  if (q.type === 'name-to-count') {
    const allChoices = ['0 ♮','1♯','2♯','3♯','4♯','5♯','6♯','7♯','1♭','2♭','3♭','4♭','5♭','6♭','7♭']
    // Prefer neighboring counts as distractors
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
    // Circle-of-fifths neighbors as distractors
    const correct = correctAnswer
    const neighbors = cofNeighbors(q.key, q.isMinor, 3)
    const distractors = neighbors.map(n => n + (q.isMinor ? ' minor' : ' major'))
    choices.push(...shuffle([correct, ...distractors]))
  }

  const accLabel = q.sharps > 0 ? `${q.sharps} sharp${q.sharps > 1 ? 's' : ''}`
    : q.flats > 0 ? `${q.flats} flat${q.flats > 1 ? 's' : ''}` : 'no sharps or flats'

  const prompt = q.type === 'name-to-count'
    ? `How many sharps or flats does ${q.key} ${q.isMinor ? 'minor' : 'major'} have?`
    : q.type === 'count-to-name'
    ? `Which ${q.isMinor ? 'minor' : 'major'} key has ${accLabel}?`
    : `What key signature is shown?`

  const pct = score.total > 0 ? Math.round(score.correct / score.total * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      {/* Difficulty + score row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['easy','sharps','flats','all'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => changeDifficulty(d)}
              style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid ' + (difficulty === d ? '#BA7517' : '#D3D1C7'), background: difficulty === d ? '#BA7517' : 'white', color: difficulty === d ? 'white' : '#888780', fontFamily: F, fontSize: '11px', fontWeight: 300, cursor: 'pointer' }}>
              {d === 'easy' ? 'Easy' : d === 'sharps' ? '♯ only' : d === 'flats' ? '♭ only' : 'All'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {score.total > 0 && (
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>
              {score.correct}/{score.total} · {pct}%
            </p>
          )}
          <button onClick={() => { const s = {correct:0,total:0}; setScore(s); saveScore(s) }}
            style={{ background: 'none', border: 'none', fontFamily: F, fontSize: '11px', color: '#D3D1C7', cursor: 'pointer', padding: '2px 6px' }}>
            reset
          </button>
        </div>
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
            const isCorrectChoice = choice === correctAnswer
            let bg = 'white', border = '1px solid #D3D1C7', color = '#1A1A18'
            if (result && isCorrectChoice) { bg = '#EAF3DE'; border = '1px solid #7EC86E'; color = '#2E6B3E' }
            else if (result && selected === choice && !isCorrectChoice) { bg = '#FCEBEB'; border = '1px solid #F09595'; color = '#E53935' }
            return (
              <button key={i} onClick={() => checkAnswer(choice)}
                style={{ padding: '12px 8px', borderRadius: '12px', border, background: bg, color, fontFamily: SERIF, fontSize: '17px', fontWeight: 300, cursor: result ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                {choice}
              </button>
            )
          })}
        </div>
        {result && (
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: result === 'correct' ? '#4CAF50' : '#E53935', marginTop: '16px' }}>
            {result === 'correct' ? '✓ Correct!' : `✗ ${correctAnswer}`}
          </p>
        )}
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

// ── Main Drill Component ──────────────────────────────────────────────────────
export default function KeyDrill() {
  const [mode, setMode] = useState<'order' | 'quiz'>('order')

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
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

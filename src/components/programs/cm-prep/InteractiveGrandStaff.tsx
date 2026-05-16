'use client'

import { useState } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const LIGHT_BG = '#F7F4ED'
const ACCENT = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG = '#a0381c'
const STROKE_W = 1.3

const ELEMENTS = [
  {
    id: 1 as const,
    label: 'Brace',
    shortDesc: 'The curved bracket on the far left',
    fullDesc: 'The brace is the ornamental curved bracket that joins the treble and bass staves on the left side. It tells the performer both staves are played simultaneously: two staves, one instrument. On the piano, the treble staff is typically played by the right hand, the bass staff by the left.',
  },
  {
    id: 2 as const,
    label: 'Treble clef',
    shortDesc: 'G clef · anchors G on the second line of the upper staff',
    fullDesc: 'The treble clef spirals around the second line, permanently naming it G4. From that single anchor, every other note position follows by counting up or down the alphabet (A through G, repeating). The treble clef is used for higher-pitched notes. It is also called the G clef.',
  },
  {
    id: 3 as const,
    label: 'Bass clef',
    shortDesc: 'F clef · anchors F on the fourth line of the lower staff',
    fullDesc: 'The two dots of the bass clef sit above and below the fourth line, naming it F3. All other bass staff notes follow from that anchor. The bass clef is used for lower-pitched notes and is also called the F clef. Middle C sits one ledger line above this staff. It is shared between both staves.',
  },
  {
    id: 4 as const,
    label: 'Bar line',
    shortDesc: 'Vertical line dividing the music into measures',
    fullDesc: 'A bar line is a vertical line that runs through both staves from top to bottom, marking the boundary between measures. It is purely an organizational tool. It does not create a pause, an accent, or any change in sound. Music flows continuously through bar lines.',
  },
  {
    id: 5 as const,
    label: 'Measure',
    shortDesc: 'The space between two bar lines',
    fullDesc: 'A measure (also called a bar) is the musical space between two bar lines. It holds a fixed number of beats determined by the time signature at the start of the piece. Every measure in a piece contains exactly the same number of beats. This regularity is what gives music its rhythmic structure.',
  },
  {
    id: 6 as const,
    label: 'Double bar',
    shortDesc: 'Thin + thick line marking the end of a section or piece',
    fullDesc: 'The double bar line consists of a thin line followed by a thick line. It appears at the end of a section, a movement, or the entire piece. The thick bar signals finality. This is where the music ends. A double bar with repeat dots has a different meaning (go back and play again), but the plain double bar always means the end.',
  },
] as const

type ElementId = typeof ELEMENTS[number]['id']
type Mode = 'explore' | 'quiz'
type StaffId = 'treble' | 'bass'

interface Props {
  showModeToggle?: boolean
}

export default function InteractiveGrandStaff({ showModeToggle = true }: Props) {
  const [mode, setMode] = useState<Mode>('explore')
  const [active, setActive] = useState<ElementId | null>(null)
  const [hovered, setHovered] = useState<ElementId | null>(null)

  // Line number interactivity
  const [activeLine, setActiveLine] = useState<{ staff: StaffId; num: number } | null>(null)
  const [hoveredLine, setHoveredLine] = useState<{ staff: StaffId; num: number } | null>(null)

  // Quiz
  const [quizOrder, setQuizOrder] = useState<ElementId[]>([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizClicked, setQuizClicked] = useState<ElementId | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [quizDone, setQuizDone] = useState(false)

  function startQuiz() {
    const ids = ELEMENTS.map(e => e.id) as ElementId[]
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    setQuizOrder(shuffled)
    setQuizIdx(0)
    setQuizClicked(null)
    setResults([])
    setQuizDone(false)
    setMode('quiz')
    setActive(null)
    setActiveLine(null)
  }

  function handleClick(id: ElementId) {
    if (mode === 'explore') {
      setActiveLine(null)
      setActive(prev => prev === id ? null : id)
      return
    }
    if (quizClicked !== null || quizDone) return
    const correct = id === quizOrder[quizIdx]
    setQuizClicked(id)
    setResults(r => [...r, correct])
  }

  function toggleLine(staff: StaffId, num: number) {
    if (mode !== 'explore') return
    setActive(null)
    setActiveLine(prev =>
      prev?.staff === staff && prev.num === num ? null : { staff, num }
    )
  }

  function nextQuestion() {
    if (quizIdx + 1 >= quizOrder.length) {
      setQuizDone(true)
    } else {
      setQuizIdx(i => i + 1)
      setQuizClicked(null)
    }
  }

  // Per-element visual state
  function elFill(id: ElementId): string {
    if (mode === 'quiz' && quizClicked !== null) {
      if (id === quizOrder[quizIdx]) return CORRECT
      if (id === quizClicked) return WRONG
      return '#C8C4BA'
    }
    if (active === id || hovered === id) return ACCENT
    return DARK
  }

  function elHighlight(id: ElementId): boolean {
    if (mode === 'explore') return active === id || hovered === id
    if (quizClicked !== null) return id === quizOrder[quizIdx] || id === quizClicked
    return hovered === id
  }

  function elHighlightBg(id: ElementId): string {
    if (mode === 'quiz' && quizClicked !== null) {
      if (id === quizOrder[quizIdx]) return 'rgba(42,107,30,0.10)'
      if (id === quizClicked) return 'rgba(181,64,42,0.10)'
    }
    return active === id ? 'rgba(186,117,23,0.10)' : 'rgba(186,117,23,0.06)'
  }

  function elHighlightStroke(id: ElementId): string {
    if (mode === 'quiz' && quizClicked !== null) {
      if (id === quizOrder[quizIdx]) return 'rgba(42,107,30,0.45)'
      if (id === quizClicked) return 'rgba(181,64,42,0.45)'
    }
    return active === id ? 'rgba(186,117,23,0.5)' : 'rgba(186,117,23,0.2)'
  }

  // Line color helpers
  function lineStroke(staff: StaffId, num: number): string {
    if (activeLine?.staff === staff && activeLine.num === num) return ACCENT
    if (hoveredLine?.staff === staff && hoveredLine.num === num) return ACCENT
    return DARK
  }
  function lineWidth(staff: StaffId, num: number): number {
    if (activeLine?.staff === staff && activeLine.num === num) return 2.5
    if (hoveredLine?.staff === staff && hoveredLine.num === num) return 2
    return STROKE_W
  }
  function numFill(staff: StaffId, num: number): string {
    const isActive = activeLine?.staff === staff && activeLine.num === num
    const isHov = hoveredLine?.staff === staff && hoveredLine.num === num
    if (isActive) return ACCENT
    if (isHov) return ACCENT
    return GREY
  }
  function numCircleFill(staff: StaffId, num: number): string {
    return activeLine?.staff === staff && activeLine.num === num
      ? ACCENT : 'transparent'
  }
  function numCircleStroke(staff: StaffId, num: number): string {
    const isActive = activeLine?.staff === staff && activeLine.num === num
    const isHov = hoveredLine?.staff === staff && hoveredLine.num === num
    if (isActive || isHov) return ACCENT
    return 'transparent'
  }

  // Layout — step=10; wider viewBox (sR=480) makes everything appear smaller at same display width
  const step = 7
  const sL = 76      // staffLeft: gives room for numbers + brace on left
  const sR = 480
  const tTop = 34    // treble top line
  const bTop = tTop + 8 * step + 72  // bass top line · more space between staffs
  const bBot = bTop + 8 * step

  const numX = 28    // x for line number badges

  const tLines = [0, 2, 4, 6, 8].map(p => tTop + p * step)
  const bLines = [0, 2, 4, 6, 8].map(p => bTop + p * step)

  const barX = 286

  const W = sR + 20
  const H = bBot + 48

  const activeEl = ELEMENTS.find(e => e.id === active)
  const quizTarget = !quizDone && mode === 'quiz' ? ELEMENTS.find(e => e.id === quizOrder[quizIdx]) : null
  const lastCorrect = results.length > 0 ? results[results.length - 1] : null
  const correctCount = results.filter(Boolean).length

  const activeLineEl = activeLine
    ? { staff: activeLine.staff, num: activeLine.num }
    : null

  return (
    <div>
      {/* Mode toggle */}
      {showModeToggle && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['explore', 'quiz'] as const).map(m => (
            <button
              key={m}
              onClick={() => m === 'quiz' ? startQuiz() : (setMode('explore'), setActive(null), setActiveLine(null))}
              style={{
                padding: '9px 22px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: F, fontSize: 14, fontWeight: mode === m ? 600 : 400,
                background: mode === m ? 'var(--oxblood)' : 'var(--cream-card-strong)',
                color: mode === m ? '#FDFBF5' : 'var(--brown)',
                border: mode === m ? '1px solid var(--oxblood)' : '1px solid var(--brown-faint)',
                transition: 'background 0.15s',
              }}
            >
              {m === 'explore' ? 'Explore' : 'Quiz me'}
            </button>
          ))}
        </div>
      )}

      {/* Quiz prompt */}
      {mode === 'quiz' && !quizDone && quizTarget && (
        <div style={{
          background: '#FDFBF5', border: '1px solid #E8E4DC',
          borderRadius: '14px', padding: '18px 22px', marginBottom: '16px',
          minHeight: '110px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Question {quizIdx + 1} of {quizOrder.length}
            </p>
            <div style={{ display: 'flex', gap: '5px' }}>
              {quizOrder.map((_, i) => (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                  background: i < results.length
                    ? (results[i] ? CORRECT : WRONG)
                    : i === quizIdx ? ACCENT : '#D9CFAE',
                }} />
              ))}
            </div>
          </div>
          {quizClicked === null ? (
            <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, color: DARK, margin: 0 }}>
              Tap on the <strong style={{ fontWeight: 500 }}>{quizTarget.label}</strong>
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: lastCorrect ? 'rgba(42,107,30,0.12)' : 'rgba(181,64,42,0.12)',
                  fontSize: 15,
                }}>
                  {lastCorrect ? '✓' : '✗'}
                </span>
                <p style={{ fontFamily: F, fontSize: 14, color: lastCorrect ? CORRECT : WRONG, margin: 0, fontWeight: 600 }}>
                  {lastCorrect ? 'Correct!' : `Not quite · ${quizTarget.label} is highlighted in green`}
                </p>
              </div>
              <button
                onClick={nextQuestion}
                style={{
                  background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: '10px',
                  padding: '10px 22px', fontFamily: F, fontSize: 14, cursor: 'pointer',
                }}
              >
                {quizIdx + 1 >= quizOrder.length ? 'See results' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SVG */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: '16px' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto', cursor: 'default' }}
        >
          {/* Staff lines · colored when a line number is active */}
          {[0, 2, 4, 6, 8].map((p, i) => {
            const n = 5 - i
            return (
              <line key={'t' + p}
                x1={sL} y1={tTop + p * step} x2={sR} y2={tTop + p * step}
                stroke={lineStroke('treble', n)} strokeWidth={lineWidth('treble', n)} />
            )
          })}
          {[0, 2, 4, 6, 8].map((p, i) => {
            const n = 5 - i
            return (
              <line key={'b' + p}
                x1={sL} y1={bTop + p * step} x2={sR} y2={bTop + p * step}
                stroke={lineStroke('bass', n)} strokeWidth={lineWidth('bass', n)} />
            )
          })}

          {/* Left connecting bar */}
          <line x1={sL} y1={tTop} x2={sL} y2={bBot} stroke={DARK} strokeWidth={2} />

          {/* ── Element 6: Double bar ── */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(6)}
            onMouseEnter={() => setHovered(6)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(6) && (
              <rect x={sR - 22} y={tTop - 8} width={30} height={bBot - tTop + 16} rx={6}
                fill={elHighlightBg(6)} stroke={elHighlightStroke(6)} strokeWidth={1.5} />
            )}
            <line x1={sR - 7} y1={tTop} x2={sR - 7} y2={bBot} stroke={elFill(6)} strokeWidth={STROKE_W} />
            <line x1={sR} y1={tTop} x2={sR} y2={bBot} stroke={elFill(6)} strokeWidth={5} />
            <rect x={sR - 22} y={tTop - 8} width={30} height={bBot - tTop + 16} fill="transparent" />
          </g>

          {/* ── Element 1: Brace ── */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(1)}
            onMouseEnter={() => setHovered(1)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(1) && (
              <rect x={40} y={tTop - 10} width={sL - 38} height={bBot - tTop + 20} rx={8}
                fill={elHighlightBg(1)} stroke={elHighlightStroke(1)} strokeWidth={1.5} />
            )}
            <text x={sL - 10} y={tTop + (bBot - tTop)} fontSize={bBot - tTop}
              fontFamily="Bravura, serif" fill={elFill(1)} textAnchor="middle" dominantBaseline="auto">
              {'\uE000'}
            </text>
            {/* Hit zone · extends to left edge so badge 1 is clickable */}
            <rect x={2} y={tTop - 10} width={sL - 4} height={bBot - tTop + 20} fill="transparent" />
          </g>

          {/* ── Element 2: Treble clef ── */}
          {/* Scale from GrandStaffCard step=6: fontSize=50,y=top+36 → step=10: fontSize=84,y=top+60 */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(2)}
            onMouseEnter={() => setHovered(2)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(2) && (
              <rect x={sL + 1} y={tTop - 22} width={78} height={8 * step + 46} rx={8}
                fill={elHighlightBg(2)} stroke={elHighlightStroke(2)} strokeWidth={1.5} />
            )}
            <text x={sL + 6} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={56}
              fill={elFill(2)} dominantBaseline="auto">𝄞</text>
            <rect x={sL + 1} y={tTop - 22} width={78} height={8 * step + 46} fill="transparent" />
          </g>

          {/* ── Element 3: Bass clef ── */}
          {/* Scale from GrandStaffCard step=6: fontSize=52,y=top+13 → step=10: fontSize=88,y=top+22 */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(3)}
            onMouseEnter={() => setHovered(3)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(3) && (
              <rect x={sL + 1} y={bTop - 18} width={78} height={8 * step + 40} rx={8}
                fill={elHighlightBg(3)} stroke={elHighlightStroke(3)} strokeWidth={1.5} />
            )}
            <text x={sL + 6} y={bTop + 2 * step + 1} fontFamily="Bravura, serif" fontSize={56}
              fill={elFill(3)} dominantBaseline="auto">𝄢</text>
            <rect x={sL + 1} y={bTop - 18} width={78} height={8 * step + 40} fill="transparent" />
          </g>

          {/* ── Element 4: Bar line ── */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(4)}
            onMouseEnter={() => setHovered(4)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(4) && (
              <rect x={barX - 18} y={tTop - 8} width={36} height={bBot - tTop + 16} rx={6}
                fill={elHighlightBg(4)} stroke={elHighlightStroke(4)} strokeWidth={1.5} />
            )}
            <line x1={barX} y1={tTop} x2={barX} y2={bBot} stroke={elFill(4)} strokeWidth={2} />
            <rect x={barX - 18} y={tTop - 8} width={36} height={bBot - tTop + 16} fill="transparent" />
          </g>

          {/* ── Element 5: Measure ── */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick(5)}
            onMouseEnter={() => setHovered(5)}
            onMouseLeave={() => setHovered(null)}
          >
            {elHighlight(5) && (
              <>
                <rect x={sL + 70} y={tTop - 8} width={barX - sL - 88} height={bBot - tTop + 16} rx={6}
                  fill={elHighlightBg(5)} stroke={elHighlightStroke(5)} strokeWidth={1.5} />
                <rect x={barX + 18} y={tTop - 8} width={sR - barX - 40} height={bBot - tTop + 16} rx={6}
                  fill={elHighlightBg(5)} stroke={elHighlightStroke(5)} strokeWidth={1.5} />
              </>
            )}
            <rect x={sL + 70} y={tTop - 8} width={barX - sL - 88} height={bBot - tTop + 16} fill="transparent" />
            <rect x={barX + 18} y={tTop - 8} width={sR - barX - 40} height={bBot - tTop + 16} fill="transparent" />
          </g>

          {/* Callout badges · explore mode only */}
          {mode === 'explore' && ELEMENTS.map(el => {
            const positions: Record<number, [number, number]> = {
              1: [43, tTop + (bBot - tTop) / 2],          // brace: between line circles and brace glyph
              2: [sL + 62, tTop + 4 * step],              // treble: right of clef, mid-height
              3: [sL + 62, bTop + 4 * step],              // bass: right of clef, mid-height
              4: [barX, bLines[4] + 23],
              5: [(sL + 70 + barX - 18) / 2, bLines[4] + 23],
              6: [sR - 3, bLines[4] + 23],
            }
            const [cx, cy] = positions[el.id]
            const isActive = active === el.id
            return (
              <g key={el.id} style={{ cursor: 'pointer' }}
                onClick={() => handleClick(el.id as ElementId)}
                onMouseEnter={() => setHovered(el.id as ElementId)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={cx} cy={cy} r={13}
                  fill={isActive ? ACCENT : '#E8E4DC'}
                  stroke={isActive ? ACCENT : '#C8C4BA'}
                  strokeWidth={1} />
                <text x={cx} y={cy + 5} textAnchor="middle" fontFamily={F} fontSize={12}
                  fill={isActive ? 'white' : GREY} fontWeight="600">{el.id}</text>
              </g>
            )
          })}

          {/* ── Line number badges · rendered last so they sit above brace hit zone ── */}
          {/* Treble lines */}
          {[0, 2, 4, 6, 8].map((p, i) => {
            const num = 5 - i
            const y = tTop + p * step
            const isActive = activeLine?.staff === 'treble' && activeLine.num === num
            const interactive = mode === 'explore'
            return (
              <g key={'tn' + i}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onClick={() => toggleLine('treble', num)}
                onMouseEnter={() => interactive && setHoveredLine({ staff: 'treble', num })}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <circle cx={numX} cy={y} r={10}
                  fill={numCircleFill('treble', num)}
                  stroke={numCircleStroke('treble', num)}
                  strokeWidth={1.5} />
                <text x={numX} y={y} textAnchor="middle" dominantBaseline="central"
                  fontFamily={F} fontSize={12} fontWeight={isActive ? '700' : '400'}
                  fill={isActive ? 'white' : numFill('treble', num)}>{num}</text>
              </g>
            )
          })}
          {/* Bass lines */}
          {[0, 2, 4, 6, 8].map((p, i) => {
            const num = 5 - i
            const y = bTop + p * step
            const isActive = activeLine?.staff === 'bass' && activeLine.num === num
            const interactive = mode === 'explore'
            return (
              <g key={'bn' + i}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onClick={() => toggleLine('bass', num)}
                onMouseEnter={() => interactive && setHoveredLine({ staff: 'bass', num })}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <circle cx={numX} cy={y} r={10}
                  fill={numCircleFill('bass', num)}
                  stroke={numCircleStroke('bass', num)}
                  strokeWidth={1.5} />
                <text x={numX} y={y} textAnchor="middle" dominantBaseline="central"
                  fontFamily={F} fontSize={12} fontWeight={isActive ? '700' : '400'}
                  fill={isActive ? 'white' : numFill('bass', num)}>{num}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Explore: description panel */}
      {mode === 'explore' && (
        <div style={{
          background: (activeEl || activeLineEl) ? 'white' : LIGHT_BG,
          border: `1px solid ${(activeEl || activeLineEl) ? '#D9CFAE' : '#EDE8DF'}`,
          borderRadius: '14px', padding: '20px 24px',
          minHeight: 80, transition: 'background 0.15s',
        }}>
          {activeEl ? (
            <>
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: ACCENT, margin: '0 0 6px' }}>
                {activeEl.label}
              </p>
              <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: DARK, margin: '0 0 8px' }}>
                {activeEl.shortDesc}
              </p>
              <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: 0, lineHeight: 1.7 }}>
                {activeEl.fullDesc}
              </p>
            </>
          ) : activeLineEl ? (
            <>
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: ACCENT, margin: '0 0 6px' }}>
                Line {activeLineEl.num} · {activeLineEl.staff === 'treble' ? 'Treble' : 'Bass'} Staff
              </p>
              <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: 0, lineHeight: 1.7 }}>
                {activeLineEl.staff === 'treble' ? (
                  <>
                    {activeLineEl.num === 1 && 'Line 1 (bottom): E4, just below middle C on the treble staff.'}
                    {activeLineEl.num === 2 && 'Line 2: G4. The treble clef spirals around this line, permanently anchoring G.'}
                    {activeLineEl.num === 3 && 'Line 3 (middle): B4.'}
                    {activeLineEl.num === 4 && 'Line 4: D5.'}
                    {activeLineEl.num === 5 && 'Line 5 (top): F5. Mnemonic for all five treble lines: Every Good Boy Does Fine (E G B D F).'}
                  </>
                ) : (
                  <>
                    {activeLineEl.num === 1 && 'Line 1 (bottom): G2. Mnemonic for all five bass lines: Good Boys Do Fine Always (G B D F A).'}
                    {activeLineEl.num === 2 && 'Line 2: B2.'}
                    {activeLineEl.num === 3 && 'Line 3 (middle): D3.'}
                    {activeLineEl.num === 4 && 'Line 4: F3. The bass clef dots bracket this line, permanently anchoring F.'}
                    {activeLineEl.num === 5 && 'Line 5 (top): A3.'}
                  </>
                )}
              </p>
            </>
          ) : (
            <p style={{ fontFamily: F, fontSize: 14, color: '#B0ACA4', margin: 0, textAlign: 'center', paddingTop: 6 }}>
              Tap any numbered element or line number to learn about it
            </p>
          )}
        </div>
      )}

      {/* Quiz done */}
      {quizDone && (
        <div style={{
          background: '#FDFBF5', border: '1px solid #D9CFAE', borderRadius: '16px',
          padding: '28px', textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: correctCount === ELEMENTS.length ? 'rgba(42,107,30,0.10)' : 'rgba(186,117,23,0.10)',
            border: `2px solid ${correctCount === ELEMENTS.length ? 'rgba(42,107,30,0.3)' : 'rgba(186,117,23,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            {correctCount === ELEMENTS.length ? '✓' : `${correctCount}/${ELEMENTS.length}`}
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, color: DARK, marginBottom: 6 }}>
            {correctCount === ELEMENTS.length ? 'All correct' : `${correctCount} of ${ELEMENTS.length} correct`}
          </p>
          <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 24 }}>
            {correctCount === ELEMENTS.length ? 'You can identify every part of the grand staff.' : 'Review the highlighted parts and try again.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startQuiz} style={{
              background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: '10px',
              padding: '11px 24px', fontFamily: F, fontSize: 14, cursor: 'pointer',
            }}>
              Try again →
            </button>
            <button onClick={() => { setMode('explore'); setActive(null); setActiveLine(null) }} style={{
              background: '#EDE8DF', color: DARK, border: 'none', borderRadius: '10px',
              padding: '11px 24px', fontFamily: F, fontSize: 14, cursor: 'pointer',
            }}>
              Back to Explore
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

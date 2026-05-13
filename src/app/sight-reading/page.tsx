'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type AnswerMode,
  type Clef,
  type SightReadingLevel,
  ANSWER_MODE_META,
  PHASE_META,
  groupedByPhase,
  levelDeckId,
} from '@/lib/sightReadingLevels'
import RealPianoInfoPopover from '@/components/sight-reading/RealPianoInfoPopover'
import CustomSessionPanel from '@/components/sight-reading/CustomSessionPanel'

const CLEFS: Clef[] = ['treble', 'bass', 'grand']
const ANSWER_MODES: AnswerMode[] = ['letters', 'full-piano', 'real-piano']

export default function SightReadingPage() {
  const router = useRouter()
  const [clef, setClef] = useState<Clef>('treble')
  const [answerMode, setAnswerMode] = useState<AnswerMode>('letters')
  const [infoOpen, setInfoOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const infoTriggerRef = useRef<HTMLButtonElement | null>(null)
  const customTriggerRef = useRef<HTMLButtonElement | null>(null)

  const phaseGroups = groupedByPhase(clef)

  function handleLevelClick(level: SightReadingLevel) {
    const deckId = levelDeckId(clef, level)
    if (answerMode === 'real-piano') {
      router.push(`/study/${deckId}`)
      return
    }
    const input = answerMode === 'full-piano' ? 'keyboard-full' : 'letters'
    router.push(`/note-id/${deckId}?input=${input}`)
  }

  function handleCustomStart(url: string) {
    setCustomOpen(false)
    router.push(url)
  }

  return (
    <div className="nl-sr-page">
      <div className="nl-sr-wrap">
        <header className="nl-sr-hero">
          <h1 className="nl-sr-hero__title">Sight Reading</h1>
          <p className="nl-sr-hero__sub">Read notes faster — one at a time.</p>
        </header>

        <div className="nl-sr-opt-row">
          <div className="nl-sr-opt-group">
            <span className="nl-sr-opt-label">Clef</span>
            <div className="nl-sr-seg">
              {CLEFS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={'nl-sr-seg__opt' + (clef === c ? ' is-active' : '')}
                  onClick={() => setClef(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="nl-sr-opt-group">
            <span className="nl-sr-opt-label">Answer with</span>
            {/* Wrapper holds the seg + info icon as siblings —
                nesting <button> in <button> is invalid HTML and
                Chrome collapses the inner one, swallowing its
                onClick. Sibling layout preserves the visual
                attachment via CSS without the DOM violation. */}
            <div className="nl-sr-seg-wrap">
              <div className="nl-sr-seg">
                {ANSWER_MODES.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={
                      'nl-sr-seg__opt' + (answerMode === m ? ' is-active' : '')
                    }
                    onClick={() => setAnswerMode(m)}
                  >
                    {ANSWER_MODE_META[m].label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                ref={infoTriggerRef}
                className="nl-sr-info-icon"
                aria-label="About Real Piano mode"
                onClick={e => {
                  e.stopPropagation()
                  setInfoOpen(v => !v)
                }}
              >
                ⓘ
              </button>
            </div>
            <RealPianoInfoPopover
              open={infoOpen}
              onClose={() => setInfoOpen(false)}
              triggerRef={infoTriggerRef}
            />
          </div>
        </div>

        {answerMode === 'real-piano' && (
          <div className="nl-sr-mode-strip" role="note">
            <span className="nl-sr-mode-strip__icon" aria-hidden>🎹</span>
            <div className="nl-sr-mode-strip__body">
              <span className="nl-sr-mode-strip__title">Real Piano mode</span>
              <p className="nl-sr-mode-strip__desc">
                <b className="nl-sr-mode-strip__bold">Microphone permission required.</b>
                {' '}Play each note on your physical piano — the mic
                detects pitch and advances automatically.
              </p>
            </div>
          </div>
        )}

        <div className="nl-sr-levels">
          {phaseGroups.map(({ phase, levels }) => (
            <section
              key={phase}
              className={`nl-sr-phase-section nl-sr-phase-section--${phase}`}
            >
              <div className="nl-sr-phase-head">
                <span className="nl-sr-phase-eyebrow">
                  {PHASE_META[phase].label}
                </span>
                <span className="nl-sr-phase-hint">{PHASE_META[phase].hint}</span>
              </div>
              <div className="nl-sr-lvl-grid">
                {levels.map(level => (
                  <button
                    key={level.id}
                    type="button"
                    className="nl-sr-lvl-card"
                    onClick={() => handleLevelClick(level)}
                  >
                    <span className="nl-sr-lvl-card__num">{level.num}</span>
                    <span className="nl-sr-lvl-card__title">{level.title}</span>
                    <span className="nl-sr-lvl-card__range">{level.range}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="nl-sr-custom-row">
          <button
            type="button"
            ref={customTriggerRef}
            className="nl-sr-custom-link"
            onClick={() => setCustomOpen(v => !v)}
          >
            Custom session →
          </button>
          <span className="nl-sr-custom-hint">
            configure note types, rounds, timing
          </span>
        </div>

        <CustomSessionPanel
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          clef={clef}
          answerMode={answerMode}
          onStart={handleCustomStart}
        />
      </div>
    </div>
  )
}

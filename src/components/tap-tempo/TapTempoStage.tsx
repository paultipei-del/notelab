'use client'

import { forwardRef, type MouseEvent as ReactMouseEvent } from 'react'
import { nameFor } from '@/lib/metronomeData'
import type { TapState } from './tapState'
import TapCounter from './TapCounter'
import TapInstruction from './TapInstruction'
import TapActions from './TapActions'

interface TapTempoStageProps {
  state: TapState
  /** Monotonically increasing counter — keys the pulse-dot animation
   *  so each tap retriggers it. Rings are spawned imperatively by
   *  the page (not driven by React state). */
  tapCount: number
  onStageClick: (e: ReactMouseEvent<HTMLDivElement>) => void
  onReset: () => void
  onSendToMetronome: () => void
}

/**
 * Vertically-centered stage: italian word → BPM row (pulse + number)
 * → unit caption → 6-dot counter → instruction → action buttons.
 * Whole element is the tap target (cursor: pointer). Reset and Use
 * buttons stopPropagation so they don't fire taps. Reference strip
 * sits outside this element entirely.
 *
 * The BPM number is exposed via forwarded ref so the page's keyboard
 * handler can center the tap ring on it.
 */
const TapTempoStage = forwardRef<HTMLSpanElement, TapTempoStageProps>(
  function TapTempoStage(
    { state, tapCount, onStageClick, onReset, onSendToMetronome },
    bpmRef,
  ) {
    const italian =
      state.kind === 'empty' ? 'tap to begin' : nameFor(state.bpm)
    const italianClass =
      state.kind === 'empty'
        ? 'is-empty'
        : state.kind === 'partial'
          ? 'is-partial'
          : 'is-stable'

    const bpmDisplay = state.kind === 'empty' ? '—' : state.bpm
    const bpmClass =
      state.kind === 'empty'
        ? 'is-empty'
        : state.kind === 'partial'
          ? 'is-partial'
          : 'is-stable'

    const filledDots = state.kind === 'empty' ? 0 : state.intervals

    return (
      <section className="nl-tap-stage" onClick={onStageClick}>
        <div className={`nl-tap-stage__marking ${italianClass}`} aria-live="polite">
          {italian}
        </div>

        <div className="nl-tap-stage__bpm-row">
          <span
            key={`pulse-${tapCount}`}
            className={'nl-tap-stage__pulse' + (tapCount > 0 ? ' is-firing' : '')}
            aria-hidden
          />
          <span
            ref={bpmRef}
            className={`nl-tap-stage__bpm ${bpmClass}`}
            aria-live="polite"
          >
            {bpmDisplay}
          </span>
          {/* Invisible spacer mirroring the pulse so the BPM number
              sits at true horizontal center. */}
          <span className="nl-tap-stage__pulse nl-tap-stage__pulse--ghost" aria-hidden />
        </div>

        <div className="nl-tap-stage__unit">Beats per minute</div>

        <TapCounter filled={filledDots} />

        <TapInstruction state={state} />

        <TapActions
          state={state}
          onReset={onReset}
          onSendToMetronome={onSendToMetronome}
        />
      </section>
    )
  },
)

export default TapTempoStage

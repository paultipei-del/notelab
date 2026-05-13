'use client'

import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import SetsRow from './SetsRow'
import RepDisplay from './RepDisplay'
import BestLine from './BestLine'
import RepActions from './RepActions'
import RepInstruction from './RepInstruction'
import TargetPopover from './TargetPopover'

interface ClickCounterStageProps {
  count: number
  target: number
  sets: number
  setTarget: number
  bestThisSession: number
  hasResetThisSession: boolean
  celebrating: boolean
  dissolving: boolean
  celebrationText: string
  justFilledIndex: number | null
  onIncrement: () => void
  onUndo: () => void
  onResetStreak: () => void
  onTargetChange: (v: number) => void
}

/**
 * Vertically-centered stage. The stage element itself is the
 * increment tap target — every interactive descendant calls
 * stopPropagation so it never fires increments.
 */
export default function ClickCounterStage({
  count,
  target,
  sets,
  setTarget,
  bestThisSession,
  hasResetThisSession,
  celebrating,
  dissolving,
  celebrationText,
  justFilledIndex,
  onIncrement,
  onUndo,
  onResetStreak,
  onTargetChange,
}: ClickCounterStageProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleStageClick = () => {
    // Lock out clicks during animations so a stray tap doesn't queue
    // an increment that fires after the animation snaps state.
    if (celebrating || dissolving) return
    onIncrement()
  }

  const handleTargetClick = (e: ReactMouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    setPopoverOpen(v => !v)
  }

  return (
    <section className="nl-cc-stage" onClick={handleStageClick}>
      <SetsRow
        sets={sets}
        setTarget={setTarget}
        justFilled={justFilledIndex}
      />

      <div className="nl-cc-rep-wrap" onClick={e => e.stopPropagation()}>
        <RepDisplay
          count={count}
          target={target}
          celebrating={celebrating}
          dissolving={dissolving}
          onTargetClick={handleTargetClick}
        />
        {popoverOpen && (
          <TargetPopover
            kind="rep"
            value={target}
            onChange={onTargetChange}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>

      <BestLine best={bestThisSession} visible={hasResetThisSession} />

      <RepActions
        canUndo={count > 0 && !celebrating && !dissolving}
        onUndo={onUndo}
        onResetStreak={onResetStreak}
      />

      <RepInstruction
        celebrating={celebrating}
        celebrationText={celebrationText}
      />
    </section>
  )
}

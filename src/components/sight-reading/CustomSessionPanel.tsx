'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnswerMode, Clef } from '@/lib/sightReadingLevels'

type NoteFilter = 'lines' | 'spaces' | 'ledger' | 'accidentals'
type GroupMode = 'single' | 'multiple'
type StopMode = 'rounds' | 'minutes'

interface CustomSessionPanelProps {
  open: boolean
  onClose: () => void
  clef: Clef
  answerMode: AnswerMode
  /** Called with a query-string suitable for /note-id/custom or with
   *  a deck-id when starting Real Piano custom (deferred). */
  onStart: (url: string) => void
}

const DEFAULTS = {
  noteTypes: new Set<NoteFilter>(['lines', 'spaces']),
  groupMode: 'single' as GroupMode,
  groupSize: 4,
  stopMode: 'rounds' as StopMode,
  rounds: 10,
  minutes: 5,
  playCorrect: false,
}

/**
 * Anchored panel (desktop) / bottom-sheet (mobile) opened by the
 * "Custom session →" link at the bottom of the /sight-reading hub.
 *
 * Routes to /note-id/custom for Letters and Full Piano modes — that
 * page reads the URL params (filters, accidentals, group, stopMode,
 * stopValue, playCorrect, input) and runs the custom session.
 *
 * For Real Piano mode, custom session is deferred to a future ticket
 * — for now we route through /note-id/custom?input=letters as a
 * graceful fallback. (Real Piano custom requires extending the
 * StudyEngine to honour rounds/minutes stops, which is out of scope
 * for this patch.)
 */
export default function CustomSessionPanel({
  open,
  onClose,
  clef,
  answerMode,
  onStart,
}: CustomSessionPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [noteTypes, setNoteTypes] = useState<Set<NoteFilter>>(DEFAULTS.noteTypes)
  const [groupMode, setGroupMode] = useState<GroupMode>(DEFAULTS.groupMode)
  const [groupSize, setGroupSize] = useState<number>(DEFAULTS.groupSize)
  const [stopMode, setStopMode] = useState<StopMode>(DEFAULTS.stopMode)
  const [rounds, setRounds] = useState<number>(DEFAULTS.rounds)
  const [minutes, setMinutes] = useState<number>(DEFAULTS.minutes)
  const [playCorrect, setPlayCorrect] = useState<boolean>(DEFAULTS.playCorrect)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      // The trigger link itself dispatches its own onClick which
      // toggles open; outside-click closes the rest.
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [open, onClose])

  function toggleNoteType(f: NoteFilter) {
    setNoteTypes(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  function handleStart() {
    // /note-id/custom params (mirrors the existing scheme so the
    // engine continues to work without changes):
    //   input, clef, filters (comma list), accidentals (0/1),
    //   playCorrect (0/1), group (size), stopMode (exercises|minutes),
    //   stopValue (numeric)
    const filters = (
      ['lines', 'spaces', 'ledger'] as const
    ).filter(f => noteTypes.has(f)).join(',')
    const accidentals = noteTypes.has('accidentals') ? '1' : '0'
    const input = answerMode === 'full-piano' ? 'keyboard-full' : 'letters'
    const group = groupMode === 'single' ? '1' : groupSize.toString()
    const stopModeParam = stopMode === 'rounds' ? 'exercises' : 'minutes'
    const stopValue = stopMode === 'rounds' ? rounds : minutes
    const params = new URLSearchParams({
      input,
      clef,
      filters,
      accidentals,
      playCorrect: playCorrect ? '1' : '0',
      group,
      stopMode: stopModeParam,
      stopValue: stopValue.toString(),
    })
    onStart(`/note-id/custom?${params.toString()}`)
  }

  if (!open) return null

  return (
    <div className="nl-sr-custom-overlay" role="dialog" aria-modal="true">
      <div className="nl-sr-custom-panel" ref={panelRef}>
        <div className="nl-sr-custom-panel__head">
          <span className="nl-sr-custom-panel__eyebrow">CUSTOM SESSION</span>
          <button
            type="button"
            className="nl-sr-custom-panel__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="nl-sr-custom-field">
          <span className="nl-sr-custom-field__label">Note types</span>
          <div className="nl-sr-custom-chips">
            {(
              [
                { id: 'lines', label: 'Lines' },
                { id: 'spaces', label: 'Spaces' },
                { id: 'ledger', label: 'Ledger' },
                { id: 'accidentals', label: 'Accidentals' },
              ] as { id: NoteFilter; label: string }[]
            ).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleNoteType(f.id)}
                className={
                  'nl-sr-custom-chip' +
                  (noteTypes.has(f.id) ? ' is-on' : '')
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="nl-sr-custom-field">
          <span className="nl-sr-custom-field__label">Notes per group</span>
          <div className="nl-sr-custom-seg">
            <button
              type="button"
              className={
                'nl-sr-custom-seg__opt' +
                (groupMode === 'single' ? ' is-active' : '')
              }
              onClick={() => setGroupMode('single')}
            >Single</button>
            <button
              type="button"
              className={
                'nl-sr-custom-seg__opt' +
                (groupMode === 'multiple' ? ' is-active' : '')
              }
              onClick={() => setGroupMode('multiple')}
            >Multiple</button>
          </div>
          {groupMode === 'multiple' && (
            <div className="nl-sr-custom-stepper">
              <button type="button" onClick={() => setGroupSize(Math.max(4, groupSize - 1))}>−</button>
              <span>{groupSize}</span>
              <button type="button" onClick={() => setGroupSize(Math.min(10, groupSize + 1))}>+</button>
              <em>notes per round</em>
            </div>
          )}
        </div>

        <div className="nl-sr-custom-field">
          <span className="nl-sr-custom-field__label">Stop after</span>
          <div className="nl-sr-custom-seg">
            <button
              type="button"
              className={
                'nl-sr-custom-seg__opt' +
                (stopMode === 'rounds' ? ' is-active' : '')
              }
              onClick={() => setStopMode('rounds')}
            >Rounds</button>
            <button
              type="button"
              className={
                'nl-sr-custom-seg__opt' +
                (stopMode === 'minutes' ? ' is-active' : '')
              }
              onClick={() => setStopMode('minutes')}
            >Minutes</button>
          </div>
          <div className="nl-sr-custom-stepper">
            {stopMode === 'rounds' ? (
              <>
                <button type="button" onClick={() => setRounds(Math.max(1, rounds - 1))}>−</button>
                <span>{rounds}</span>
                <button type="button" onClick={() => setRounds(Math.min(100, rounds + 1))}>+</button>
                <em>rounds</em>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMinutes(Math.max(1, minutes - 1))}>−</button>
                <span>{minutes}</span>
                <button type="button" onClick={() => setMinutes(Math.min(60, minutes + 1))}>+</button>
                <em>minutes</em>
              </>
            )}
          </div>
        </div>

        <div className="nl-sr-custom-field">
          <label className="nl-sr-custom-toggle">
            <input
              type="checkbox"
              checked={playCorrect}
              onChange={e => setPlayCorrect(e.target.checked)}
            />
            <span>Play correct note after each round</span>
          </label>
        </div>

        <button
          type="button"
          className="nl-sr-custom-start"
          onClick={handleStart}
        >
          Start custom session →
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { nameFor } from '@/lib/metronomeData'

interface MetronomeStageProps {
  bpm: number
  playing: boolean
  pulse: boolean
  tapFlash: boolean
  minBpm: number
  maxBpm: number
  onSetBpm: (n: number) => void
  onTogglePlay: () => void
  onTap: () => void
}

/**
 * Vertically-centered metronome zone: italian label → BPM row with
 * pulse dot → unit caption → slider with ±buttons → Play / Tap.
 *
 * The BPM number is a contentEditable span (preserved from the
 * previous page so the user can type a value directly). We sync its
 * textContent imperatively when BPM changes from another source
 * (slider, ±, tap, localStorage) but leave it alone while the user is
 * actively editing it.
 */
export default function MetronomeStage({
  bpm,
  playing,
  pulse,
  tapFlash,
  minBpm,
  maxBpm,
  onSetBpm,
  onTogglePlay,
  onTap,
}: MetronomeStageProps) {
  const bpmDisplayRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = bpmDisplayRef.current
    if (!el) return
    if (document.activeElement === el) return
    if (el.textContent !== String(bpm)) el.textContent = String(bpm)
  }, [bpm])

  const marking = nameFor(bpm)

  return (
    <section className="nl-met-stage">
      <div className="nl-met-stage__marking" aria-live="polite">{marking}</div>

      <div className="nl-met-stage__bpm-row">
        <span
          className={
            'nl-met-stage__pulse' +
            (playing ? ' is-playing' : '') +
            (pulse ? ' is-on' : '')
          }
          aria-hidden
        />
        <span
          ref={el => {
            bpmDisplayRef.current = el
            if (el && el.textContent === '') el.textContent = String(bpm)
          }}
          role="textbox"
          contentEditable
          suppressContentEditableWarning
          inputMode="numeric"
          aria-label="Beats per minute"
          className="nl-met-stage__bpm"
          onInput={e => {
            const el = e.currentTarget
            const raw = (el.textContent ?? '').replace(/\D/g, '').slice(0, 3)
            const n = parseInt(raw, 10)
            if (!Number.isNaN(n)) onSetBpm(n)
          }}
          onBlur={e => {
            e.currentTarget.textContent = String(bpm)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).blur()
            } else if (
              e.key.length === 1 &&
              !/[0-9]/.test(e.key) &&
              !e.metaKey &&
              !e.ctrlKey
            ) {
              e.preventDefault()
            }
          }}
        />
        {/* Invisible spacer so the BPM number is truly centered in the
            row (mirrors the visible pulse dot on the left). */}
        <span className="nl-met-stage__pulse nl-met-stage__pulse--ghost" aria-hidden />
      </div>

      <div className="nl-met-stage__unit">Beats per minute</div>

      <div className="nl-met-stage__controls">
        <button
          type="button"
          onClick={() => onSetBpm(bpm - 1)}
          aria-label="Decrease BPM"
          className="nl-met-stage__step"
        >
          −
        </button>
        <input
          type="range"
          min={minBpm}
          max={maxBpm}
          value={bpm}
          onChange={e => onSetBpm(parseInt(e.target.value, 10))}
          className="nl-met-stage__slider"
          aria-label="Tempo"
        />
        <button
          type="button"
          onClick={() => onSetBpm(bpm + 1)}
          aria-label="Increase BPM"
          className="nl-met-stage__step"
        >
          +
        </button>
      </div>
      <div className="nl-met-stage__slider-labels">
        <span>{minBpm}</span>
        <span>{maxBpm}</span>
      </div>

      <div className="nl-met-stage__actions">
        <button
          type="button"
          onClick={onTogglePlay}
          className="nl-met-stage__play"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={onTap}
          className={'nl-met-stage__tap' + (tapFlash ? ' is-flash' : '')}
        >
          Tap
        </button>
      </div>

      <p className="nl-met-stage__hint">
        space play/stop &nbsp;·&nbsp; t tap &nbsp;·&nbsp; ↑ ↓ adjust
      </p>
    </section>
  )
}

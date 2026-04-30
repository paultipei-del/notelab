'use client'

import React from 'react'
import { Staff, NoteHead, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

const MAJOR_INTERVALS = [
  { offset: 0, label: 'unison' },
  { offset: 2, label: 'M2' },
  { offset: 4, label: 'M3' },
  { offset: 5, label: 'P4' },
  { offset: 7, label: 'P5' },
  { offset: 9, label: 'M6' },
  { offset: 11, label: 'M7' },
  { offset: 12, label: 'octave' },
] as const

interface TonicSpanScaleProps {
  /** Tonic pitch. Default 'C4'. */
  tonic?: string
  /** Scale type. Currently only 'major' is supported. */
  scale?: 'major'
  size?: LearnSize
  caption?: string
  // ── Layout knobs (all in unscaled pixels; runtime multiplies by T.scale) ─
  /** Horizontal spacing between adjacent scale notes. Default 72. */
  perNote?: number
  /** Vertical gap between successive arc tiers (M2 → M3 → P4 …). Default 20. */
  arcLevelGap?: number
  /** Gap between the highest notehead the arc touches and the lowest arc's peak. Default 18. */
  arcBaseGap?: number
  /** Arc curvature — how much the bezier rises above the straight chord. Default 14. */
  peakRise?: number
  /** Gap between an arc's peak and its label baseline. Default 8. */
  arcLabelGap?: number
  /**
   * Per-arc label Y nudge (positive = lower on screen). Length 7 = one
   * value per non-unison arc (M2 through octave). Useful for fixing
   * one-off label collisions without changing the global stacking.
   */
  arcLabelDy?: number[]
  /**
   * Per-arc peak Y nudge (positive = lower on screen). Same indexing as
   * `arcLabelDy`. Use this if you want to raise/lower one arc relative
   * to its neighbours without changing every arc above it.
   */
  arcPeakDy?: number[]
  /**
   * Per-arc label X nudge (positive = right). Same indexing. Use when a
   * label needs to slide off the peak to clear a neighbour.
   */
  arcLabelDx?: number[]
  /**
   * In-browser tuning panel. When true, a small overlay appears below
   * the figure with sliders for every layout knob — drag them to tune
   * the figure live. Once you find values you like, copy them back into
   * the MDX as static props (or tell the dev to fold them into the
   * defaults). Off by default.
   */
  tune?: boolean
}

/**
 * Ascending major scale on a staff with coral arches above showing every
 * interval from the tonic. Each arch rises FROM the tonic notehead and
 * descends TO a target scale degree's notehead — so the arches visually
 * connect to the actual notes (not floating above the staff). Labels
 * (M2, M3...) sit at each arch's peak and are clickable: clicking a
 * label plays the tonic + target dyad together.
 *
 * The seven non-unison labels stack vertically: M2 at the lowest peak
 * (closest to the staff), octave at the highest peak. Each successive
 * level rises by `arcLevelGap` so labels don't overlap.
 */
export function TonicSpanScale({
  tonic = 'C4',
  scale = 'major',
  size = 'inline',
  caption,
  perNote: perNoteProp = 72,
  arcLevelGap: arcLevelGapProp = 20,
  arcBaseGap: arcBaseGapProp = 18,
  peakRise: peakRiseProp = 14,
  arcLabelGap: arcLabelGapProp = 8,
  arcLabelDy = [],
  arcPeakDy = [],
  arcLabelDx = [],
  tune = false,
}: TonicSpanScaleProps) {
  // Live tuning state. When `tune` is on, sliders below the figure
  // override the prop values so you can drag and see immediately.
  const [tunePerNote, setTunePerNote] = React.useState(perNoteProp)
  const [tuneArcLevelGap, setTuneArcLevelGap] = React.useState(arcLevelGapProp)
  const [tuneArcBaseGap, setTuneArcBaseGap] = React.useState(arcBaseGapProp)
  const [tunePeakRise, setTunePeakRise] = React.useState(peakRiseProp)
  const [tuneArcLabelGap, setTuneArcLabelGap] = React.useState(arcLabelGapProp)
  const [copied, setCopied] = React.useState(false)
  const liveValues = tune
    ? {
        perNote: tunePerNote,
        arcLevelGap: tuneArcLevelGap,
        arcBaseGap: tuneArcBaseGap,
        peakRise: tunePeakRise,
        arcLabelGap: tuneArcLabelGap,
      }
    : {
        perNote: perNoteProp,
        arcLevelGap: arcLevelGapProp,
        arcBaseGap: arcBaseGapProp,
        peakRise: peakRiseProp,
        arcLabelGap: arcLabelGapProp,
      }

  // Per-arc nudges (one entry per non-unison arc, k=0..6 = M2..octave).
  // In `tune` mode these are mutable state seeded from props so you can
  // drag labels around. Otherwise the props win.
  const initLen7 = (arr: number[]): number[] =>
    Array.from({ length: 7 }, (_, i) => arr[i] ?? 0)
  const [tuneLabelDy, setTuneLabelDy] = React.useState<number[]>(initLen7(arcLabelDy))
  const [tuneLabelDx, setTuneLabelDx] = React.useState<number[]>(initLen7(arcLabelDx))
  const [tunePeakDy, setTunePeakDy] = React.useState<number[]>(initLen7(arcPeakDy))
  const liveLabelDy = tune ? tuneLabelDy : initLen7(arcLabelDy)
  const liveLabelDx = tune ? tuneLabelDx : initLen7(arcLabelDx)
  const livePeakDy = tune ? tunePeakDy : initLen7(arcPeakDy)

  // Drag state for in-svg label nudging. Records the arc index, the drag
  // origin (svg-coords), and the offsets-at-drag-start so deltas can be
  // applied cleanly without accumulation drift.
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const dragRef = React.useRef<null | {
    arcIdx: number
    startX: number
    startY: number
    startDx: number
    startDy: number
    moved: boolean
  }>(null)

  const svgPointFromEvent = (e: React.PointerEvent<Element> | PointerEvent): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const vbW = svg.viewBox.baseVal?.width || rect.width
    const vbH = svg.viewBox.baseVal?.height || rect.height
    const sx = vbW / rect.width
    const sy = vbH / rect.height
    return {
      x: ((e as PointerEvent).clientX - rect.left) * sx,
      y: ((e as PointerEvent).clientY - rect.top) * sy,
    }
  }

  void scale
  const T = tokensFor(size)
  const { ready, play, playSequence, playChord } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [hoveredArcIdx, setHoveredArcIdx] = React.useState<number | null>(null)
  const [activeArcIdx, setActiveArcIdx] = React.useState<number | null>(null)
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const { highlightedMidis, highlight, flash, flashSequence } = useNoteHighlight()

  const parsed = parsePitch(tonic)
  if (!parsed) return null

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
  const tonicLetterIdx = LETTERS.indexOf(parsed.letter as typeof LETTERS[number])
  const scaleNotes = MAJOR_INTERVALS.map((iv, i) => {
    const letterIdx = (tonicLetterIdx + i) % 7
    const octaveBump = Math.floor((tonicLetterIdx + i) / 7)
    return {
      pitch: `${LETTERS[letterIdx]}${parsed.octave + octaveBump}`,
      midi: parsed.midi + iv.offset,
      label: iv.label,
    }
  })

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  const clef: Clef = parsed.midi >= 60 ? 'treble' : 'bass'

  const perNote = Math.round(liveValues.perNote * T.scale)
  const innerWidth = Math.max(440, T.clefReserve + perNote * 8 + Math.round(28 * T.scale))
  const staffX = margin
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin
  const noteSpacing = noteAreaWidth / 8
  const noteXs = scaleNotes.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)

  // Arches stack: M2 closest to staff, octave farthest. Each step rises
  // by arcLevelGap. We need enough headroom for the highest peak +
  // its label.
  const arcsCount = 7
  const arcLevelGap = Math.round(liveValues.arcLevelGap * T.scale)
  const arcBaseGap = Math.round(liveValues.arcBaseGap * T.scale)
  const peakRise = Math.round(liveValues.peakRise * T.scale)
  const arcLabelGap = Math.round(liveValues.arcLabelGap * T.scale)

  // Arc top extent for headroom = highest peak + label + buffer
  const arcStackHeight = arcBaseGap + (arcsCount - 1) * arcLevelGap + peakRise + arcLabelGap + T.labelFontSize + Math.round(8 * T.scale)

  const provisional = aggregateBounds(scaleNotes.map(n => n.pitch), 0, clef, T)
  const headroomFromNotes = Math.max(0, -provisional.top)

  const staffY = margin + headroomFromNotes + arcStackHeight
  const bounds = aggregateBounds(scaleNotes.map(n => n.pitch), staffY, clef, T)

  const totalH = bounds.bottom + Math.round(20 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  // Helpers for notehead Y positions (top edge — where the arch lands).
  const noteTopY = (idx: number): number => {
    const pos = staffPosition(parsePitch(scaleNotes[idx].pitch)!, clef)
    return staffY + pos * T.step - T.noteheadHalfHeight - 1
  }

  const lightArc = (idx: number, durationMs: number) => {
    setActiveArcIdx(idx)
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)
    activeTimeoutRef.current = setTimeout(() => setActiveArcIdx(curr => curr === idx ? null : curr), durationMs)
  }

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current)
    }
  }, [])

  // Clicking a notehead plays the interval FROM the tonic TO that note —
  // so the figure only ever sounds intervals, not isolated pitches.
  // Single-notes-in-sequence is reserved for the Play scale button.
  const handleNoteClick = async (idx: number) => {
    setInteracted(true)
    if (idx === 0) {
      // Tonic by itself — just play the tonic (unison).
      flash(scaleNotes[0].midi)
      await play(scaleNotes[0].pitch)
      return
    }
    await handleArchClick(idx - 1)
  }

  const handleArchClick = async (k: number) => {
    setInteracted(true)
    const targetIdx = k + 1
    lightArc(k, 900)
    await playChord([scaleNotes[0].pitch, scaleNotes[targetIdx].pitch])
  }

  const handlePlayScale = async () => {
    setInteracted(true)
    flashSequence(scaleNotes.map(n => n.midi), 380, 380)
    await playSequence(scaleNotes.map(n => n.pitch), 380, '4n')
  }

  // Build arc descriptors. For each k = 0..6 (target = scale degree k+1):
  //   - origin: top of tonic notehead at (noteXs[0], noteTopY(0))
  //   - target: top of degree-N notehead at (noteXs[k+1], noteTopY(k+1))
  //   - peak Y: stacked, M2 closest to staff, octave farthest
  //   - peak X: midpoint between origin and target X
  //   - label sits centered above peak
  const arcs = Array.from({ length: arcsCount }, (_, k) => {
    const targetIdx = k + 1
    const x1 = noteXs[0]
    const x2 = noteXs[targetIdx]
    const y1 = noteTopY(0)
    const y2 = noteTopY(targetIdx)
    const arcsBaseY = Math.min(y1, y2)
    const peakDy = livePeakDy[k] ?? 0
    const labelDy = liveLabelDy[k] ?? 0
    const labelDx = liveLabelDx[k] ?? 0
    const peakY = arcsBaseY - arcBaseGap - k * arcLevelGap - peakRise + peakDy
    const midX = (x1 + x2) / 2
    const controlX = midX
    const controlY = peakY - (peakRise * 0.5)
    const path = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`
    const labelY = peakY - arcLabelGap + labelDy
    const labelX = midX + labelDx
    return {
      label: scaleNotes[targetIdx].label,
      path,
      labelX,
      labelY,
      tonicMidi: scaleNotes[0].midi,
      targetMidi: scaleNotes[targetIdx].midi,
    }
  })

  // Highlighted notes derive from: hovered arc, active arc (just-clicked),
  // currently flashed (during play scale).
  const highlightSet = new Set<number>(highlightedMidis)
  if (hoveredArcIdx !== null) {
    highlightSet.add(arcs[hoveredArcIdx].tonicMidi)
    highlightSet.add(arcs[hoveredArcIdx].targetMidi)
  }
  if (activeArcIdx !== null) {
    highlightSet.add(arcs[activeArcIdx].tonicMidi)
    highlightSet.add(arcs[activeArcIdx].targetMidi)
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Major scale from ${tonic} with intervals from the tonic.`}
      >
        <Staff clef={clef} x={staffX} y={staffY} width={staffWidth} T={T} />

        {/* PASS 1: thin visible arc paths — purely decorative, no
            pointer events so they can never intercept clicks. */}
        {arcs.map((a, i) => {
          const isHot = activeArcIdx === i || hoveredArcIdx === i
          return (
            <path
              key={`arc-path-${i}`}
              d={a.path}
              fill="none"
              stroke={T.highlightAccent}
              strokeWidth={isHot ? 1.8 : 1.2}
              opacity={isHot ? 1 : 0.85}
              pointerEvents="none"
            />
          )
        })}

        {/* PASS 1.5: invisible fat-stroke hit-corridor along each arc.
            Clicking anywhere ALONG the arc curve plays that interval.
            Stroke width is intentionally large (24 viewBox px) so the
            user doesn't have to be precise. Rendered before labels so
            labels still win where they overlap. */}
        {arcs.map((a, i) => (
          <path
            key={`arc-hit-${i}`}
            d={a.path}
            fill="none"
            stroke="transparent"
            strokeWidth={24}
            pointerEvents="stroke"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredArcIdx(i)}
            onMouseLeave={() => setHoveredArcIdx(null)}
            onClick={() => handleArchClick(i)}
          />
        ))}

        {/* PASS 2: arc labels — always above paths in render order so
            their hit areas are never covered by another arc. Each label
            is independently clickable + draggable in tune mode. */}
        {arcs.map((a, i) => {
          const isHot = activeArcIdx === i || hoveredArcIdx === i
          const onLabelDown = (e: React.PointerEvent<SVGElement>) => {
            e.stopPropagation()
            const target = e.currentTarget
            target.setPointerCapture(e.pointerId)
            const pt = svgPointFromEvent(e)
            dragRef.current = {
              arcIdx: i,
              startX: pt.x,
              startY: pt.y,
              startDx: tuneLabelDx[i] ?? 0,
              startDy: tuneLabelDy[i] ?? 0,
              moved: false,
            }
          }
          const onLabelMove = (e: React.PointerEvent<SVGElement>) => {
            const d = dragRef.current
            if (!d || d.arcIdx !== i) return
            // Only nudge offsets while in tune mode; otherwise just track
            // movement so we can distinguish click from drag at pointerup.
            const pt = svgPointFromEvent(e)
            const dx = pt.x - d.startX
            const dy = pt.y - d.startY
            if (Math.hypot(dx, dy) > 3) d.moved = true
            if (!tune) return
            const dxUnscaled = dx / T.scale
            const dyUnscaled = dy / T.scale
            setTuneLabelDx(prev => {
              const next = prev.slice()
              next[i] = Math.round(d.startDx + dxUnscaled)
              return next
            })
            setTuneLabelDy(prev => {
              const next = prev.slice()
              next[i] = Math.round(d.startDy + dyUnscaled)
              return next
            })
          }
          const onLabelUp = (e: React.PointerEvent<SVGElement>) => {
            const d = dragRef.current
            const target = e.currentTarget
            try { target.releasePointerCapture(e.pointerId) } catch {}
            if (d && !d.moved) {
              void handleArchClick(i)
            }
            dragRef.current = null
          }
          return (
            <g key={`arc-label-${i}`}>
              {/* Invisible padding rect underneath the text to give a
                  bigger hit area for dragging — the visible "M3" string
                  is only ~14px wide, so without padding the touch target
                  is finicky. */}
              <rect
                x={a.labelX - Math.round(40 * T.scale)}
                y={a.labelY - T.labelFontSize - 6}
                width={Math.round(80 * T.scale)}
                height={T.labelFontSize + 14}
                fill="transparent"
                pointerEvents="all"
                style={{ cursor: tune ? 'grab' : 'pointer', touchAction: 'none' }}
                onMouseEnter={() => setHoveredArcIdx(i)}
                onMouseLeave={() => setHoveredArcIdx(null)}
                onPointerDown={onLabelDown}
                onPointerMove={onLabelMove}
                onPointerUp={onLabelUp}
                onPointerCancel={onLabelUp}
              />
              <text
                x={a.labelX}
                y={a.labelY}
                fontSize={T.labelFontSize}
                fontFamily={T.fontLabel}
                fill={T.highlightAccent}
                fontWeight={isHot ? 700 : 500}
                textAnchor="middle"
                dominantBaseline="alphabetic"
                style={{ cursor: tune ? 'grab' : 'pointer', userSelect: 'none', touchAction: 'none', pointerEvents: 'none' }}
              >
                {a.label}
              </text>
            </g>
          )
        })}

        {/* Scale noteheads */}
        {scaleNotes.map((n, i) => (
          <NoteHead
            key={`n-${i}-${n.midi}`}
            pitch={n.pitch}
            staffTop={staffY}
            x={noteXs[i]}
            clef={clef}
            T={T}
            duration="whole"
            highlight={highlightSet.has(n.midi)}
            onMouseEnter={() => highlight(n.midi)}
            onMouseLeave={() => highlight(null)}
            onClick={() => handleNoteClick(i)}
            ariaLabel={`${n.pitch} — ${n.label}`}
          />
        ))}
      </svg>

      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center',
        marginTop: 14, flexWrap: 'wrap',
      }}>
        <button
          onClick={handlePlayScale}
          disabled={interacted && !ready}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            padding: '8px 18px',
            background: 'transparent',
            border: `0.5px solid ${T.ink}`,
            borderRadius: 8,
            cursor: interacted && !ready ? 'wait' : 'pointer',
            color: T.ink,
            opacity: interacted && !ready ? 0.5 : 1,
            minWidth: 120,
          }}
        >
          Play scale
        </button>
        {interacted && !ready && (
          <span style={{
            fontFamily: T.fontLabel,
            fontSize: T.smallLabelFontSize,
            color: T.inkSubtle,
            fontStyle: 'italic',
          }}>
            Loading piano samples…
          </span>
        )}
      </div>

      {tune && (
        <div style={{
          marginTop: 18,
          padding: '14px 16px',
          background: '#ECE3CC',
          border: '1px solid #D9CFAE',
          borderRadius: 10,
          fontFamily: T.fontLabel,
          fontSize: 12,
          color: T.ink,
          maxWidth: totalW,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11, color: T.inkSubtle }}>
              Tune
            </div>
            <div style={{ fontSize: 11, color: T.inkSubtle, fontStyle: 'italic', flex: 1, minWidth: 0 }}>
              Drag any label directly on the figure to nudge it.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  const snippet = `<TonicSpanScale\n  perNote={${tunePerNote}}\n  arcLevelGap={${tuneArcLevelGap}}\n  arcBaseGap={${tuneArcBaseGap}}\n  peakRise={${tunePeakRise}}\n  arcLabelGap={${tuneArcLabelGap}}\n  arcLabelDx={[${tuneLabelDx.join(', ')}]}\n  arcLabelDy={[${tuneLabelDy.join(', ')}]}\n  arcPeakDy={[${tunePeakDy.join(', ')}]}\n/>`
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    void navigator.clipboard.writeText(snippet).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    })
                  }
                }}
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: 11,
                  padding: '4px 10px',
                  background: copied ? T.highlightAccent : T.ink,
                  border: `0.5px solid ${copied ? T.highlightAccent : T.ink}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: '#FFFEF8',
                }}
              >
                {copied ? 'Copied!' : 'Save (copy)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTuneLabelDy(initLen7([]))
                  setTuneLabelDx(initLen7([]))
                  setTunePeakDy(initLen7([]))
                }}
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: 11,
                  padding: '4px 10px',
                  background: 'transparent',
                  border: `0.5px solid ${T.ink}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: T.ink,
                }}
              >
                Reset nudges
              </button>
            </div>
          </div>
          {[
            { label: 'perNote', val: tunePerNote, set: setTunePerNote, min: 40, max: 120 },
            { label: 'arcLevelGap', val: tuneArcLevelGap, set: setTuneArcLevelGap, min: 8, max: 40 },
            { label: 'arcBaseGap', val: tuneArcBaseGap, set: setTuneArcBaseGap, min: 4, max: 40 },
            { label: 'peakRise', val: tunePeakRise, set: setTunePeakRise, min: 4, max: 40 },
            { label: 'arcLabelGap', val: tuneArcLabelGap, set: setTuneArcLabelGap, min: 0, max: 24 },
          ].map(row => (
            <label key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ width: 96, color: T.inkSubtle }}>{row.label}</span>
              <input
                type="range"
                min={row.min}
                max={row.max}
                step={1}
                value={row.val}
                onChange={e => row.set(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: T.highlightAccent }}
              />
              <span style={{ width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.val}</span>
            </label>
          ))}
          <pre style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'rgba(42,35,24,0.04)',
            borderRadius: 6,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            lineHeight: 1.5,
            color: T.ink,
            whiteSpace: 'pre-wrap',
          }}>
{`<TonicSpanScale
  perNote={${tunePerNote}}
  arcLevelGap={${tuneArcLevelGap}}
  arcBaseGap={${tuneArcBaseGap}}
  peakRise={${tunePeakRise}}
  arcLabelGap={${tuneArcLabelGap}}
  arcLabelDx={[${tuneLabelDx.join(', ')}]}
  arcLabelDy={[${tuneLabelDy.join(', ')}]}
  arcPeakDy={[${tunePeakDy.join(', ')}]}
  ...
/>`}
          </pre>
        </div>
      )}

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

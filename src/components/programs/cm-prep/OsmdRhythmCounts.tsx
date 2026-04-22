'use client'

// OSMD-rendered rhythm with click-to-edit count entry. Noteheads (and rests)
// are clickable: tap one and a single input appears directly below it. Type
// the count, then tap another note or press Tab/Enter to move on. Non-active
// slots show their stored count as plain text, so nothing overlaps — only
// one editable input is ever on screen.

import { useEffect, useId, useRef, useState, useCallback } from 'react'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'

interface NoteSlot {
  measureIdx:   number
  inMeasureIdx: number
  x:            number                // pixel center, relative to wrapper
  svgEl:        SVGGElement | null    // for attaching click handlers / cursor
}

interface Props {
  src: string
  expected: string[][]
  inputs:   string[][]
  onChangeInput: (measureIdx: number, noteIdx: number, value: string) => void
  disabled: boolean
  feedback: boolean[][] | null
}

export default function OsmdRhythmCounts({
  src, expected, inputs, onChangeInput, disabled, feedback,
}: Props) {
  const rawId = useId()
  const divId = `osmd-rh-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const wrapperRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osmdRef = useRef<any>(null)
  const [slots, setSlots] = useState<NoteSlot[]>([])
  const [staffBottomY, setStaffBottomY] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const measurePositions = useCallback(() => {
    const osmd = osmdRef.current
    const wrapper = wrapperRef.current
    if (!osmd || !wrapper) return

    const wrapperRect = wrapper.getBoundingClientRect()
    const newSlots: NoteSlot[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages = osmd.GraphicSheet?.MusicPages ?? []
    for (const page of pages) {
      for (const system of page.MusicSystems ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffLines = (system.StaffLines ?? []) as any[]
        const numMeasures = staffLines[0]?.Measures?.length ?? 0

        for (let m = 0; m < numMeasures; m++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const byTime = new Map<number, { rank: number; note: any }>()
          for (let sl = 0; sl < staffLines.length; sl++) {
            const measure = staffLines[sl].Measures[m]
            for (const entry of measure.staffEntries ?? []) {
              const ts = entry.relInMeasureTimestamp
              const tKey =
                (ts?.RealValue as number | undefined) ??
                ((ts?.Numerator ?? 0) / (ts?.Denominator || 1))
              for (const ve of entry.graphicalVoiceEntries ?? []) {
                for (const note of ve.notes ?? []) {
                  const isRest = note?.sourceNote?.isRest?.() ?? false
                  const rank = (isRest ? 100 : 0) + sl
                  const existing = byTime.get(tKey)
                  if (!existing || rank < existing.rank) {
                    byTime.set(tKey, { rank, note })
                  }
                }
              }
            }
          }

          const keys = [...byTime.keys()].sort((a, b) => a - b)
          keys.forEach((k, inMeasureIdx) => {
            const { note } = byTime.get(k)!
            const svg = note.getSVGGElement?.() as SVGGElement | null
            // Create a slot even when the SVG element or its bbox is missing:
            // we still want a dash/click-target under every event (including
            // rests), even if positioning has to fall back to a rough x.
            let cx = 0
            if (svg) {
              const notehead = svg.querySelector('g.vf-notehead') as SVGGElement | null
              const target = notehead ?? svg
              const bbox = target.getBoundingClientRect()
              if (bbox.width > 0 || bbox.height > 0) {
                cx = bbox.left - wrapperRect.left + bbox.width / 2
              }
            }
            newSlots.push({
              measureIdx: m,
              inMeasureIdx,
              x: cx,
              svgEl: svg,
            })
          })
        }
      }
    }

    const container = document.getElementById(divId)
    const svgEl = container?.querySelector('svg')
    let bottom = 0
    if (svgEl) {
      const r = svgEl.getBoundingClientRect()
      bottom = r.bottom - wrapperRect.top
    }

    setSlots(newSlots)
    setStaffBottomY(bottom)
  }, [divId])

  // Load and render OSMD once per src.
  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setSlots([])
    setSelectedIdx(null)

    import('opensheetmusicdisplay').then(mod => {
      if (cancelled) return
      const OpenSheetMusicDisplay = mod.OpenSheetMusicDisplay
      const container = document.getElementById(divId)
      if (!container) return
      container.innerHTML = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const osmd = new (OpenSheetMusicDisplay as any)(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
      })
      osmd.EngravingRules.StretchLastSystemLine = true
      osmd.EngravingRules.LastSystemMaxScalingFactor = 3
      osmdRef.current = osmd

      osmd.load(src).then(() => {
        if (cancelled) return
        osmd.render()
        // Give the browser two frames to paint before measuring — one frame
        // isn't always enough for OSMD's SVG to settle, especially for rests
        // whose bbox can come back as 0×0 on the very next tick.
        requestAnimationFrame(() => {
          if (cancelled) return
          requestAnimationFrame(() => {
            if (cancelled) return
            measurePositions()
            setLoaded(true)
          })
        })
      })
    })
    return () => { cancelled = true }
  }, [src, divId, measurePositions])

  // Re-measure on container resize.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => requestAnimationFrame(() => measurePositions()))
    ro.observe(el)
    return () => ro.disconnect()
  }, [measurePositions])

  // Attach click handlers to the SVG elements for each slot so students can
  // tap noteheads (or rest glyphs) to select them for editing.
  useEffect(() => {
    if (disabled) return
    const cleanups: Array<() => void> = []
    slots.forEach((slot, idx) => {
      const el = slot.svgEl
      if (!el) return
      const handler = () => setSelectedIdx(idx)
      el.addEventListener('click', handler)
      el.style.cursor = 'pointer'
      cleanups.push(() => {
        el.removeEventListener('click', handler)
        el.style.cursor = ''
      })
    })
    return () => { cleanups.forEach(fn => fn()) }
  }, [slots, disabled])

  const textTop = staffBottomY + 8   // sit closer to the staff than full inputs did

  // Count palette: clicking a button appends its character to the selected
  // slot's input (or auto-selects the first slot if none selected). NEXT
  // advances selection; BACKSPACE trims the last char.
  function paletteApply(ch: string) {
    if (disabled) return
    const currentIdx = selectedIdx ?? 0
    if (ch === 'NEXT') {
      const nextIdx = currentIdx + 1
      setSelectedIdx(nextIdx < slots.length ? nextIdx : 0)
      return
    }
    const slot = slots[currentIdx]
    if (!slot) return
    const current = inputs[slot.measureIdx]?.[slot.inMeasureIdx] ?? ''
    const newVal  = ch === 'BACKSPACE' ? current.slice(0, -1) : current + ch
    onChangeInput(slot.measureIdx, slot.inMeasureIdx, newVal)
    if (selectedIdx === null) setSelectedIdx(currentIdx)
  }
  const paletteItems: Array<{ value: string; label: string; wide?: boolean }> = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '+', label: '+' },
    { value: 'BACKSPACE', label: '⌫', wide: true },
    { value: 'NEXT', label: 'Next →', wide: true },
  ]

  return (
    <div>
      {/* Wrapper contains OSMD + absolutely-positioned dashes/inputs. Slot
          coordinates are measured against wrapperRect, so they must live
          INSIDE wrapperRef, and wrapperRef's paddingBottom reserves space
          below the staff for them to sit in. */}
      <div ref={wrapperRef} style={{ position: 'relative', paddingBottom: 48 }}>
        <div id={divId} style={{ overflowX: 'auto' }} />
      {loaded && slots.map((slot, idx) => {
        const value = inputs[slot.measureIdx]?.[slot.inMeasureIdx] ?? ''
        const exp   = expected[slot.measureIdx]?.[slot.inMeasureIdx] ?? ''
        const ok    = feedback?.[slot.measureIdx]?.[slot.inMeasureIdx]
        const isSelected = selectedIdx === idx

        // Editing state: a wide input anchored on the note's x. Only one at
        // a time, so it can extend over neighbors without any overlap issue.
        if (isSelected && !disabled) {
          return (
            <input
              key={`${slot.measureIdx}-${slot.inMeasureIdx}`}
              autoFocus
              value={value}
              onChange={e => onChangeInput(slot.measureIdx, slot.inMeasureIdx, e.target.value)}
              onBlur={() => setSelectedIdx(null)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  const nextIdx = e.shiftKey ? idx - 1 : idx + 1
                  setSelectedIdx(nextIdx >= 0 && nextIdx < slots.length ? nextIdx : null)
                } else if (e.key === 'Escape') {
                  setSelectedIdx(null)
                }
              }}
              style={{
                // Borderless, transparent input — the typed text appears in
                // place of the dash, no long underline beneath each note.
                position: 'absolute', left: slot.x - 50, top: textTop,
                width: 100, height: 20, textAlign: 'center',
                border: 'none', background: 'transparent', color: DARK,
                fontFamily: F, fontSize: 13, fontWeight: 600,
                outline: 'none', padding: 0, boxSizing: 'border-box',
                caretColor: DARK,
                zIndex: 2,
              }}
            />
          )
        }

        // Non-editing state: show stored count (or a placeholder dash). Text
        // is narrow, centered under the notehead, and won't overflow into
        // neighbors for typical count lengths.
        const color = ok === undefined ? (value ? DARK : GREY) : ok ? CORRECT : WRONG
        return (
          <span
            key={`${slot.measureIdx}-${slot.inMeasureIdx}`}
            onClick={() => !disabled && setSelectedIdx(idx)}
            style={{
              position: 'absolute', left: slot.x - 40, top: textTop,
              width: 80, textAlign: 'center',
              fontFamily: F, fontSize: 13, fontWeight: 600,
              color,
              cursor: disabled ? 'default' : 'pointer',
              userSelect: 'none',
              lineHeight: '18px',
            }}
          >
            {value || (disabled ? '' : '—')}
            {ok === false && (
              <span style={{ display: 'block', fontSize: 10, color: CORRECT, marginTop: 1 }}>
                {exp}
              </span>
            )}
          </span>
        )
      })}
      </div>

      {/* Count palette — sits BELOW the wrapper, so it flows after the staff
          + dashes instead of overlapping them. */}
      {!disabled && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#7A7060', margin: '0 0 6px', textAlign: 'center' }}>
            Count palette
          </p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center',
            flexWrap: 'wrap' }}>
            {paletteItems.map(p => (
              <button key={p.value}
                onMouseDown={e => e.preventDefault()}
                onClick={() => paletteApply(p.value)}
                aria-label={p.value === 'BACKSPACE' ? 'backspace'
                          : p.value === 'NEXT' ? 'next note' : p.value}
                style={{
                  minWidth: p.wide ? 64 : 40,
                  height: 40, borderRadius: 8,
                  border: '1.5px solid #DDD8CA',
                  background: 'white', color: DARK,
                  fontFamily: F, fontSize: 16, fontWeight: 700,
                  padding: '0 10px',
                  cursor: 'pointer',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

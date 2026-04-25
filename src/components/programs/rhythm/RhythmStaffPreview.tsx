'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { fetchExerciseFile } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'

interface Props {
  exerciseId: string
  /** Soft min-height placeholder while notation loads. The container itself grows freely past this — no hard clip. */
  maxHeight?: number
}

/**
 * Pick a "measures per system" target that gives the most even split across
 * lines. OSMD's natural width-based layout often produces lopsided results
 * (e.g. 5+1 for a 6-bar exercise). Returning `null` lets OSMD use its default.
 */
function pickMeasuresPerLine(total: number): number | null {
  if (total <= 4) return null
  // Hand-picked splits up to 12 — covers every Fundamentals exercise length.
  const TABLE: Record<number, number> = {
    5: 3,   // 3+2
    6: 3,   // 3+3
    7: 4,   // 4+3
    8: 4,   // 4+4
    9: 3,   // 3+3+3
    10: 4,  // 4+4+2  (5+5 would also work but OSMD forces equal lines)
    11: 4,  // 4+4+3
    12: 4,  // 4+4+4
  }
  if (TABLE[total]) return TABLE[total]
  // Beyond the table, default to 4 — slightly long lines beat lopsided.
  return 4
}

/**
 * Static OSMD render of a rhythm exercise's MusicXML, used as a non-interactive
 * preview on launcher and topic pages. The trainer at /rhythm owns playback —
 * this component only mounts a frozen snapshot of the same notation.
 */
export default function RhythmStaffPreview({ exerciseId, maxHeight = 220 }: Props) {
  const rawId = useId()
  const divId = `rhythm-preview-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)

    Promise.all([
      import('opensheetmusicdisplay'),
      fetchExerciseFile(exerciseId),
    ]).then(([{ OpenSheetMusicDisplay }, buffer]) => {
      const container = document.getElementById(divId)
      if (!container || cancelled) return
      container.innerHTML = ''
      const osmd = new OpenSheetMusicDisplay(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
        // The rhythm exercise MXL files don't contain explicit <beam> markup —
        // the trainer auto-beams on the fly via its own algorithm. OSMD
        // respects the XML literally by default (i.e. flagged eighths). Enable
        // OSMD's own auto-beamer so the static preview matches the trainer.
        autoBeam: true,
      })
      osmd.EngravingRules.StretchLastSystemLine = true
      osmd.EngravingRules.LastSystemMaxScalingFactor = 3
      const blob = new Blob([buffer], { type: 'application/vnd.recordare.musicxml+zip' })
      osmd.load(blob).then(() => {
        if (cancelled) return
        // OSMD's natural layout fits as many measures per system as the width allows.
        // For 6 bars in a moderately-wide container that yields 5+1 — visually awful.
        // Force a more even split by picking a target measures-per-line based on the
        // total count. Aims for 3- or 4-bar systems, whichever divides more evenly.
        const total = (osmd.Sheet?.SourceMeasures ?? []).length
        const perLine = pickMeasuresPerLine(total)
        if (perLine != null) osmd.EngravingRules.RenderXMeasuresPerLineAkaSystem = perLine
        osmd.render()
        setReady(true)
      }).catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load notation')
      })
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load notation')
    })

    return () => { cancelled = true }
  }, [divId, exerciseId])

  return (
    <div
      ref={containerRef}
      style={{
        background: '#FDFAF3',
        border: '1px solid #DDD8CA',
        borderRadius: '14px',
        padding: '16px 18px',
        position: 'relative',
        minHeight: ready ? 'auto' : `${maxHeight}px`,
        // No max-height — the container grows to fit OSMD's full layout so
        // multi-system notation isn't clipped at the bottom.
        overflow: 'hidden',
      }}
    >
      {error && (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
          Notation preview unavailable.
        </p>
      )}
      {!error && !ready && (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0AEA8', margin: 0 }}>
          Loading notation…
        </p>
      )}
      <div id={divId} style={{ width: '100%' }} />
    </div>
  )
}

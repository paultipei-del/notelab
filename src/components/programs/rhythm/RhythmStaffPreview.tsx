'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { fetchExerciseFile } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'

interface Props {
  exerciseId: string
  /** Approximate visible height in px. Notation overflowing this is clipped (preview only). */
  maxHeight?: number
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
      })
      osmd.EngravingRules.StretchLastSystemLine = true
      osmd.EngravingRules.LastSystemMaxScalingFactor = 3
      const blob = new Blob([buffer], { type: 'application/vnd.recordare.musicxml+zip' })
      osmd.load(blob).then(() => {
        if (cancelled) return
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
        minHeight: `${maxHeight}px`,
        maxHeight: `${maxHeight}px`,
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

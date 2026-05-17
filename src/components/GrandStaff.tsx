'use client'

/**
 * Grand-staff React wrapper. Owns a div ref, debounces re-renders via
 * requestAnimationFrame, and calls into the pure `renderStaff` for every
 * paint. Receives already-spelled note letters from the parent so it
 * doesn't duplicate chord-detection spelling logic.
 */

import { useEffect, useRef } from 'react'
import { renderStaff, type StaffNote } from '@/lib/staffRenderer'
import { midiToVexFlowKey } from '@/lib/midiToVexFlow'

type Props = {
  heldNotes: Set<number>
  /** Parallel to sorted-ascending heldNotes. Index i = letter for ith MIDI note. */
  spelledNotes: string[]
  /** "C major", "F# minor", etc. Drives both key signature and minor handling. */
  currentKey: string
  /** MIDI note number that separates treble (>=) from bass (<). Default = middle C. */
  splitPoint?: number
  width?: number
  height?: number
}

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function defaultSpelling(midi: number): string {
  return SHARPS[((midi % 12) + 12) % 12]
}

/** Convert a "C major" / "F# minor" key string into VexFlow's keySig format. */
function toVexKeySignature(currentKey: string): string {
  const trimmed = currentKey.trim().replace('♯', '#').replace('♭', 'b')
  const m = /^([A-Ga-g][#b]?)\s+(major|minor|maj|min|M|m)$/i.exec(trimmed)
  if (!m) return 'C'
  const tonic = m[1][0].toUpperCase() + m[1].slice(1)
  const modeRaw = m[2].toLowerCase()
  const isMinor = modeRaw.startsWith('m') && modeRaw !== 'maj' && modeRaw !== 'major'
  return isMinor ? `${tonic}m` : tonic
}

export function GrandStaff({
  heldNotes,
  spelledNotes,
  currentKey,
  splitPoint = 60,
  width = 600,
  height = 240,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const container = containerRef.current
      rafIdRef.current = null
      if (!container) return

      const sortedMidi = [...heldNotes].sort((a, b) => a - b)
      const paired = sortedMidi.map((midi, i) => ({
        midi,
        letter: spelledNotes[i] ?? defaultSpelling(midi),
      }))

      const trebleNotes: StaffNote[] = paired
        .filter(p => p.midi >= splitPoint)
        .map(p => ({
          ...midiToVexFlowKey({ midi: p.midi, letter: p.letter }),
          letter: p.letter,
        }))

      const bassNotes: StaffNote[] = paired
        .filter(p => p.midi < splitPoint)
        .map(p => ({
          ...midiToVexFlowKey({ midi: p.midi, letter: p.letter }),
          letter: p.letter,
        }))

      renderStaff(container, {
        trebleNotes,
        bassNotes,
        keySignature: toVexKeySignature(currentKey),
        width,
        height,
      })
    })

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [heldNotes, spelledNotes, currentKey, splitPoint, width, height])

  return <div ref={containerRef} className="pvt-grand-staff" />
}

export default GrandStaff

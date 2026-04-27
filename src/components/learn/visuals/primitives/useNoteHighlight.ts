import { useState, useCallback } from 'react'

export function useNoteHighlight() {
  const [hoveredMidi, setHoveredMidi] = useState<number | null>(null)
  const [activeMidis, setActiveMidis] = useState<number[]>([])

  const highlight = useCallback((midi: number | null) => {
    setHoveredMidi(midi)
  }, [])

  const flash = useCallback((midi: number, durationMs: number = 600) => {
    setActiveMidis(prev => [...prev, midi])
    setTimeout(() => {
      setActiveMidis(prev => prev.filter(m => m !== midi))
    }, durationMs)
  }, [])

  const flashSequence = useCallback(
    (midis: number[], stagger: number = 380, hold: number = 600) => {
      midis.forEach((m, i) => {
        setTimeout(() => flash(m, hold), i * stagger)
      })
    },
    [flash],
  )

  const all = hoveredMidi !== null ? [hoveredMidi, ...activeMidis] : activeMidis

  return {
    hoveredMidi,
    activeMidis,
    highlightedMidis: all,
    highlight,
    flash,
    flashSequence,
  }
}

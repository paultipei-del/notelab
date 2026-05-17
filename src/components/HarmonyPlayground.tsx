'use client'

/**
 * Shared free-play playground used by both /programs/harmony and
 * /tools/chord-id. Owns the MIDI hook, chord detection, QWERTY fallback,
 * and the full visual stack (DeviceControls + ChordReadout + GrandStaff
 * + PianoRoll). Surrounding chrome (breadcrumb, header, marketing copy)
 * is owned by the route, not by this component.
 *
 * Future variations (e.g. share-screenshot button on the tools route,
 * "Start structured practice" CTA on the programs route) can land as
 * additional optional props without changing call sites that don't
 * need them.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMidiInput } from '@/lib/useMidiInput'
import { detectChord } from '@/lib/chordDetection'
import { PianoRoll } from '@/components/PianoRoll'
import { GrandStaff } from '@/components/GrandStaff'
import { ChordReadout } from '@/components/ChordReadout'
import { DeviceControls } from '@/components/DeviceControls'

const F = 'var(--font-jost), sans-serif'

// One-octave QWERTY → MIDI mapping starting at C4 = 60.
const QWERTY_TO_MIDI: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65,
  t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ';': 76,
}

interface Props {
  /** Default key shown in the picker. Defaults to "C major". */
  defaultKey?: string
}

export function HarmonyPlayground({ defaultKey = 'C major' }: Props = {}) {
  const midi = useMidiInput()
  const [currentKey, setCurrentKey] = useState<string>(defaultKey)

  const sortedMidi = useMemo(
    () => [...midi.heldNotes].sort((a, b) => a - b),
    [midi.heldNotes],
  )

  const chordResult = useMemo(
    () => detectChord({ midiNotes: sortedMidi, currentKey }),
    [sortedMidi, currentKey],
  )

  // QWERTY fallback. Always live so users without a controller can still
  // play; per-key Set ref prevents auto-repeat from re-firing noteOn.
  const qwertyHeldRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      const midiNum = QWERTY_TO_MIDI[key]
      if (midiNum === undefined) return
      if (qwertyHeldRef.current.has(key)) return
      qwertyHeldRef.current.add(key)
      midi.noteOn(midiNum)
      e.preventDefault()
    }
    function up(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      const midiNum = QWERTY_TO_MIDI[key]
      if (midiNum === undefined) return
      qwertyHeldRef.current.delete(key)
      midi.noteOff(midiNum)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [midi])

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <DeviceControls
          devices={midi.devices}
          activeDeviceId={midi.activeDeviceId}
          onDeviceChange={midi.setActiveDevice}
          currentKey={currentKey}
          onKeyChange={setCurrentKey}
          isSupported={midi.isSupported}
          permissionState={midi.permissionState}
          onRequestAccess={midi.requestAccess}
        />
      </div>

      <ChordReadout result={chordResult} currentKey={currentKey} />

      <div style={{
        background: 'var(--cream-key)',
        border: '1px solid var(--brown-faint)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}>
        <GrandStaff
          heldNotes={midi.heldNotes}
          spelledNotes={chordResult.spelledNotes}
          currentKey={currentKey}
          width={840}
          height={240}
        />
      </div>

      <div style={{
        background: 'var(--cream-key)',
        border: '1px solid var(--brown-faint)',
        borderRadius: 16,
        padding: 16,
      }}>
        <PianoRoll heldNotes={midi.heldNotes} width={840} height={120} />
      </div>

      {midi.error && (
        <p style={{
          marginTop: 16, fontFamily: F, fontSize: 12,
          color: 'var(--oxblood)',
        }}>
          {midi.error}
        </p>
      )}
    </>
  )
}

export default HarmonyPlayground

'use client'

/**
 * Harmony Reading Program — integrated playground.
 *
 * Wires together useMidiInput (MIDI + QWERTY noteOn/noteOff), detectChord
 * (chord name + roman numeral + spelled notes), and three visualisations
 * (ChordReadout, GrandStaff, PianoRoll) along with the DeviceControls
 * toolbar.
 *
 * QWERTY fallback maps one octave starting at C4 onto the home row:
 *   A S D F G H J K L ;  → C4 D4 E4 F4 G4 A4 B4 C5 D5 E5  (whites)
 *   W E   T Y U   O P    → C#4 D#4 F#4 G#4 A#4 C#5 D#5    (blacks)
 * Repeat events are suppressed via a held-keys ref so a long press fires
 * exactly one noteOn / noteOff pair.
 */

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMidiInput } from '@/lib/useMidiInput'
import { detectChord } from '@/lib/chordDetection'
import { PianoRoll } from '@/components/PianoRoll'
import { GrandStaff } from '@/components/GrandStaff'
import { ChordReadout } from '@/components/ChordReadout'
import { DeviceControls } from '@/components/DeviceControls'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// One-octave QWERTY → MIDI mapping starting at C4 = 60.
const QWERTY_TO_MIDI: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65,
  t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ';': 76,
}

export default function HarmonyPage() {
  const midi = useMidiInput()
  const [currentKey, setCurrentKey] = useState<string>('C major')

  // Sorted MIDI numbers — feeds both detectChord and the visualizations
  // expecting a parallel `spelledNotes` array.
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
      // Prevent the page from scrolling on spacebar etc. — only consume
      // keys we mapped to notes.
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
    <div style={{ minHeight: '100vh', background: 'transparent' }} className="nl-harmony-page">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Programs
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: 28, marginBottom: 32 }}>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: '#7A7060', marginBottom: 10,
          }}>
            Harmony Reading
          </p>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 300,
            fontSize: 'clamp(28px,4vw,44px)',
            color: '#2A2318', marginBottom: 12, letterSpacing: '0.02em',
          }}>
            Play any chord. See what it is, what it&apos;s called, and what it does in the key.
          </h1>
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-body)',
            color: '#7A7060', maxWidth: 600, lineHeight: 1.7,
          }}>
            Plug in a MIDI controller — or use your computer keyboard
            (<code>A S D F G H J K L ;</code> for white keys, the row above
            for blacks). The chord name, roman numeral, grand staff, and
            piano roll all update in real time.
          </p>
        </div>

        {/* Toolbar */}
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

        {/* Chord readout — the visual anchor */}
        <ChordReadout result={chordResult} currentKey={currentKey} />

        {/* Grand staff */}
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

        {/* Piano roll */}
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

      </div>
    </div>
  )
}

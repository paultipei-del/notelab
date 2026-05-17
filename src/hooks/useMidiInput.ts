'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Web MIDI input hook.
 *
 * Calls navigator.requestMIDIAccess() on mount, subscribes to every
 * connected input, and exposes the set of MIDI note numbers currently
 * held down. Note-on with velocity 0 is treated as note-off (some
 * controllers send running-status note-off this way).
 *
 * Status reflects whether the browser exposed Web MIDI, whether the user
 * granted permission, and whether at least one input is connected. The
 * connect/disconnect events on the access object are also wired so that
 * plugging in a controller mid-session "just works."
 */

export type MidiStatus =
  | 'idle'              // hook just mounted, requestMIDIAccess not yet awaited
  | 'unsupported'       // navigator.requestMIDIAccess is undefined
  | 'denied'            // user denied permission OR access threw
  | 'no-inputs'         // permission granted but zero inputs connected
  | 'connected'         // at least one input connected

export interface UseMidiInputResult {
  heldNotes: Set<number>
  status: MidiStatus
  /** Human-readable list of currently-connected input names. */
  inputNames: string[]
}

export function useMidiInput(): UseMidiInputResult {
  const [heldNotes, setHeldNotes] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<MidiStatus>('idle')
  const [inputNames, setInputNames] = useState<string[]>([])

  // Keep a stable ref to the access object so the disconnect handler can
  // detach listeners cleanly even after re-renders.
  const accessRef = useRef<MIDIAccess | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      setStatus('unsupported')
      return
    }

    let cancelled = false

    function handleMessage(e: Event) {
      const msg = e as MIDIMessageEvent
      const data = msg.data
      if (!data || data.length < 2) return
      const status = data[0] & 0xf0
      const note = data[1]
      const velocity = data.length > 2 ? data[2] : 0
      // Note-on with velocity 0 is note-off (running-status convention).
      const isNoteOn  = status === 0x90 && velocity > 0
      const isNoteOff = status === 0x80 || (status === 0x90 && velocity === 0)
      if (!isNoteOn && !isNoteOff) return
      setHeldNotes(prev => {
        const next = new Set(prev)
        if (isNoteOn) next.add(note)
        else          next.delete(note)
        return next
      })
    }

    function attach(access: MIDIAccess) {
      const names: string[] = []
      access.inputs.forEach(input => {
        input.addEventListener('midimessage', handleMessage)
        names.push(input.name ?? 'Unnamed input')
      })
      setInputNames(names)
      setStatus(names.length > 0 ? 'connected' : 'no-inputs')
    }

    function detach(access: MIDIAccess) {
      access.inputs.forEach(input => {
        input.removeEventListener('midimessage', handleMessage as EventListener)
      })
    }

    function handleStateChange(this: MIDIAccess) {
      // Inputs may appear or disappear at any time; re-attach and recount.
      detach(this)
      attach(this)
    }

    navigator.requestMIDIAccess({ sysex: false })
      .then(access => {
        if (cancelled) return
        accessRef.current = access
        attach(access)
        access.addEventListener('statechange', handleStateChange)
      })
      .catch(() => {
        if (cancelled) return
        setStatus('denied')
      })

    return () => {
      cancelled = true
      const access = accessRef.current
      if (access) {
        detach(access)
        access.removeEventListener('statechange', handleStateChange as EventListener)
      }
    }
  }, [])

  return { heldNotes, status, inputNames }
}

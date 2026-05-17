'use client'

/**
 * Web MIDI input hook with QWERTY-fallback note triggers.
 *
 * Permission is NOT auto-requested on mount — the consumer must call
 * `requestAccess()` from a user-initiated event (e.g. button click) so
 * the browser prompt doesn't appear on page load.
 *
 * `noteOn` / `noteOff` are exposed for callers that want to simulate
 * MIDI events from a computer keyboard. They mutate the same heldNotes
 * set, so MIDI + QWERTY coexist seamlessly.
 *
 * Inputs may appear / disappear at any time. `statechange` re-enumerates
 * devices and (re)attaches handlers automatically.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type MidiDevice = {
  id: string
  name: string
}

export type MidiPermissionState =
  | 'unknown'   // hook just mounted, support not yet checked or access not requested
  | 'prompt'    // browser will ask if access is requested
  | 'granted'   // access granted, listening for notes
  | 'denied'    // user denied or access threw

export type MidiState = {
  heldNotes: Set<number>
  devices: MidiDevice[]
  activeDeviceId: string | null
  isSupported: boolean
  permissionState: MidiPermissionState
  error: string | null
}

export type UseMidiInputResult = MidiState & {
  setActiveDevice: (deviceId: string | null) => void
  requestAccess: () => Promise<void>
  noteOn: (midi: number) => void
  noteOff: (midi: number) => void
}

export function useMidiInput(): UseMidiInputResult {
  const [heldNotes, setHeldNotes] = useState<Set<number>>(new Set())
  const [devices, setDevices] = useState<MidiDevice[]>([])
  const [activeDeviceId, setActiveDeviceIdState] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<MidiPermissionState>('unknown')
  const [error, setError] = useState<string | null>(null)

  // Refs survive re-renders and let the message handler read the latest
  // activeDeviceId without re-creating the closure on every change.
  const accessRef         = useRef<MIDIAccess | null>(null)
  const activeDeviceIdRef = useRef<string | null>(null)

  const isSupported = typeof navigator !== 'undefined'
    && 'requestMIDIAccess' in navigator

  // Initial permission probe — non-prompting.
  useEffect(() => {
    if (!isSupported) {
      setPermissionState('unknown')
      return
    }
    // Some browsers expose a permissions query for midi; treat any failure
    // as a benign "we don't know, default to prompt-on-request".
    const perms = (navigator as Navigator & {
      permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> }
    }).permissions
    if (!perms || typeof perms.query !== 'function') {
      setPermissionState('prompt')
      return
    }
    perms.query({ name: 'midi' as PermissionName })
      .then(status => {
        const s = status.state
        if (s === 'granted' || s === 'denied' || s === 'prompt') {
          setPermissionState(s)
        } else {
          setPermissionState('prompt')
        }
      })
      .catch(() => setPermissionState('prompt'))
  }, [isSupported])

  function handleMidiMessage(this: MIDIInput, e: Event) {
    const msg = e as MIDIMessageEvent
    // Honour activeDevice filter — if a specific device is selected, ignore
    // messages from any other input.
    if (activeDeviceIdRef.current !== null && this.id !== activeDeviceIdRef.current) {
      return
    }
    const data = msg.data
    if (!data || data.length < 2) return
    const status   = data[0] & 0xf0
    const note     = data[1]
    const velocity = data.length > 2 ? data[2] : 0
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

  function attachHandlers(access: MIDIAccess) {
    const next: MidiDevice[] = []
    access.inputs.forEach(input => {
      // Idempotent: removing-then-adding guarantees no duplicates after
      // statechange re-attaches.
      input.removeEventListener('midimessage', handleMidiMessage as EventListener)
      input.addEventListener('midimessage', handleMidiMessage as EventListener)
      next.push({ id: input.id, name: input.name ?? 'Unnamed input' })
    })
    setDevices(next)
  }

  function detachHandlers(access: MIDIAccess) {
    access.inputs.forEach(input => {
      input.removeEventListener('midimessage', handleMidiMessage as EventListener)
    })
  }

  const requestAccess = useCallback(async () => {
    if (!isSupported) {
      setError('Web MIDI is not supported in this browser')
      return
    }
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      accessRef.current = access
      attachHandlers(access)
      setPermissionState('granted')
      setError(null)
      access.addEventListener('statechange', () => attachHandlers(access))
    } catch (err) {
      setPermissionState('denied')
      setError(err instanceof Error ? err.message : 'MIDI access denied')
    }
  // intentionally no deps — handlers are stable and isSupported is module-scoped boolean
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported])

  const setActiveDevice = useCallback((deviceId: string | null) => {
    activeDeviceIdRef.current = deviceId
    setActiveDeviceIdState(deviceId)
    // Clear any notes that were held from the previous device so the
    // visualisation doesn't show ghost-stuck keys after the switch.
    setHeldNotes(new Set())
  }, [])

  const noteOn = useCallback((midi: number) => {
    setHeldNotes(prev => {
      if (prev.has(midi)) return prev
      const next = new Set(prev)
      next.add(midi)
      return next
    })
  }, [])

  const noteOff = useCallback((midi: number) => {
    setHeldNotes(prev => {
      if (!prev.has(midi)) return prev
      const next = new Set(prev)
      next.delete(midi)
      return next
    })
  }, [])

  // Cleanup on unmount — drop every listener so handlers don't fire into
  // stale React state after navigation.
  useEffect(() => {
    return () => {
      const access = accessRef.current
      if (access) detachHandlers(access)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    heldNotes, devices, activeDeviceId, isSupported, permissionState, error,
    setActiveDevice, requestAccess, noteOn, noteOff,
  }
}

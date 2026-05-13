// Mic permission probe — used by the /sight-reading hub and the
// Real Piano pre-roll to pre-check microphone access before the
// user clicks Begin.
//
// Chrome / Firefox: navigator.permissions.query({name: 'microphone'})
//   returns 'granted' | 'denied' | 'prompt'.
// Safari: Permissions API for 'microphone' is not implemented as of
//   2026-Q1. The query throws or returns nothing; we fall back to
//   'unknown' and the UI shows neutral "permission needed" copy.

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

/** Probe the current mic permission state without prompting the user.
 *  Returns 'unknown' on browsers where the Permissions API isn't
 *  available for microphone (notably Safari). */
export async function probeMicPermission(): Promise<MicPermissionState> {
  if (typeof navigator === 'undefined') return 'unknown'
  if (!navigator.permissions || !navigator.permissions.query) return 'unknown'
  try {
    // `name: 'microphone'` isn't yet in TS's lib.dom.d.ts as a
    // PermissionName everywhere, hence the cast.
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })
    const state = status.state as MicPermissionState
    if (state === 'granted' || state === 'denied' || state === 'prompt') {
      return state
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/** Request mic access. Resolves to 'granted' if the user allows,
 *  'denied' if the user rejects (or hardware unavailable). Tracks
 *  the returned stream so the caller can stop tracks on cleanup. */
export async function requestMicAccess(): Promise<{
  state: 'granted' | 'denied'
  stream: MediaStream | null
}> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return { state: 'denied', stream: null }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { state: 'granted', stream }
  } catch {
    return { state: 'denied', stream: null }
  }
}

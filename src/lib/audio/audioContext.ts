/**
 * Shared AudioContext helpers — Safari-friendly lazy init.
 *
 * Why this exists:
 *   - `new AudioContext()` (unprefixed) is unavailable on iOS Safari
 *     before 14.5; the prefixed `webkitAudioContext` is the fallback.
 *   - Safari (and iOS Safari especially) is strict about the user-gesture
 *     contract for resuming a suspended AudioContext: any `await` between
 *     the click event and the resume call drops the gesture and resume
 *     silently fails. Use `unlockSync` as the *first* line in any click
 *     handler that creates audio; it's synchronous so the gesture chain
 *     stays intact even if other awaits follow.
 *
 * Usage:
 *   const ctx = createAudioContext()
 *   button.addEventListener('click', async () => {
 *     unlockSync(ctx)              // sync: keeps Safari gesture
 *     await loadSomething()        // any async work is fine after
 *     // ... schedule audio
 *   })
 */

/**
 * Construct an AudioContext using whichever constructor the browser
 * exposes. Returns `null` on the server (where `window` is absent).
 */
export function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  return new Ctor()
}

/**
 * Synchronously call `resume()` if the context is suspended. Must be
 * invoked from inside a user-gesture stack frame. The promise returned
 * by `resume()` is intentionally not awaited — Safari only checks that
 * the call started inside the gesture, not that it has finished.
 */
export function unlockSync(ctx: AudioContext | null | undefined): void {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
  } catch {
    /* swallow — best-effort */
  }
}

/**
 * Safari's `ctx.currentTime` can stay at 0 for several render frames
 * after `resume()` resolves. Scheduling audio at "now" during that
 * window means events end up in the past once the clock starts ticking
 * and don't fire. Poll on rAF until the clock starts (or 500ms timeout).
 */
export async function waitForCtxClock(ctx: AudioContext): Promise<void> {
  const deadline =
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 500
  while (
    ctx.currentTime === 0 &&
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) < deadline
  ) {
    await new Promise<void>(resolve => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => resolve())
      } else {
        setTimeout(resolve, 16)
      }
    })
  }
}

/**
 * Install a one-shot document-level unlocker for an AudioContext. The
 * first pointer/touch/keyboard interaction anywhere on the page calls
 * `resume()` synchronously. After it fires once, the listeners detach.
 *
 * Use when the AudioContext exists at module load (e.g. for a recurring
 * playback feature) but the user hasn't necessarily clicked the play
 * button yet. Without this, Safari leaves the context suspended even if
 * the user has been interacting with other UI on the page.
 */
export function installDocumentUnlocker(ctx: AudioContext): void {
  if (typeof document === 'undefined') return
  const onFirstInteract = () => {
    unlockSync(ctx)
    document.removeEventListener('pointerdown', onFirstInteract)
    document.removeEventListener('touchstart', onFirstInteract)
    document.removeEventListener('keydown', onFirstInteract)
  }
  document.addEventListener('pointerdown', onFirstInteract, { once: true })
  document.addEventListener('touchstart', onFirstInteract, { once: true })
  document.addEventListener('keydown', onFirstInteract, { once: true })
}

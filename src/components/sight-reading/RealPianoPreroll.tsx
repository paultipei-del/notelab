'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  probeMicPermission,
  requestMicAccess,
  type MicPermissionState,
} from '@/lib/micPermission'

interface RealPianoPrerollProps {
  /** Sight-read deck ID (e.g., "sight-read-treble-3"). Used to derive
   *  clef + level for the mode badge and to route mode-switches. */
  deckId: string
  /** Deck title to display alongside the clef glyph. */
  deckTitle: string
  /** Called after the user clicks Begin and mic access is confirmed
   *  granted. The caller should hide the pre-roll and start the
   *  audio scheduler / round flow. The granted MediaStream is
   *  handed back so the caller can stop tracks on cleanup if it
   *  doesn't intend to re-acquire. */
  onBegin: (stream: MediaStream | null) => void
  /** Called when the user clicks "← Back to setup" — should route
   *  back to /sight-reading. */
  onBack: () => void
}

/** Parse the clef + level slug from a sight-read deck id. */
function parseDeckId(deckId: string): {
  clef: 'treble' | 'bass' | 'grand' | null
  level: string | null
} {
  // Pattern: sight-read-{clef}-{free|1..10}
  const m = deckId.match(/^sight-read-(treble|bass|grand)-(.+)$/)
  if (!m) return { clef: null, level: null }
  return { clef: m[1] as 'treble' | 'bass' | 'grand', level: m[2] }
}

const CLEF_GLYPHS = {
  treble: '\u{1D11E}',
  bass: '\u{1D122}',
  grand: '\u{1D11E}',
} as const

const CLEF_LABELS = {
  treble: 'Treble Clef',
  bass: 'Bass Clef',
  grand: 'Grand Staff',
} as const

/**
 * Pre-roll screen shown before a Real Piano sight-read session starts.
 * Probes mic permission, shows three states (granted / denied /
 * prompt-or-unknown), and gates the Begin button on a successful
 * permission grant.
 *
 * Denied state offers two mode-switch buttons that route to the
 * non-mic engines preserving the same deck.
 */
export default function RealPianoPreroll({
  deckId,
  deckTitle,
  onBegin,
  onBack,
}: RealPianoPrerollProps) {
  const router = useRouter()
  const { clef } = parseDeckId(deckId)
  const [permState, setPermState] = useState<MicPermissionState>('unknown')
  const [hasAttempted, setHasAttempted] = useState(false)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    probeMicPermission().then(state => {
      if (aliveRef.current) setPermState(state)
    })
    return () => {
      aliveRef.current = false
    }
  }, [])

  async function handleBegin() {
    setHasAttempted(true)
    const result = await requestMicAccess()
    if (result.state === 'granted') {
      setPermState('granted')
      onBegin(result.stream)
    } else {
      setPermState('denied')
    }
  }

  function switchTo(input: 'letters' | 'keyboard-full') {
    router.push(`/note-id/${deckId}?input=${input}`)
  }

  const isDenied = permState === 'denied'
  const isGranted = permState === 'granted'
  const showPromptCopy = !isDenied && !isGranted

  return (
    <div className="nl-sr-preroll">
      <header className="nl-sr-preroll__header">
        <button
          type="button"
          className="nl-sr-preroll__back"
          onClick={onBack}
        >
          ← Back to setup
        </button>
        <span className="nl-sr-preroll__meta">
          Real Piano · {clef ? CLEF_LABELS[clef] : 'Sight Reading'}
        </span>
      </header>

      <div className="nl-sr-preroll__center">
        <span
          className={
            'nl-sr-preroll__clef' + (isDenied ? ' is-dim' : '')
          }
          aria-hidden
        >
          {clef ? CLEF_GLYPHS[clef] : '\u{1D11E}'}
        </span>
        <h1 className="nl-sr-preroll__title">{deckTitle}</h1>
        <p className="nl-sr-preroll__desc">
          A note will appear on the staff. Play it on your piano — the mic
          detects pitch and advances automatically. Keep playing until you
          find the right note — there&rsquo;s no penalty for trying.
        </p>

        {isDenied ? (
          <div className="nl-sr-preroll__denied" role="alert">
            <span className="nl-sr-preroll__denied-title">
              Microphone access denied
            </span>
            <p className="nl-sr-preroll__denied-desc">
              Real Piano needs your mic to detect notes. Enable access in your
              browser settings, or switch to a different answer mode for this
              session.
            </p>
            <div className="nl-sr-preroll__denied-actions">
              <button
                type="button"
                className="nl-sr-preroll__switch"
                onClick={() => switchTo('letters')}
              >
                Switch to Letters
              </button>
              <button
                type="button"
                className="nl-sr-preroll__switch"
                onClick={() => switchTo('keyboard-full')}
              >
                Switch to Full Piano
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              'nl-sr-preroll__mic' +
              (isGranted ? ' is-ready' : ' is-prompt')
            }
          >
            <span
              className={
                'nl-sr-preroll__mic-dot' + (isGranted ? ' is-pulse' : '')
              }
              aria-hidden
            />
            <span className="nl-sr-preroll__mic-label">
              {isGranted
                ? 'Microphone ready'
                : showPromptCopy && hasAttempted
                ? 'Click Begin to allow access'
                : showPromptCopy
                ? 'Microphone permission needed — click Begin to allow'
                : 'Checking microphone…'}
            </span>
          </div>
        )}

        <button
          type="button"
          className="nl-sr-preroll__begin"
          onClick={handleBegin}
          disabled={isDenied}
        >
          Begin →
        </button>
      </div>
    </div>
  )
}

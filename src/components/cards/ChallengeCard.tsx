'use client'

import { useState, useEffect } from 'react'
import type { Card } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

/**
 * Application & Review "challenge" card. Prompts and answers for these
 * decks are multi-part — typically a setup paragraph followed by 2–4
 * numbered sub-questions. The standard FlipCard renders this as giant
 * italic serif centered on a small card; this component renders it as
 * left-aligned prose inside a wider reading-column card, parses the
 * numbered items into a real `<ol>`, and hides the answer behind a
 * Reveal button until the user clicks it.
 */

/**
 * Split text containing "1. ... 2. ... 3. ..." patterns into a leading
 * paragraph and an array of numbered items. If no numbered items are
 * detected, the whole text is treated as a single paragraph (items empty).
 *
 * We match "N. " or "\nN. " patterns starting at N=1 and walking up
 * sequentially — this is tighter than a regex that would eat "e.g. 2"
 * or stray decimals inside the prose.
 */
export function parseNumberedItems(text: string): { intro: string; items: string[] } {
  const trimmed = text.trim()
  const items: string[] = []
  let intro = trimmed

  // Single-pass scan: for each k=1..N, find "k. " in order starting from
  // the last match. Only accept matches that sit at the start of a line
  // or after whitespace — guards against stray "e.g. 2" inside prose.
  const markers: { n: number; idx: number }[] = []
  let searchFrom = 0
  for (let k = 1; k < 20; k++) {
    const m = `${k}. `
    const idx = trimmed.indexOf(m, searchFrom)
    if (idx < 0) break
    // Ensure the match starts at the beginning or after whitespace/newline
    // (so "e.g. 2. foo" inside prose doesn't trigger).
    const prev = idx === 0 ? ' ' : trimmed[idx - 1]
    if (prev !== ' ' && prev !== '\n' && prev !== '\t') {
      searchFrom = idx + m.length
      k-- // retry same k after this false match
      continue
    }
    markers.push({ n: k, idx })
    searchFrom = idx + m.length
  }

  if (markers.length === 0) {
    return { intro: trimmed, items: [] }
  }

  intro = trimmed.slice(0, markers[0].idx).trim()
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].idx + `${markers[i].n}. `.length
    const end = i + 1 < markers.length ? markers[i + 1].idx : trimmed.length
    items.push(trimmed.slice(start, end).trim())
  }
  return { intro, items }
}

function ParsedBlock({ text }: { text: string }) {
  const { intro, items } = parseNumberedItems(text)
  return (
    <>
      {intro && (
        <p style={{ fontFamily: F, fontSize: '17px', fontWeight: 400, color: '#2A2318', lineHeight: 1.65, margin: '0 0 14px 0' }}>
          {intro}
        </p>
      )}
      {items.length > 0 && (
        <ol style={{ fontFamily: F, fontSize: '17px', fontWeight: 400, color: '#2A2318', lineHeight: 1.65, margin: '0 0 14px 0', paddingLeft: '28px' }}>
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: '10px' }}>
              {item}
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

export default function ChallengeCard({
  card,
  revealed,
  onReveal,
}: {
  card: Card
  revealed: boolean
  onReveal: () => void
}) {
  // Reset the reveal state when the card changes. (Parent owns `revealed`
  // but keying on card.id lets us also be defensive locally.)
  const [localRevealed, setLocalRevealed] = useState(revealed)
  useEffect(() => { setLocalRevealed(revealed) }, [revealed, card.id])

  function handleReveal() {
    setLocalRevealed(true)
    onReveal()
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
        background: '#FDFAF3',
        border: '1px solid #DDD8CA',
        borderRadius: '16px',
        padding: 'clamp(28px, 4vw, 48px)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 6px rgba(26,26,24,0.05), 0 10px 28px rgba(26,26,24,0.07)',
      }}
    >
      {/* Challenge label */}
      <p
        style={{
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A7060',
          margin: '0 0 14px 0',
        }}
      >
        Challenge
      </p>

      {/* Prompt */}
      <ParsedBlock text={card.front} />

      {/* Reveal button (or hidden once revealed) */}
      {!localRevealed && (
        <button
          type="button"
          onClick={handleReveal}
          style={{
            marginTop: '12px',
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            background: '#1A1A18',
            color: 'white',
            fontFamily: F,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reveal answer →
        </button>
      )}

      {/* Answer block */}
      {localRevealed && (
        <div
          style={{
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid #EDE8DF',
          }}
        >
          <p
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#B5402A',
              margin: '0 0 14px 0',
            }}
          >
            Answer
          </p>
          <ParsedBlock text={card.back} />
        </div>
      )}

      {/* Deck title — matches the italic-serif caption style used elsewhere.
          The parent StudyEngine topbar already shows the deck title, so this
          component doesn't duplicate it. */}
    </div>
  )
}

'use client'

import Link from 'next/link'

/**
 * Placeholder page for the future "Compose your own" examination builder.
 * Linked from the Custom card in /flashcards's Examination Hall section.
 * Replace this with the real builder when the spec lands.
 */
export default function CustomPracticePage() {
  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center', position: 'relative' }}>
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#a0381c',
            marginBottom: 12,
          }}
        >
          Practice · Custom
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontSize: 56,
            fontWeight: 500,
            color: '#1a1208',
            letterSpacing: '-0.015em',
            lineHeight: 1.05,
            margin: '0 0 18px 0',
          }}
        >
          Compose your own.
          <br />
          <em style={{ color: '#a0381c', fontStyle: 'italic' }}>In the works.</em>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 18,
            color: '#5a4028',
            lineHeight: 1.5,
            margin: '0 auto 28px auto',
            maxWidth: 460,
            textWrap: 'balance',
          }}
        >
          A custom examination builder is coming. Pick the topics, the length,
          and the mode. Check back soon.
        </p>
        <div
          style={{
            width: 64,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
            margin: '0 auto 28px auto',
          }}
        />
        <Link
          href="/flashcards"
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: '#a0381c',
            borderBottom: '1px solid rgba(160, 56, 28, 0.3)',
            paddingBottom: 1,
            textDecoration: 'none',
          }}
        >
          ← Back to the library
        </Link>
      </div>
    </main>
  )
}

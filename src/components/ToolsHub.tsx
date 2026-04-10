'use client'

import Link from 'next/link'
import { TOOLS } from '@/lib/tools'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export type ToolsHubProps = {
  /**
   * `page` — same title + intro sizes as `/collection` hero / `/flashcards` page hero.
   * `section` (default) — smaller heading on the home page.
   */
  headingVariant?: 'section' | 'page'
}

export default function ToolsHub({ headingVariant = 'section' }: ToolsHubProps) {
  const pageHero = headingVariant === 'page'

  return (
    <div style={{ marginBottom: '64px' }}>
      <div style={{ marginBottom: pageHero ? '32px' : '24px' }}>
        {pageHero ? (
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#1A1A18', marginBottom: '12px', letterSpacing: '0.02em' }}>Tools</h1>
        ) : (
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>Tools</h2>
        )}
        <p
          style={{
            fontFamily: F,
            fontSize: pageHero ? '15px' : '13px',
            fontWeight: 300,
            color: '#888780',
            lineHeight: pageHero ? 1.7 : undefined,
            maxWidth: pageHero ? '560px' : undefined,
            margin: 0,
          }}
        >
          Interactive exercises — no account needed
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
            <div
              style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', height: '100%', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div>
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '20px', marginBottom: '12px', background: '#EDE8DF', color: '#888780', fontFamily: F }}>{tool.badge}</span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '6px' }}>{tool.title}</h3>
                <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.6 }}>{tool.desc}</p>
              </div>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#BA7517', marginTop: '16px' }}>{tool.cta}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

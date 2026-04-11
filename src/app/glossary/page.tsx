'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { GLOSSARY, GlossaryEntry } from '@/lib/glossaryData'

const LANGUAGES = ['All', 'French', 'German', 'Italian', 'Abbreviation'] as const
type Filter = typeof LANGUAGES[number]

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const LANG_COLORS: Record<string, string> = {
  French: '#E8EEF9',
  German: '#E8F5E9',
  Italian: '#FEF3E2',
  Abbreviation: '#2C2A27',
}
const LANG_TEXT: Record<string, string> = {
  French: '#3A5A9B',
  German: '#2E6B3E',
  Italian: '#BA7517',
  Abbreviation: '#C4C0B8',
}

export default function Glossary() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    return GLOSSARY.filter(e => {
      const langMatch = filter === 'All' || e.language === filter
      if (!q) return langMatch
      return langMatch && (
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q)
      )
    })
  }, [query, filter])

  // Group by first letter
  const grouped = useMemo(() => {
    const map: Record<string, GlossaryEntry[]> = {}
    for (const e of results) {
      const letter = e.term[0].toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(e)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [results])

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      {/* Search + filters */}
      <div style={{ background: '#353330', borderBottom: '1px solid #484542', padding: '12px 32px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'center', position: 'sticky' as const, top: '56px', zIndex: 9 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', padding: 0, flexShrink: 0 }}>← Back</button>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms or definitions…"
          style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #484542', background: '#2C2A27', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#F7F4EF', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {LANGUAGES.map(lang => (
            <button key={lang} onClick={() => setFilter(lang)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (filter === lang ? '#1A1A18' : '#484542'), background: filter === lang ? '#1A1A18' : 'white', color: filter === lang ? 'white' : '#C4C0B8', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {grouped.length === 0 ? (
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#C4C0B8', textAlign: 'center' as const, marginTop: '48px' }}>No terms found.</p>
        ) : grouped.map(([letter, entries]) => (
          <div key={letter} style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#484542', marginBottom: '12px', borderBottom: '1px solid #EDE8DF', paddingBottom: '4px' }}>{letter}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px' }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ background: '#353330', borderRadius: i === 0 ? '12px 12px 0 0' : i === entries.length - 1 ? '0 0 12px 12px' : '0', padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 auto', width: '220px' }}>
                    <span style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#F7F4EF', fontStyle: 'italic' }}>{entry.term}</span>
                    <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: LANG_COLORS[entry.language], color: LANG_TEXT[entry.language], fontFamily: F, fontSize: '10px', fontWeight: 300, verticalAlign: 'middle' }}>{entry.language}</span>
                  </div>
                  <p style={{ flex: 1, fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#555', lineHeight: 1.6, margin: 0 }}>{entry.definition}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  Abbreviation: '#F2EDDF',
}
const LANG_TEXT: Record<string, string> = {
  French: '#3A5A9B',
  German: '#2E6B3E',
  Italian: '#B5402A',
  Abbreviation: '#7A7060',
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
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Search + filters */}
      <div style={{ background: '#FDFAF3', borderBottom: '1px solid #DDD8CA', padding: '12px 32px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'center', position: 'sticky' as const, top: '60px', zIndex: 9 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: 0, flexShrink: 0 }}>← Back</button>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms or definitions…"
          style={{ flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #DDD8CA', background: '#F2EDDF', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#2A2318', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {LANGUAGES.map(lang => (
            <button key={lang} onClick={() => setFilter(lang)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (filter === lang ? '#1A1A18' : '#DDD8CA'), background: filter === lang ? '#1A1A18' : 'white', color: filter === lang ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer' }}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {grouped.length === 0 ? (
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', textAlign: 'center' as const, marginTop: '48px' }}>No terms found.</p>
        ) : grouped.map(([letter, entries]) => (
          <div key={letter} style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#DDD8CA', marginBottom: '12px', borderBottom: '1px solid #EDE8DF', paddingBottom: '4px' }}>{letter}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px' }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ background: '#FDFAF3', borderRadius: i === 0 ? '12px 12px 0 0' : i === entries.length - 1 ? '0 0 12px 12px' : '0', padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 auto', width: '220px' }}>
                    <span style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: '#2A2318', fontStyle: 'italic' }}>{entry.term}</span>
                    <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: LANG_COLORS[entry.language], color: LANG_TEXT[entry.language], fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, verticalAlign: 'middle' }}>{entry.language}</span>
                  </div>
                  <p style={{ flex: 1, fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#555', lineHeight: 1.6, margin: 0 }}>{entry.definition}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

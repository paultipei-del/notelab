'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import repertoireData from '@/lib/data/cm-repertoire-complete.json'
import dynamic from 'next/dynamic'
const MagrathBrowser = dynamic(() => import('./magrath/page'), { ssr: false })

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface CMEntry {
  composer: string
  title: string
  publisher: string
  restrictions?: string
}

interface CMCategory {
  id: string
  label: string
  repertoire: CMEntry[]
}

interface CMLevel {
  id: string
  label: string
  requirements: {
    pieces: number
    memorized: number
    categories: boolean
    notes: string
  }
  categories: CMCategory[]
}

function imslpUrl(composer: string, title: string) {
  const q = encodeURIComponent(`${title} ${composer}`.trim())
  return `https://imslp.org/index.php?search=${q}&title=Special%3ASearch`
}

const data = repertoireData as { meta: { source: string; program: string; notes: string }; levels: CMLevel[] }
const LEVELS = data.levels

const LEVEL_ORDER = ['preparatory','level_1','level_2','level_3','level_4','level_5','level_6','level_7','level_8','level_9','advanced']

export default function RepertoirePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { hasSubscription, hasPurchased } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription() || hasPurchased('pro')

  const [activeTab, setActiveTab] = useState<'cm' | 'magrath'>('cm')
  const [selectedLevel, setSelectedLevel] = useState<string>('level_1')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<'composer' | 'title' | 'publisher'>('composer')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const searchRef = useRef<HTMLInputElement>(null)

  const currentLevel = LEVELS.find(l => l.id === selectedLevel)

  useEffect(() => {
    if (currentLevel && currentLevel.categories.length > 0) {
      setSelectedCategory(currentLevel.categories[0].id)
    }
  }, [selectedLevel])

  const currentCategory = currentLevel?.categories.find(c => c.id === selectedCategory)

  const sortedEntries = useMemo(() => {
    if (!currentCategory) return []
    return [...currentCategory.repertoire].sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [currentCategory, sortCol, sortDir])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const results: { level: string; category: string; entry: CMEntry }[] = []
    for (const level of LEVELS) {
      for (const cat of level.categories) {
        for (const entry of cat.repertoire) {
          if (entry.composer.toLowerCase().includes(q) || entry.title.toLowerCase().includes(q)) {
            results.push({ level: level.label, category: cat.label, entry })
          }
        }
      }
    }
    return results
  }, [search])

  function toggleSort(col: 'composer' | 'title' | 'publisher') {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  if (loading) return null

  if (!isPro) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
                <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>Pro Feature</p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '12px' }}>Repertoire Browser</h1>
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', marginBottom: '32px', lineHeight: 1.7 }}>
            Browse graded repertoire lists by level — Preparatory through Advanced. Search by composer or title across all levels.
          </p>
          <button onClick={() => router.push('/')}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => router.push('/tools')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', padding: 0, marginBottom: '16px', display: 'block' }}>← Back</button>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#2A2318', marginBottom: '4px' }}>Repertoire Browser</h1>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>Browse graded repertoire lists by level, or search by composer and title across the full catalog.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {(['cm', 'magrath'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid ' + (activeTab === tab ? '#1A1A18' : '#DDD8CA'), background: activeTab === tab ? '#1A1A18' : 'white', color: activeTab === tab ? 'white' : '#7A7060', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
              {tab === 'cm' ? 'CM Syllabus' : 'Magrath Guide'}
            </button>
          ))}
        </div>

        {activeTab === 'magrath' ? <MagrathBrowser /> : (
        <>
        {/* Search */}
        <div style={{ position: 'relative' as const, marginBottom: '32px' }}>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by composer or title across all levels…"
            style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px', border: '1px solid #DDD8CA', background: '#FDFAF3', fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', outline: 'none', boxSizing: 'border-box' as const }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A7060', fontSize: '18px' }}>×</button>
          )}
        </div>

        {/* Search Results */}
        {search.trim() ? (
          <div>
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', marginBottom: '16px' }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</p>
            {searchResults.length === 0 ? (
              <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '40px', textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060' }}>No results found.</p>
              </div>
            ) : (
              <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                      {['Level', 'Category', 'Composer', 'Title', 'Publisher'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', textAlign: 'left' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((r, i) => (
                      <tr key={i} style={{ borderBottom: i < searchResults.length - 1 ? '1px solid #F2EDDF' : 'none' }}>
                        <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', whiteSpace: 'nowrap' as const }}>{r.level}</td>
                        <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', whiteSpace: 'nowrap' as const }}>{r.category}</td>
                        <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318' }}>{r.entry.composer}</td>
                        <td style={{ padding: '10px 16px', fontFamily: SERIF, fontSize: '15px', fontWeight: 400, color: '#2A2318' }}>
                          {r.entry.title}
                          {r.entry.restrictions && <span style={{ marginLeft: '8px', fontFamily: F, fontSize: '11px', color: '#B5402A', fontStyle: 'italic' }}>{r.entry.restrictions}</span>}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060' }}>{r.entry.publisher}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Level selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '24px' }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setSelectedLevel(l.id)}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: '1px solid ' + (selectedLevel === l.id ? '#1A1A18' : '#DDD8CA'), background: selectedLevel === l.id ? '#1A1A18' : 'white', color: selectedLevel === l.id ? 'white' : '#7A7060', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {l.label}
                </button>
              ))}
            </div>

            {currentLevel && (
              <>
                {/* Requirements */}
                <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '4px' }}>Pieces Required</p>
                    <p style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318' }}>{currentLevel.requirements.pieces}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '4px' }}>Memorized</p>
                    <p style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318' }}>{currentLevel.requirements.memorized}</p>
                  </div>
                  {currentLevel.requirements.notes && (
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '4px' }}>Notes</p>
                      <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.6 }}>{currentLevel.requirements.notes}</p>
                    </div>
                  )}
                </div>

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
                  {currentLevel.categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                      style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid ' + (selectedCategory === c.id ? '#B5402A' : '#DDD8CA'), background: selectedCategory === c.id ? '#B5402A' : 'white', color: selectedCategory === c.id ? 'white' : '#7A7060', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {c.label} <span style={{ opacity: 0.7 }}>({c.repertoire.length})</span>
                    </button>
                  ))}
                </div>

                {/* Repertoire table */}
                {currentCategory && (
                  <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', overflowX: 'auto' as const }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: '500px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                          {(['composer', 'title', 'publisher'] as const).map(col => (
                            <th key={col} onClick={() => toggleSort(col)}
                              style={{ padding: '12px 16px', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: sortCol === col ? '#B5402A' : '#7A7060', textAlign: 'left' as const, cursor: 'pointer', userSelect: 'none' as const, whiteSpace: 'nowrap' as const }}>
                              {col} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                            </th>
                          ))}
                          <th style={{ padding: '12px 16px', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEntries.map((entry, i) => (
                          <tr key={i} style={{ borderBottom: i < sortedEntries.length - 1 ? '1px solid #F2EDDF' : 'none', transition: 'background 0.1s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF8' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
                            <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318', whiteSpace: 'nowrap' as const }}>{entry.composer}</td>
                            <td style={{ padding: '10px 16px', fontFamily: SERIF, fontSize: '15px', fontWeight: 400, color: '#2A2318' }}>
                              {entry.title}
                              {entry.restrictions && (
                                <span style={{ marginLeft: '8px', fontFamily: F, fontSize: '11px', color: '#B5402A', fontStyle: 'italic' as const }}>{entry.restrictions}</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', whiteSpace: 'nowrap' as const }}>{entry.publisher}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center' as const }}>
                              <a href={imslpUrl(entry.composer, entry.title)} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#7A7060', fontSize: '14px', textDecoration: 'none', opacity: 0.6 }}
                                title="Search on IMSLP">↗</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </>)}
    </div>
    </div>
  )
}

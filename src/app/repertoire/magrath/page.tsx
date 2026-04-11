'use client'

import { useState, useMemo, useEffect } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface MagrathEntry {
  composer: string
  dates: string
  country: string
  title: string
  level: string
  level_sort: number
  description: string
  period: string
}

interface MagrathPeriod {
  id: string
  label: string
  entries: MagrathEntry[]
}

interface MagrathData {
  meta: { source: string; author: string; publisher: string; year: string; level_system: string; notes: string }
  periods: MagrathPeriod[]
}

function imslpUrl(composer: string, title: string) {
  const q = encodeURIComponent(`${title} ${composer}`.trim())
  return `https://imslp.org/index.php?search=${q}&title=Special%3ASearch`
}

export default function MagrathBrowser() {
  const [data, setData] = useState<MagrathData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('baroque')
  const [search, setSearch] = useState('')
  const [levelMin, setLevelMin] = useState(1)
  const [levelMax, setLevelMax] = useState(10)
  const [sortCol, setSortCol] = useState<'level_sort' | 'composer' | 'title'>('level_sort')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    import('@/lib/data/magrath-repertoire.json').then(m => {
      setData(m.default as MagrathData)
      setLoading(false)
    })
  }, [])

  const currentPeriod = data?.periods.find(p => p.id === selectedPeriod)

  const filteredEntries = useMemo(() => {
    if (!currentPeriod) return []
    return [...currentPeriod.entries]
      .filter(e => e.level_sort >= levelMin && e.level_sort <= levelMax)
      .sort((a, b) => {
        if (sortCol === 'level_sort') return sortDir === 'asc' ? a.level_sort - b.level_sort : b.level_sort - a.level_sort
        const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? ''
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
  }, [currentPeriod, levelMin, levelMax, sortCol, sortDir])

  const searchResults = useMemo(() => {
    if (!search.trim() || !data) return []
    const q = search.toLowerCase()
    const results: { period: string; entry: MagrathEntry; idx: number }[] = []
    for (const period of data.periods) {
      for (const entry of period.entries) {
        if (entry.composer.toLowerCase().includes(q) || entry.title.toLowerCase().includes(q)) {
          results.push({ period: period.label, entry, idx: results.length })
        }
      }
    }
    return results
  }, [search, data])

  function toggleSort(col: 'level_sort' | 'composer' | 'title') {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>Loading Magrath data…</p>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '4px' }}>Jane Magrath · Alfred Publishing, 1995</p>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060' }}>3,141 entries · 552 composers · 4 periods · Levels 1–10</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' as const, marginBottom: '24px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search composer or title across all periods…"
          style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px', border: '1px solid #DDD8CA', background: '#FDFAF3', fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', outline: 'none', boxSizing: 'border-box' as const }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A7060', fontSize: '18px' }}>×</button>}
      </div>

      {search.trim() ? (
        <div>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', marginBottom: '16px' }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
          <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                  {['Period', 'Composer', 'Title', 'Level', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', textAlign: 'left' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchResults.map((r, i) => (
                  <>
                    <tr key={i} onClick={() => setExpandedIdx(expandedIdx === i ? null : i)} style={{ borderBottom: '1px solid #F2EDDF', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', whiteSpace: 'nowrap' as const }}>{r.period}</td>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318' }}>{r.entry.composer}</td>
                      <td style={{ padding: '10px 16px', fontFamily: SERIF, fontSize: '15px', fontWeight: 400, color: r.entry.title ? '#1A1A18' : '#7A7060', fontStyle: r.entry.title ? 'normal' : 'italic' as const }}>
                        {r.entry.title || r.entry.description.slice(0, 60) + '…'}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060' }}>{r.entry.level}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' as const }}>
                        <a href={imslpUrl(r.entry.composer, r.entry.title)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#7A7060', fontSize: '14px', textDecoration: 'none', opacity: 0.6 }}
                          title="Search on IMSLP">↗</a>
                      </td>
                    </tr>
                    {expandedIdx === i && (
                      <tr key={`exp-${i}`}>
                        <td colSpan={4} style={{ padding: '12px 16px 20px 56px', background: '#FAFAF8', borderBottom: '1px solid #EDE8DF' }}>
                          <p style={{ fontFamily: F, fontSize: '11px', color: '#7A7060', marginBottom: '6px' }}>{r.entry.composer} · {r.entry.dates} · {r.entry.country} · Level {r.entry.level}</p>
                          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318', lineHeight: 1.8, maxWidth: '700px' }}>{r.entry.description}</p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* Period tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
            {data?.periods.map(p => (
              <button key={p.id} onClick={() => { setSelectedPeriod(p.id); setExpandedIdx(null) }}
                style={{ padding: '7px 16px', borderRadius: '20px', border: '1px solid ' + (selectedPeriod === p.id ? '#1A1A18' : '#DDD8CA'), background: selectedPeriod === p.id ? '#1A1A18' : 'white', color: selectedPeriod === p.id ? 'white' : '#7A7060', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                {p.label} <span style={{ opacity: 0.6 }}>({p.entries.length})</span>
              </button>
            ))}
          </div>

          {/* Level filter */}
          <div style={{ background: '#FDFAF3', borderRadius: '12px', border: '1px solid #DDD8CA', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060' }}>Level</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const active = n >= levelMin && n <= levelMax
                return (
                  <button key={n} onClick={() => {
                    if (levelMin === n && levelMax === n) { setLevelMin(1); setLevelMax(10) }
                    else if (levelMin === 1 && levelMax === 10) { setLevelMin(n); setLevelMax(n) }
                    else if (n < levelMin) setLevelMin(n)
                    else if (n > levelMax) setLevelMax(n)
                    else if (n === levelMin) setLevelMin(Math.min(n + 1, levelMax))
                    else setLevelMax(Math.max(n - 1, levelMin))
                    setExpandedIdx(null)
                  }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid ' + (active ? '#B5402A' : '#DDD8CA'), background: active ? '#FAEEDA' : 'white', color: active ? '#B5402A' : '#7A7060', fontFamily: F, fontSize: '12px', fontWeight: active ? 400 : 300, cursor: 'pointer' }}>
                    {n}
                  </button>
                )
              })}
              {(levelMin > 1 || levelMax < 10) && (
                <button onClick={() => { setLevelMin(1); setLevelMax(10) }} style={{ padding: '0 10px', height: '32px', borderRadius: '8px', border: '1px solid #DDD8CA', background: '#FDFAF3', color: '#7A7060', fontFamily: F, fontSize: '11px', cursor: 'pointer' }}>All</button>
              )}
            </div>
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', marginLeft: 'auto' }}>{filteredEntries.length} entries</p>
          </div>

          {/* Table */}
          <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                  {([['level_sort', 'Level'], ['composer', 'Composer'], ['title', 'Title']] as const).map(([col, label]) => (
                    <th key={col} onClick={() => toggleSort(col)} style={{ padding: '12px 16px', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: sortCol === col ? '#B5402A' : '#7A7060', textAlign: 'left' as const, cursor: 'pointer', userSelect: 'none' as const, whiteSpace: 'nowrap' as const }}>
                      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', textAlign: 'left' as const }}>Description</th>
                  <th style={{ padding: '12px 16px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => (
                  <>
                    <tr key={i} onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      style={{ borderBottom: '1px solid #F2EDDF', cursor: 'pointer', background: expandedIdx === i ? '#FAFAF8' : 'white' }}
                      onMouseEnter={e => { if (expandedIdx !== i) e.currentTarget.style.background = '#FAFAF8' }}
                      onMouseLeave={e => { if (expandedIdx !== i) e.currentTarget.style.background = 'white' }}>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', whiteSpace: 'nowrap' as const }}>{entry.level}</td>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318', whiteSpace: 'nowrap' as const }}>{entry.composer}</td>
                      <td style={{ padding: '10px 16px', fontFamily: SERIF, fontSize: '15px', fontWeight: 400, color: entry.title ? '#1A1A18' : '#7A7060', fontStyle: entry.title ? 'normal' : 'italic' as const }}>
                        {entry.title || <span style={{ fontSize: '13px' }}>{entry.description.slice(0, 50)}…</span>}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', maxWidth: '320px' }}>
                        {expandedIdx === i ? '' : entry.description.slice(0, 80) + (entry.description.length > 80 ? '…' : '')}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' as const }}>
                        <a href={imslpUrl(entry.composer, entry.title)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#7A7060', fontSize: '14px', textDecoration: 'none', opacity: 0.6 }}
                          title="Search on IMSLP">↗</a>
                      </td>
                    </tr>
                    {expandedIdx === i && (
                      <tr key={`exp-${i}`}>
                        <td colSpan={4} style={{ padding: '12px 16px 20px 56px', background: '#FAFAF8', borderBottom: '1px solid #EDE8DF' }}>
                          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#7A7060', marginBottom: '8px' }}>{entry.composer} · {entry.dates} · {entry.country} · Level {entry.level}</p>
                          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#2A2318', lineHeight: 1.8, maxWidth: '700px' }}>{entry.description}</p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

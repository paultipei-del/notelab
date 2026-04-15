'use client'

const F = 'var(--font-jost), sans-serif'

interface Props {
  done: number
  total: number
  accentColor?: string
}

export default function CategoryProgressBar({ done, total, accentColor = '#1A1A18' }: Props) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: '2px', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', flexShrink: 0 }}>
        {done}/{total}
      </span>
    </div>
  )
}

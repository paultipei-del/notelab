const F = 'var(--font-jost), sans-serif'

export default function LevelChip({ level }: { level: number }) {
  return (
    <span style={{
      fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400,
      letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: '20px',
      background: '#EDE8DF', color: '#7A7060',
    }}>
      L{level}
    </span>
  )
}

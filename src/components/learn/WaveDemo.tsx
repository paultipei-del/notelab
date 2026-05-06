'use client'

import { useMemo, useState } from 'react'
import styles from './learn.module.css'

export function WaveDemo() {
  const [freq, setFreq] = useState(150)

  const d = useMemo(() => {
    const cycles = freq / 50
    const pts: string[] = []
    for (let x = 0; x <= 600; x += 2) {
      const y = 80 + Math.sin((x / 600) * cycles * Math.PI * 2) * 32
      pts.push((x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1))
    }
    return pts.join(' ')
  }, [freq])

  return (
    <div className={styles.waveDemo}>
      <svg viewBox="0 0 600 160" preserveAspectRatio="none">
        <line x1="0" y1="80" x2="600" y2="80" stroke="#D9CFAE" strokeWidth={1} strokeDasharray="3 4" />
        <path d={d} fill="none" stroke="#2A2318" strokeWidth={1.5} />
        <line x1={160} y1={40} x2={280} y2={40} stroke="#B5402A" strokeWidth={1.5} />
        <text x={220} y={32} textAnchor="middle" fontFamily="var(--font-jost), Jost, sans-serif" fontSize={11} fill="#B5402A" letterSpacing={1}>wavelength</text>
        <line x1={540} y1={80} x2={540} y2={44} stroke="#B5402A" strokeWidth={1.5} />
        <text x={565} y={64} fontFamily="var(--font-jost), Jost, sans-serif" fontSize={11} fill="#B5402A" letterSpacing={1}>amplitude</text>
      </svg>
      <div className={styles.waveControls}>
        <label>Frequency</label>
        <input
          type="range"
          min={80}
          max={320}
          step={10}
          value={freq}
          onChange={e => setFreq(parseInt(e.target.value))}
        />
        <span className={styles.waveVal}>{freq} Hz</span>
      </div>
    </div>
  )
}

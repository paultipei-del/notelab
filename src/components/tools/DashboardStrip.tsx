'use client'

import { DASHBOARD_TOOLS } from '@/lib/toolsCatalog'
import { useDashboardGauges } from '@/hooks/useDashboardGauges'
import DashboardCard from './DashboardCard'

/**
 * Top "always at hand" strip — Metronome, Tap Tempo, Click Counter.
 * Renders gauge readouts driven by the last-known state each tool
 * wrote to localStorage. Tap Tempo has no persistent state and shows
 * a decorative em dash.
 */
export default function DashboardStrip() {
  const { metronomeBpm, clickCounter } = useDashboardGauges()

  const valueFor = (id: string) => {
    if (id === 'metronome') return { value: String(metronomeBpm), unit: 'BPM' }
    if (id === 'tap-tempo') return { value: '—', emphatic: true }
    if (id === 'click-counter') {
      const { count, target } = clickCounter
      return { value: target > 0 ? `${count} / ${target}` : String(count) }
    }
    return { value: '—' }
  }

  return (
    <section className="nl-tool-dashboard">
      <header className="nl-tool-section-head">
        <span className="nl-tool-section-head__eyebrow">Always at hand</span>
        <h2 className="nl-tool-section-head__title">Practice-room dashboard</h2>
        <p className="nl-tool-section-head__blurb">
          Tempo, taps, and reps — three readouts you keep within reach.
        </p>
      </header>
      <div className="nl-tool-dashboard__grid">
        {DASHBOARD_TOOLS.map(tool => {
          const v = valueFor(tool.id)
          return (
            <DashboardCard
              key={tool.id}
              tool={tool}
              gaugeValue={v.value}
              gaugeUnit={v.unit}
              gaugeCaption={tool.gaugeLabel}
              emphaticValue={v.emphatic}
            />
          )
        })}
      </div>
    </section>
  )
}

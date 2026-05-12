'use client'

import Link from 'next/link'
import type { Tool } from '@/lib/toolsCatalog'

interface DashboardCardProps {
  tool: Tool
  /** Pre-formatted value (e.g. "120", "0 / 10", "—"). */
  gaugeValue: string
  /** Unit suffix shown next to the value (e.g. "BPM"). Optional. */
  gaugeUnit?: string
  /** Caption beneath the gauge box (e.g. "last tempo"). */
  gaugeCaption?: string
  /** Render the value in oxblood italic instead of mono — used for the
   *  Tap Tempo decorative em dash. */
  emphaticValue?: boolean
}

/**
 * Instrument-panel card for the always-at-hand dashboard strip. Two-
 * column internal layout: meta on the left (label / name / note),
 * gauge on the right (value in JetBrains Mono inside a soft inset
 * box). Whole card is clickable.
 */
export default function DashboardCard({
  tool,
  gaugeValue,
  gaugeUnit,
  gaugeCaption,
  emphaticValue,
}: DashboardCardProps) {
  return (
    <Link href={tool.href} className="nl-tool-dashcard">
      <div className="nl-tool-dashcard__meta">
        <span className="nl-tool-dashcard__label">{tool.gaugeNote ?? 'Tool'}</span>
        <span className="nl-tool-dashcard__name">{tool.name}</span>
        <span className="nl-tool-dashcard__note">{tool.pitch}</span>
      </div>
      <div className="nl-tool-dashcard__gauge">
        <span
          className={
            emphaticValue
              ? 'nl-tool-dashcard__value nl-tool-dashcard__value--emphatic'
              : 'nl-tool-dashcard__value'
          }
        >
          {gaugeValue}
          {gaugeUnit && (
            <span className="nl-tool-dashcard__unit">{gaugeUnit}</span>
          )}
        </span>
        {gaugeCaption && (
          <span className="nl-tool-dashcard__caption">{gaugeCaption}</span>
        )}
      </div>
    </Link>
  )
}

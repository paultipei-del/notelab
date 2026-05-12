'use client'

import Link from 'next/link'
import type { Tool } from '@/lib/toolsCatalog'

interface ToolCardProps {
  tool: Tool
}

function statusLabels(status: Tool['status']): string[] {
  if (status === 'free') return ['Free']
  if (status === 'pro') return ['Pro']
  return ['Free', 'Pro']
}

/**
 * Standard tool card with a 4px left-edge stripe in the section's
 * category colour. The stripe colour is inherited from the parent
 * section (see globals.css — `.nl-tool-section.is-{cat} .nl-tool-card`).
 */
export default function ToolCard({ tool }: ToolCardProps) {
  const labels = statusLabels(tool.status)
  return (
    <Link href={tool.href} className="nl-tool-card">
      <div className="nl-tool-card__tags">
        {labels.map(l => (
          <span key={l} className={`nl-tool-card__pill is-${l.toLowerCase()}`}>
            {l}
          </span>
        ))}
      </div>
      <h3 className="nl-tool-card__name">{tool.name}</h3>
      <p className="nl-tool-card__pitch">{tool.pitch}</p>
      <span className="nl-tool-card__cta">
        {tool.ctaVerb}
        <span className="nl-tool-card__cta-arrow">→</span>
      </span>
    </Link>
  )
}

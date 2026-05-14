'use client'

import Link from 'next/link'
import type { Tool } from '@/lib/toolsCatalog'

interface ToolCardProps {
  tool: Tool
}

function statusLabels(status: Tool['status']): string[] {
  if (status === 'none') return []
  if (status === 'free') return ['Free']
  if (status === 'pro') return ['Pro']
  return ['Free', 'Pro']
}

/**
 * Standard tool card with a 4px left-edge stripe in the section's
 * category colour. The stripe colour is inherited from the parent
 * section (see globals.css — `.nl-tool-section.is-{cat} .nl-tool-card`).
 *
 * Cards with status='none' suppress the badge row entirely — used
 * for tools that have moved past the Free/Pro tiering and should
 * render without status pills (e.g., the consolidated Sight Reading
 * card after the Phase 1-2 rebuild).
 */
export default function ToolCard({ tool }: ToolCardProps) {
  const labels = statusLabels(tool.status)
  return (
    <Link href={tool.href} className="nl-tool-card">
      {labels.length > 0 && (
        <div className="nl-tool-card__tags">
          {labels.map(l => (
            <span key={l} className={`nl-tool-card__pill is-${l.toLowerCase()}`}>
              {l}
            </span>
          ))}
        </div>
      )}
      <h3 className="nl-tool-card__name">{tool.name}</h3>
      <p className="nl-tool-card__pitch">{tool.pitch}</p>
      <span className="nl-tool-card__cta">
        {tool.ctaVerb}
        <span className="nl-tool-card__cta-arrow">→</span>
      </span>
    </Link>
  )
}

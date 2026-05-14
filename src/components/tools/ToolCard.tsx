'use client'

import Link from 'next/link'
import type { Tool } from '@/lib/toolsCatalog'

interface ToolCardProps {
  tool: Tool
}

/**
 * Standard tool card with a 4px left-edge stripe in the section's
 * category colour. The stripe colour is inherited from the parent
 * section (see globals.css — `.nl-tool-section.is-{cat} .nl-tool-card`).
 *
 * Free/Pro status badges were removed site-wide 2026-Q1; the
 * Tool['status'] field is retained on the type for future analytics
 * use but no longer renders on the card.
 */
export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link href={tool.href} className="nl-tool-card">
      <h3 className="nl-tool-card__name">{tool.name}</h3>
      <p className="nl-tool-card__pitch">{tool.pitch}</p>
      <span className="nl-tool-card__cta">
        {tool.ctaVerb}
        <span className="nl-tool-card__cta-arrow">→</span>
      </span>
    </Link>
  )
}

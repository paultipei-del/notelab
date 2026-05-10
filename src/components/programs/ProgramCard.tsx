'use client'

import Link from 'next/link'
import type { ProgramEntry, ProgramCategory } from '@/lib/programsCatalog'

interface ProgramCardProps {
  program: ProgramEntry
  /** "✓ Owned" / "Free" / "$29" / "New" — owner-aware status rendered
   *  as the right-aligned pill in the tags row. */
  statusLabel: string
  /** Visual treatment for the status pill. */
  statusVariant: 'owned' | 'free' | 'price' | 'new'
}

const categoryClass: Record<ProgramCategory, string> = {
  foundation: 'is-foundation',
  reading: 'is-reading',
  theory: 'is-theory',
  aural: 'is-aural',
}

/**
 * Standard grid card for a single program. Renders: tags row (type
 * tag + status pill), title, italic pitch, "Includes:" mini-meta box,
 * and a footer with price/access info on the left + "Open →" CTA on
 * the right. Category stripe color is driven by the program's
 * `category` field (see CATEGORY_META in programsCatalog.ts).
 */
export default function ProgramCard({ program, statusLabel, statusVariant }: ProgramCardProps) {
  return (
    <Link href={program.href} className="nl-program-card-link">
      <article className={`nl-program-card ${categoryClass[program.category]}`}>
        <div className="nl-program-card__tags">
          <span className="nl-program-card__type-tag">{program.typeTag}</span>
          <span className={`nl-program-card__status-pill is-${statusVariant}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="nl-program-card__title">{program.title}</h3>
        <p className="nl-program-card__pitch">{program.pitch}</p>
        <div className="nl-program-card__includes">
          <span className="nl-program-card__includes-label">Includes:</span>{' '}
          {program.includes}
        </div>
        <div className="nl-program-card__footer">
          <span className="nl-program-card__price-info">{statusLabel}</span>
          <span className="nl-program-card__cta">Open →</span>
        </div>
      </article>
    </Link>
  )
}

'use client'

import Link from 'next/link'
import type { ProgramEntry } from '@/lib/programsCatalog'
import { renderWithRMark } from '@/lib/rMark'

interface FeaturedProgramCardProps {
  program: ProgramEntry
  /** Owner-aware right-aligned status pill — "✓ Owned" / "Free" / "$29" / "New". */
  statusLabel: string
  statusVariant: 'owned' | 'free' | 'price' | 'new'
}

/**
 * Wide flagship card for the featured (CM) program. Two-column on
 * desktop, stacked on mobile. Left/top: tags row, title, pitch,
 * ✦-bullet features, author signature, price row, primary CTA, sample
 * CTA. Right/bottom: preview pane with mini-shelf + "+N more" link +
 * 3-stat row.
 *
 * Mobile-specific: status pill flexes to top-right of the tags row
 * (justify-content: space-between) instead of inline. At <360px the
 * pill may wrap below the type tags — that's acceptable per spec.
 */
export default function FeaturedProgramCard({
  program,
  statusLabel,
  statusVariant,
}: FeaturedProgramCardProps) {
  return (
    <article className="nl-program-hero">
      <div className="nl-program-hero__content">
        <div className="nl-program-hero__tags">
          <div className="nl-program-hero__tag-group">
            <span className="nl-program-hero__tag is-featured">Featured</span>
            <span className="nl-program-hero__tag is-flagship">Flagship</span>
            <span className="nl-program-hero__tag is-type">{program.typeTag}</span>
          </div>
          <span className={`nl-program-hero__status-pill is-${statusVariant}`}>
            {statusLabel}
          </span>
        </div>

        <h2 className="nl-program-hero__title">{renderWithRMark(program.title)}</h2>
        <p className="nl-program-hero__pitch">{renderWithRMark(program.pitch)}</p>

        {program.features && (
          <ul className="nl-program-hero__bullets">
            {program.features.map(feature => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        {program.author && (
          <p
            className="nl-program-hero__author"
            // <b> in copy is intentional (bold author name); using
            // dangerouslySetInnerHTML is fine because the source is
            // hard-coded in programsCatalog.ts, not user input.
            dangerouslySetInnerHTML={{ __html: program.author }}
          />
        )}

        <div className="nl-program-hero__cta-block">
          <div className="nl-program-hero__price-row">
            <span className="nl-program-hero__price-from">From</span>
            <span className="nl-program-hero__price-amt">{program.priceFrom}</span>
            <span className="nl-program-hero__price-unit"> / level</span>
            {program.priceFull && (
              <span className="nl-program-hero__price-full">
                Full program <b>{program.priceFull}</b>
              </span>
            )}
          </div>
          <div className="nl-program-hero__cta-row">
            <Link href={program.href} className="nl-program-hero__cta-primary">
              Open program →
            </Link>
            {program.sampleHref && program.sampleLabel && (
              <Link href={program.sampleHref} className="nl-program-hero__cta-secondary">
                {program.sampleLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="nl-program-hero__preview">
        {program.previewLabel && (
          <p className="nl-program-hero__preview-label">{program.previewLabel}</p>
        )}
        {program.preview && (
          <ol className="nl-program-hero__minishelf">
            {program.preview.map((item, i) => (
              <li key={item.title} className="nl-program-hero__mini-row">
                <span className="nl-program-hero__mini-num">{i + 1}</span>
                <span className="nl-program-hero__mini-title">{item.title}</span>
                <span className="nl-program-hero__mini-count">{item.count}</span>
              </li>
            ))}
          </ol>
        )}
        {program.previewMoreHref && program.previewMoreLabel && (
          <Link href={program.previewMoreHref} className="nl-program-hero__preview-more">
            {program.previewMoreLabel}
          </Link>
        )}
        {program.stats && (
          <div className="nl-program-hero__stats">
            {program.stats.map(stat => (
              <div key={stat.label} className="nl-program-hero__stat">
                <span className="nl-program-hero__stat-value">{stat.value}</span>
                <span className="nl-program-hero__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

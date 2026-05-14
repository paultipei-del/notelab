'use client'

import { REFERENCE_TOOLS } from '@/lib/toolsCatalog'
import RefBook from './RefBook'

/**
 * Wooden-shelf treatment for the reference section. Two RefBooks
 * side-by-side on desktop, stacked on mobile. The shelf "plank"
 * effect is a pseudo-element on the container (see globals.css).
 */
export default function ReferenceShelf() {
  if (REFERENCE_TOOLS.length === 0) return null

  return (
    <section className="nl-tool-section is-reference">
      <header className="nl-tool-section-head">
        <span className="nl-tool-section-head__eyebrow">Reference</span>
        <h2 className="nl-tool-section-head__title">Look it up</h2>
        <p className="nl-tool-section-head__blurb">
          Terms, repertoire. The two volumes you reach for between sessions.
        </p>
      </header>
      <div className="nl-tool-shelf">
        {REFERENCE_TOOLS.map((tool, i) => (
          <RefBook
            key={tool.id}
            tool={tool}
            spine={i % 2 === 0 ? 'light' : 'dark'}
          />
        ))}
      </div>
    </section>
  )
}

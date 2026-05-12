'use client'

import { TOOLS, type CategoryMeta } from '@/lib/toolsCatalog'
import ToolCard from './ToolCard'

interface CategorySectionProps {
  category: CategoryMeta
}

/**
 * One coloured-stripe section of the /tools page (Drills / Theory /
 * Practice). The section root carries `is-${id}` so global CSS can
 * paint the eyebrow + card stripe in the right category colour.
 *
 * Theory uses a 2-column grid on desktop; Drills and Practice are
 * 3-column. Mobile collapses to single column everywhere.
 */
export default function CategorySection({ category }: CategorySectionProps) {
  const tools = TOOLS.filter(t => t.category === category.id)
  if (tools.length === 0) return null

  return (
    <section className={`nl-tool-section is-${category.id}`}>
      <header className="nl-tool-section-head">
        <span className="nl-tool-section-head__eyebrow">{category.label}</span>
        <h2 className="nl-tool-section-head__title">{category.label}</h2>
        <p className="nl-tool-section-head__blurb">{category.blurb}</p>
      </header>
      <div className={`nl-tool-section__grid is-cols-${tools.length}`}>
        {tools.map(t => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  )
}

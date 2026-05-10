import type { ProgramPlaceholder } from '@/lib/programsCatalog'

interface PlaceholderCardProps {
  placeholder: ProgramPlaceholder
}

/**
 * Dashed-border card for "Coming Soon" and "Suggest a Program" slots
 * in the grid. Same width as a standard ProgramCard, but no left-edge
 * stripe and no clickable footer — it's a content slot, not a
 * destination. Variant prop is only used for the eyebrow accent
 * color (suggest gets the brick-red prompt color; coming-soon stays
 * muted brown).
 */
export default function PlaceholderCard({ placeholder }: PlaceholderCardProps) {
  return (
    <div className={`nl-program-placeholder is-${placeholder.variant}`}>
      <p className="nl-program-placeholder__eyebrow">{placeholder.eyebrow}</p>
      <h3 className="nl-program-placeholder__title">{placeholder.title}</h3>
      <p className="nl-program-placeholder__body">{placeholder.body}</p>
    </div>
  )
}

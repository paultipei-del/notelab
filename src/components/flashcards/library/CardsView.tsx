'use client'

import Link from 'next/link'
import s from './library.module.css'
import Status from './Status'
import SectionHeader from './SectionHeader'
import { useBookBinding } from './bookBindings'
import { deriveStatusState, Section, DeckWithSummary } from './sectionGrouping'

export interface CardsViewProps {
  sections: Section[]
}

export default function CardsView({ sections }: CardsViewProps) {
  const nonEmpty = sections.filter(sec => sec.items.length > 0)
  if (nonEmpty.length === 0) {
    return <p className={s.empty}>No volumes match this view.</p>
  }
  return (
    <>
      {/* Desktop — 4-column grid */}
      <div className={s.desktopOnly}>
        <div className={s.cardsViewDesktop}>
          {nonEmpty.map(sec => (
            <section key={sec.id} className={s.cardsSection}>
              <SectionHeader
                label={sec.label}
                count={sec.items.length}
                subtitle={sec.subtitle}
                seeAllHref={sec.seeAllHref}
              />
              <div className={s.cardsGridDesktop}>
                {sec.items.map(item => (
                  <CardItem key={item.deck.id} item={item} density="default" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Mobile — single-column stack */}
      <div className={s.mobileOnly}>
        <div className={s.cardsViewMobile}>
          {nonEmpty.map(sec => (
            <section key={sec.id} className={s.cardsSectionMobile}>
              <div className={s.cardsSectionHeaderPad}>
                <SectionHeader
                  label={sec.label}
                  count={sec.items.length}
                  subtitle={sec.subtitle}
                  seeAllHref={sec.seeAllHref}
                />
              </div>
              <div className={s.cardsStackMobile}>
                {sec.items.map(item => (
                  <CardItem key={item.deck.id} item={item} density="compact" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

function CardItem({
  item,
  density,
}: {
  item: DeckWithSummary
  density: 'default' | 'compact'
}) {
  const binding = useBookBinding(item.deck.title)
  const state = deriveStatusState(item.summary)
  const percentLearned = Math.round(item.summary.pctMastered * 100)
  const category = (item.deck.category ?? '').toUpperCase()

  return (
    <Link
      href={`/study/${item.deck.id}`}
      className={`${s.deckCard} ${density === 'compact' ? s.deckCardCompact : ''}`}
      style={{ borderLeft: `3px solid ${binding.stripe}` }}
      data-tier={item.book.tier}
      data-topic={item.book.topic ?? undefined}
    >
      <div className={s.deckCardTitle}>{item.deck.title}</div>
      {category && <div className={s.deckCardEyebrow}>{category}</div>}
      <Status
        state={state}
        density={density}
        totalCards={item.deck.cards.length}
        due={item.summary.dueCount}
        percentLearned={percentLearned}
        lastSeen={item.summary.lastSeenLabel}
        instanceKey={item.deck.id}
      />
    </Link>
  )
}

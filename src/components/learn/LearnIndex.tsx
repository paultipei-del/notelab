'use client'

import { useMemo, useState } from 'react'
import type { Part } from '@/app/learn/_data/parts'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import SiteFooter from '@/components/SiteFooter'
import { LearnHeader } from './LearnHeader'
import { ResumeStrip, type ResumeData } from './ResumeStrip'
import { TocRail } from './TocRail'
import { MobileJumpNav } from './MobileJumpNav'
import { PartFrontispiece } from './PartFrontispiece'
import { LessonRow } from './LessonRow'
import styles from './learn.module.css'

type Props = {
  parts: Part[]
  resume: ResumeData | null
  read: Set<string>
  currentSlug: string | null
}

export function LearnIndex({ parts, resume, read, currentSlug }: Props) {
  const totalLessons = parts.reduce((a, p) => a + p.lessons.length, 0)
  const totalRead = [...read].length
  const ledgerPct = totalLessons > 0 ? (totalRead / totalLessons) * 100 : 34

  const [query, setQuery] = useState('')

  // Filter parts/lessons by the search query. If the part's title matches,
  // all its lessons stay visible. Otherwise only lessons whose name or
  // description contains the query are kept; parts with no matches drop out.
  const filteredParts = useMemo<Part[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return parts
    const out: Part[] = []
    for (const part of parts) {
      const partMatches = part.title.toLowerCase().includes(q)
      if (partMatches) {
        out.push(part)
        continue
      }
      const lessons = part.lessons.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.desc.toLowerCase().includes(q),
      )
      if (lessons.length > 0) {
        out.push({ ...part, lessons })
      }
    }
    return out
  }, [parts, query])

  const isFiltering = query.trim().length > 0

  // Scroll-spy across visible parts. IDs match the section ids rendered
  // below (`part-${i}`); the hook recomputes when filtering changes the
  // visible set, since indices shift.
  const partIds = useMemo(
    () => filteredParts.map((_, i) => `part-${i}`),
    [filteredParts],
  )
  const { activeIndex, setActiveIndex } = useScrollSpy(partIds)

  return (
    // is-learn-page is a stable, non-module class used by globals.css
    // (body:has(.is-learn-page) .site-header) to paint the SiteHeader
    // opaque on this route, so content doesn't bleed under it as the
    // user scrolls. CSS module class names are hashed and can't be
    // targeted from outside the module.
    <div className={`${styles.page} is-learn-page`}>
      {/* Fixed-position overlay covering viewport y=0..site-header.
          Renders the SAME gradient html uses with the SAME
          background-attachment: fixed, so they paint identical
          pixels at every scroll position — no visible boundary.
          A real DOM element rather than a body::before so iOS
          Safari renders it reliably. */}
      <div className={styles.headerFade} aria-hidden="true" />
      <main className={styles.container}>
        <ResumeStrip resume={resume} />
        <LearnHeader
          lessonCount={totalLessons}
          query={query}
          onQueryChange={setQuery}
        />

        {filteredParts.length > 0 && (
          <MobileJumpNav
            parts={filteredParts}
            activeIndex={activeIndex}
            onJump={setActiveIndex}
          />
        )}

        <section className={styles.body}>
          <TocRail
            parts={filteredParts}
            activeIndex={activeIndex}
            onJump={setActiveIndex}
          />

          <div className={styles.ledger}>
            {!isFiltering && (
              <span className={styles.ledgerProgress} style={{ height: `${ledgerPct}%` }} />
            )}

            {filteredParts.length === 0 ? (
              <p className={styles.noResults}>
                No lessons match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              filteredParts.map((part, i) => {
                const readCount = part.lessons.filter(l =>
                  read.has(`${part.slug}/${l.slug}`) || read.has(l.slug),
                ).length
                return (
                  <section key={part.slug} id={`part-${i}`} className={styles.part}>
                    <PartFrontispiece part={part} readCount={readCount} />
                    <ol className={styles.lessons}>
                      {part.lessons.map((lesson, idx) => {
                        const scoped = `${part.slug}/${lesson.slug}`
                        return (
                          <LessonRow
                            key={lesson.slug}
                            lesson={lesson}
                            partSlug={part.slug}
                            index={idx}
                            isRead={read.has(scoped) || read.has(lesson.slug)}
                            isCurrent={currentSlug === scoped || currentSlug === lesson.slug}
                          />
                        )
                      })}
                    </ol>
                  </section>
                )
              })
            )}
          </div>
        </section>
      </main>
      {/* Footer rendered INSIDE .page so it scrolls with the content.
          The layout's SiteFooter suppresses itself on /learn paths;
          forceShow bypasses that check for this rendered copy. */}
      <SiteFooter forceShow />
    </div>
  )
}

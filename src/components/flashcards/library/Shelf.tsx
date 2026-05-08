'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Book, { BookProps } from './Book'
import { MuseumPlacard } from './MuseumPlacard'
import { SectionCard } from './SectionCard'

export interface ShelfProps {
  title: string
  count: string
  seeAllHref?: string
  books: BookProps[]
}

const ROW_PADDING_LEFT = 24
const SCROLL_BY_PX = 400
const ENDPOINT_THRESHOLD = 4
// Page background (set on <html> in globals.css). The edge fades use this
// so they read as "the page eating the books" rather than as a colored
// gradient swatch.
const PAGE_BG = '#EFE8D2'

export default function Shelf({ title, count, seeAllHref = '#', books }: ShelfProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  // containerRef is the right-hand parent of the section. The placard's
  // coordinate space is here, NOT inside the scroll container, so it
  // doesn't clip when the books scroll horizontally.
  const containerRef = useRef<HTMLDivElement | null>(null)
  // scrollRef is the horizontally-scrolling row of books + wood plank.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bookRefs = useRef<Array<HTMLDivElement | null>>([])
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: true })

  // Re-measure on mount + resize so a section short enough to fit without
  // scrolling correctly hides both buttons/fades.
  useEffect(() => {
    const update = () => {
      const el = scrollRef.current
      if (!el) return
      setScrollState({
        canLeft: el.scrollLeft > ENDPOINT_THRESHOLD,
        canRight:
          el.scrollLeft + el.clientWidth < el.scrollWidth - ENDPOINT_THRESHOLD,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [books.length])

  if (books.length === 0) return null

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setScrollState({
      canLeft: el.scrollLeft > ENDPOINT_THRESHOLD,
      canRight:
        el.scrollLeft + el.clientWidth < el.scrollWidth - ENDPOINT_THRESHOLD,
    })
  }

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * SCROLL_BY_PX, behavior: 'smooth' })
  }

  const containerRect = containerRef.current?.getBoundingClientRect() ?? null
  const anchorRect =
    hoveredIndex != null
      ? bookRefs.current[hoveredIndex]?.getBoundingClientRect() ?? null
      : null

  const hoveredBook =
    hoveredIndex != null
      ? {
          title: books[hoveredIndex].title,
          badge: books[hoveredIndex].dueCount > 0 ? books[hoveredIndex].dueCount : null,
          section: title,
        }
      : null

  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 28,
        marginBottom: 64,
        // Skip rendering off-screen shelves during scroll. ~360px is the
        // typical shelf height (book ≤280 + plank + spacing), so the browser
        // reserves space without painting until the section enters the
        // viewport — major scroll-perf win on a 168-book page.
        contentVisibility: 'auto',
        containIntrinsicSize: '0 360px',
      }}
    >
      <SectionCard label={title} sublabel={count} seeAllHref={seeAllHref} />

      {/* Right-hand container: owns the placard's coordinate space and the
          scroll-button absolute positioning. minWidth: 0 is critical — it
          lets this flex child shrink below the natural width of all books,
          which is what allows the inner scroll container to clip & scroll. */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
        }}
      >
        {/* Hide the WebKit scrollbar on the scroll-row while keeping native
            scrolling. Firefox uses scrollbar-width: none inline. */}
        <style>{`.nl-shelf-scroll::-webkit-scrollbar { display: none; }`}</style>

        <div
          ref={scrollRef}
          className="nl-shelf-scroll"
          onScroll={onScroll}
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            paddingTop: 110,
            paddingBottom: 12,
            position: 'relative',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Content wrapper: width sized to its children (the books row),
              min-width: 100% so short shelves still fill the visible area.
              Both the books row and the wood plank share this width, which
              is what makes the plank track the books when you scroll right.
              `display: inline-block` lets the wrapper expand past the
              container's visible width — that's the whole shelf scrolling
              as one piece. */}
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                paddingLeft: ROW_PADDING_LEFT,
                perspective: '1600px',
                perspectiveOrigin: '50% 80%',
                position: 'relative',
                zIndex: 2,
                width: 'max-content',
              }}
            >
              {books.map((b, i) => (
                <Book
                  key={b.id}
                  ref={(el: HTMLDivElement | null) => { bookRefs.current[i] = el }}
                  {...b}
                  isHovered={hoveredIndex === i}
                  onHoverStart={() => setHoveredIndex(i)}
                  onHoverEnd={() => setHoveredIndex(null)}
                />
              ))}
            </div>

            {/* Wood plank — fills the wrapper, which is sized to the books,
                so the plank scrolls in lockstep with the books and never
                cuts off mid-shelf. */}
            <div
              style={{
                position: 'relative',
                height: 18,
                marginTop: -2,
                zIndex: 1,
                width: '100%',
              }}
            >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(180deg, #8a6840 0%, #6e5230 50%, #5a4226 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,220,160,0.3)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 0,
                right: 0,
                height: 14,
                background: 'linear-gradient(180deg, #6e5230 0%, #5a4226 40%, #4a361e 100%)',
                backgroundImage:
                  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, transparent 2px, transparent 50px, rgba(0,0,0,0.05) 51px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 18,
                left: 8,
                right: 8,
                height: 14,
                background:
                  'radial-gradient(ellipse at center top, rgba(40,25,10,0.35) 0%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            </div>
          </div>
        </div>

        {/* Edge fades — positioned over the scroll container, page-bg
            colored so they read as the page eating the books. */}
        {scrollState.canLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 110,
              bottom: 30,
              width: 40,
              background: `linear-gradient(90deg, ${PAGE_BG} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}
        {scrollState.canRight && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 110,
              bottom: 30,
              width: 40,
              background: `linear-gradient(270deg, ${PAGE_BG} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {/* Scroll buttons — sit beside the books at roughly mid-shelf
            height, overhanging the right-hand container by a hair so they
            don't sit directly on top of the leftmost / rightmost book. */}
        {scrollState.canLeft && (
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="Scroll left"
            style={{
              position: 'absolute',
              left: -12,
              top: 220,
              zIndex: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(160, 56, 28, 0.3)',
              background: 'rgba(255,250,238,0.95)',
              boxShadow: '0 4px 12px rgba(40,20,8,0.2)',
              cursor: 'pointer',
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 18,
              color: '#a0381c',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ←
          </button>
        )}
        {scrollState.canRight && (
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            aria-label="Scroll right"
            style={{
              position: 'absolute',
              right: 4,
              top: 220,
              zIndex: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(160, 56, 28, 0.3)',
              background: 'rgba(255,250,238,0.95)',
              boxShadow: '0 4px 12px rgba(40,20,8,0.2)',
              cursor: 'pointer',
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 18,
              color: '#a0381c',
              padding: 0,
              lineHeight: 1,
            }}
          >
            →
          </button>
        )}

        <AnimatePresence>
          {hoveredBook && (
            <MuseumPlacard
              book={hoveredBook}
              anchorRect={anchorRect}
              containerRect={containerRect}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

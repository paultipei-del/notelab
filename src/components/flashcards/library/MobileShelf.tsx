'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Book, { BookProps } from './Book'
import WoodPlank from './WoodPlank'

const TAP_DISMISS_MS = 4000

export interface MobileShelfProps {
  title: string
  count: string
  seeAllHref?: string
  books: BookProps[]
}

/**
 * Mobile layout for a flashcards bookshelf section. Renders the section
 * header above a full-width horizontal-swipe row of books, with a passive
 * "now showing" strip below the wood plank that auto-tracks the centered
 * book. Tap a book to surface a museum-style placard anchored above it
 * (first tap = preview, second tap on the same book = navigate).
 *
 * Mobile differs from desktop in:
 *  - Section card sits ABOVE the books, not beside them (so the books get
 *    full viewport width).
 *  - State machine is selection-driven (tap), not hover-driven.
 *  - No 3D pickup physics on books — flat lift only.
 */
export default function MobileShelf({ title, count, seeAllHref = '#', books }: MobileShelfProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bookRefs = useRef<Array<HTMLDivElement | null>>([])
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-update currentIndex from scroll position. Cheap measurement —
  // offsetLeft/offsetWidth don't trigger layout; safe to call on every frame.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const center = el.scrollLeft + el.clientWidth / 2
      let bestIdx = 0
      let bestDist = Infinity
      bookRefs.current.forEach((node, i) => {
        if (!node) return
        const mid = node.offsetLeft + node.offsetWidth / 2
        const d = Math.abs(mid - center)
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      })
      setCurrentIndex(bestIdx)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [books.length])

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    }
  }, [])

  if (books.length === 0) return null

  const handleTap = (i: number) => {
    if (selectedIndex === i) {
      // Second tap on same book → navigate
      router.push(books[i].href)
      setSelectedIndex(null)
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
      return
    }
    setSelectedIndex(i)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => setSelectedIndex(null), TAP_DISMISS_MS)
  }

  const dismissOnOutside = (e: React.MouseEvent<HTMLElement>) => {
    if (!scrollRef.current) return
    if (!scrollRef.current.contains(e.target as Node)) {
      setSelectedIndex(null)
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    }
  }

  const containerRect = containerRef.current?.getBoundingClientRect() ?? null
  const anchorRect =
    selectedIndex != null
      ? bookRefs.current[selectedIndex]?.getBoundingClientRect() ?? null
      : null

  const selectedBook = selectedIndex != null ? books[selectedIndex] : null
  const currentBook = books[currentIndex] ?? books[0]

  return (
    <section onClick={dismissOnOutside} style={{ marginBottom: 36 }}>
      {/* Section header */}
      <div style={{ padding: '0 20px 12px' }}>
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, -apple-system, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Section
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
              fontSize: 26,
              fontWeight: 500,
              color: '#1a1208',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
              margin: 0,
              flex: 1,
              minWidth: 0,
            }}
          >
            {title}
          </h2>
          <a
            href={seeAllHref}
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: '#a0381c',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            See all →
          </a>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#5a4028',
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {count}
        </div>
        <div
          style={{
            height: 1,
            background:
              'linear-gradient(90deg, #d4af37 0%, rgba(212, 175, 55, 0.3) 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Books row + placard space */}
      <div
        ref={containerRef}
        style={{ position: 'relative', paddingTop: 100 }}
      >
        <style>{`.nl-mobile-shelf-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div
          ref={scrollRef}
          className="nl-mobile-shelf-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: 4,
          }}
        >
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                padding: '0 20px',
                width: 'max-content',
              }}
            >
              {books.map((b, i) => (
                <div
                  key={b.id}
                  ref={(el: HTMLDivElement | null) => { bookRefs.current[i] = el }}
                  style={{ padding: '0 2px', display: 'flex', alignItems: 'flex-end' }}
                >
                  <Book
                    {...b}
                    isHovered={selectedIndex === i}
                    onHoverStart={() => {}}
                    onHoverEnd={() => {}}
                    onClick={() => handleTap(i)}
                  />
                </div>
              ))}
            </div>

            {/* Wood plank — same as desktop, scrolls with the books */}
            <WoodPlank />
          </div>
        </div>

        {/* Tap-to-reveal placard. pointerEvents: none so the second tap
            passes through to the book underneath. */}
        <AnimatePresence>
          {selectedBook && anchorRect && containerRect && (
            <MobilePlacard
              key={selectedBook.id}
              title={selectedBook.title}
              section={title}
              due={selectedBook.dueCount > 0 ? selectedBook.dueCount : null}
              anchorRect={anchorRect}
              containerRect={containerRect}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Now-showing strip */}
      <div
        style={{
          margin: '14px 20px 0',
          paddingTop: 12,
          minHeight: 36,
          borderTop: '1px solid rgba(139, 105, 20, 0.2)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBook?.id ?? 'empty'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
                fontSize: 18,
                fontWeight: 500,
                color: '#1a1208',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              {currentBook?.title ?? 'Swipe to browse · tap to preview'}
            </div>
            {currentBook && currentBook.dueCount > 0 && (
              <div
                style={{
                  fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: '#c83a2a',
                  flexShrink: 0,
                }}
              >
                {currentBook.dueCount} due
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ── MobilePlacard — the ivory tap-to-reveal card ─────────────────────── */

interface MobilePlacardProps {
  title: string
  section: string
  due: number | null
  anchorRect: DOMRect
  containerRect: DOMRect
}

const PLACARD_WIDTH = 280
const PLACARD_GAP = 14
const PLACARD_HEIGHT_EST = 110

function MobilePlacard({ title, section, due, anchorRect, containerRect }: MobilePlacardProps) {
  const bookCenterX = anchorRect.left - containerRect.left + anchorRect.width / 2
  const bookTop = anchorRect.top - containerRect.top

  let left = bookCenterX - PLACARD_WIDTH / 2
  let top = bookTop - PLACARD_HEIGHT_EST - PLACARD_GAP

  if (left < 8) left = 8
  if (left + PLACARD_WIDTH > containerRect.width - 8) {
    left = containerRect.width - PLACARD_WIDTH - 8
  }
  if (top < 0) {
    top = bookTop + anchorRect.height + PLACARD_GAP
  }

  return (
    <motion.div
      layout
      layoutId="mobile-placard"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 38 },
        opacity: { duration: 0.14 },
        y: { duration: 0.14 },
      }}
      style={{
        position: 'absolute',
        left,
        top,
        width: PLACARD_WIDTH,
        pointerEvents: 'none',
        zIndex: 50,
        background: 'rgba(251, 246, 230, 0.98)',
        color: '#1a1208',
        padding: '12px 16px 12px',
        borderRadius: 3,
        border: '1px solid rgba(160, 56, 28, 0.25)',
        boxShadow:
          '0 12px 32px rgba(40, 20, 8, 0.18), 0 2px 8px rgba(40, 20, 8, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 5,
          border: '1px solid rgba(160, 56, 28, 0.15)',
          borderRadius: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        Volume · {section}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
          fontSize: 19,
          fontWeight: 400,
          lineHeight: 1.25,
          letterSpacing: '-0.005em',
          color: '#1a1208',
        }}
      >
        {title}
      </div>
      {due != null && due > 0 && (
        <div
          style={{
            fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: '#5a4028',
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#c83a2a',
              display: 'inline-block',
            }}
          />
          {due} {due === 1 ? 'card' : 'cards'} due
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid rgba(212, 175, 55, 0.25)',
          fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 11,
          color: '#7a6a48',
        }}
      >
        Tap again to open →
      </div>
    </motion.div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { SectionCard } from './SectionCard'
import type { BookProps } from './Book'

const SCROLL_BY_PX = 400
const ENDPOINT_THRESHOLD = 4
const PAGE_BG = '#EFE8D2'
const BLURB_CHAR_LIMIT = 80

export interface ExaminationHallProps {
  /** Application-tier "workbook" decks. Re-uses BookProps from the bookshelf
   *  so the existing data builder doesn't need to know about exam cards. */
  books: BookProps[]
}

const ROMAN: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII',
}
function toRoman(n: number): string {
  return ROMAN[n] ?? String(n)
}

function truncateBlurb(s: string): string {
  if (!s || s.length <= BLURB_CHAR_LIMIT) return s
  return s.slice(0, BLURB_CHAR_LIMIT - 1).trimEnd() + '…'
}

interface ExaminationCardProps {
  num: number
  title: string
  blurb: string
  cards: number
  due: number | null
  href: string
}

function ExaminationCard({ num, title, blurb, cards, due, href }: ExaminationCardProps) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const safeBlurb = truncateBlurb(blurb)

  return (
    <div
      style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(href)}
      role="link"
      aria-label={title}
    >
      <motion.div
        animate={{ y: hovered ? -6 : 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{
          width: 220,
          height: 290,
          background: 'linear-gradient(180deg, #f0e7d0 0%, #e8dec5 100%)',
          border: '1px solid rgba(139, 105, 20, 0.25)',
          borderRadius: 2,
          padding: '30px 26px 24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: hovered
            ? '0 14px 24px rgba(40,20,8,0.18), 0 4px 8px rgba(40,20,8,0.08)'
            : '0 3px 8px rgba(40,20,8,0.1)',
        }}
      >
        {/* Roman numeral — large gilt italic with bg-clip text gradient */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 42,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            background: 'linear-gradient(180deg, #d4af37 0%, #8b6914 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 4,
          }}
        >
          {toRoman(num)}.
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, -apple-system, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#a0381c',
            marginBottom: 16,
          }}
        >
          Examination
        </div>

        {/* Title — fixed 2-line slot for cross-card alignment */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontSize: 22,
            fontWeight: 500,
            color: '#1a1208',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            marginBottom: 12,
            minHeight: 50,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          {title}
        </div>

        {/* Gilt rule — narrow, asymmetric */}
        <div
          style={{
            width: 36,
            height: 1,
            background: 'linear-gradient(90deg, #d4af37 0%, transparent 100%)',
            marginBottom: 12,
          }}
        />

        {/* Blurb — flex: 1 pushes the bottom row down */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#5a4028',
            lineHeight: 1.45,
            flex: 1,
          }}
        >
          {safeBlurb}
        </div>

        {/* Bottom — questions count above hairline */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: '#8a7560',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(139, 105, 20, 0.2)',
          }}
        >
          {cards} questions
        </div>
      </motion.div>

      {/* Due-count pill — same shape as the bookshelf books */}
      {due != null && due > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: 26,
            height: 26,
            padding: '0 8px',
            borderRadius: 13,
            background: 'linear-gradient(180deg, #c83a2a 0%, #a02818 100%)',
            color: '#fff',
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            zIndex: 5,
          }}
        >
          {due} due
        </div>
      )}
    </div>
  )
}

function CustomCard() {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  return (
    <div
      style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push('/practice/custom')}
      role="link"
      aria-label="Compose your own examination"
    >
      <motion.div
        animate={{ y: hovered ? -6 : 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{
          width: 220,
          height: 290,
          background: hovered
            ? 'rgba(160, 56, 28, 0.04)'
            : 'rgba(255, 250, 240, 0.3)',
          border: '1.5px dashed rgba(160, 56, 28, 0.4)',
          borderRadius: 2,
          padding: '30px 26px 24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: hovered
            ? '0 14px 24px rgba(40,20,8,0.14), 0 4px 8px rgba(40,20,8,0.06)'
            : '0 3px 8px rgba(40,20,8,0.07)',
          transition: 'background 0.2s ease',
        }}
      >
        {/* `+` symbol — same position/size/font as the Roman numeral so the
            grid stays aligned with the examination cards */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 42,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            color: '#a0381c',
            opacity: 0.7,
            marginBottom: 4,
          }}
        >
          +
        </div>

        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, -apple-system, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#a0381c',
            marginBottom: 16,
          }}
        >
          Custom
        </div>

        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontSize: 22,
            fontWeight: 500,
            color: '#1a1208',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            marginBottom: 12,
            minHeight: 50,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          Compose your own
        </div>

        <div
          style={{
            width: 36,
            height: 1,
            background: 'linear-gradient(90deg, rgba(160, 56, 28, 0.5) 0%, transparent 100%)',
            marginBottom: 12,
          }}
        />

        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#5a4028',
            lineHeight: 1.45,
            flex: 1,
          }}
        >
          Pick the topics, length, and mode. Built to your specifications.
        </div>

        <div
          style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: '#a0381c',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(160, 56, 28, 0.2)',
          }}
        >
          Configure →
        </div>
      </motion.div>
    </div>
  )
}

const DEFAULT_BLURBS: Record<string, string> = {
  'identify-and-explain': 'Recognize a term, symbol, or concept and articulate what it means.',
  'build-and-transform': 'Construct scales, intervals, and chords; transform between forms.',
  'score-reading-quickfire': 'Rapid identification on real notation — pitch, rhythm, key.',
  'ear-to-paper': 'Hear a passage; transcribe what you heard onto the staff.',
}
function blurbFor(book: BookProps): string {
  if (DEFAULT_BLURBS[book.id]) return DEFAULT_BLURBS[book.id]
  return book.categoryLabel
}

export default function ExaminationHall({ books }: ExaminationHallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: true })

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

  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 28,
        marginBottom: 64,
      }}
    >
      <SectionCard
        eyebrow="Practice"
        label={<>The<br />Examination<br />Hall</>}
        sublabel="Timed challenges drawing on multiple concepts at once."
        seeAllHref="/practice/about"
        linkText="About the exams →"
      />

      <div
        ref={containerRef}
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
        }}
      >
        <style>{`.nl-exam-scroll::-webkit-scrollbar { display: none; }`}</style>

        <div
          ref={scrollRef}
          className="nl-exam-scroll"
          onScroll={onScroll}
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            paddingTop: 20,
            paddingBottom: 12,
            position: 'relative',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 18,
                paddingLeft: 8,
                paddingRight: 8,
                width: 'max-content',
              }}
            >
              {books.map((b, i) => (
                <ExaminationCard
                  key={b.id}
                  num={i + 1}
                  title={b.title}
                  blurb={blurbFor(b)}
                  cards={b.cardCount}
                  due={b.dueCount > 0 ? b.dueCount : null}
                  href={b.href}
                />
              ))}
              <CustomCard />
            </div>
          </div>
        </div>

        {scrollState.canLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 20,
              bottom: 0,
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
              top: 20,
              bottom: 0,
              width: 40,
              background: `linear-gradient(270deg, ${PAGE_BG} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {scrollState.canLeft && (
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="Scroll left"
            style={{
              position: 'absolute',
              left: -12,
              top: 130,
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
              top: 130,
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
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { BookProps } from './Book'

const BLURB_CHAR_LIMIT = 80

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

export interface MobileExaminationHallProps {
  books: BookProps[]
}

interface MobileExaminationCardProps {
  num: number
  title: string
  blurb: string
  cards: number
  due: number | null
  href: string
}

function MobileExaminationCard({ num, title, blurb, cards, due, href }: MobileExaminationCardProps) {
  const router = useRouter()
  const [pressed, setPressed] = useState(false)
  const safeBlurb = truncateBlurb(blurb)

  return (
    <div
      style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer' }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={() => router.push(href)}
      role="link"
      aria-label={title}
    >
      <motion.div
        animate={{ y: pressed ? -4 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          width: 220,
          height: 290,
          background: 'linear-gradient(180deg, #f0e7d0 0%, #e8dec5 100%)',
          border: '1px solid rgba(139, 105, 20, 0.25)',
          borderRadius: 2,
          padding: '30px 26px 24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 3px 8px rgba(40,20,8,0.1)',
        }}
      >
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
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
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
        <div
          style={{
            width: 36,
            height: 1,
            background: 'linear-gradient(90deg, #d4af37 0%, transparent 100%)',
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
          {safeBlurb}
        </div>
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

function MobileCustomCard() {
  const router = useRouter()
  return (
    <div
      style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer' }}
      onClick={() => router.push('/practice/custom')}
      role="link"
      aria-label="Compose your own examination"
    >
      <div
        style={{
          width: 220,
          height: 290,
          background: 'rgba(255, 250, 240, 0.3)',
          border: '1.5px dashed rgba(160, 56, 28, 0.4)',
          borderRadius: 2,
          padding: '30px 26px 24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 3px 8px rgba(40,20,8,0.07)',
        }}
      >
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
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
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
      </div>
    </div>
  )
}

export default function MobileExaminationHall({ books }: MobileExaminationHallProps) {
  return (
    <section
      style={{
        marginBottom: 36,
        contentVisibility: 'auto',
        containIntrinsicSize: '0 460px',
      }}
    >
      <div style={{ padding: '0 20px 12px' }}>
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Practice
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
            The Examination Hall
          </h2>
          <a
            href="/practice/about"
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: '#a0381c',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            About →
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
          Timed challenges drawing on multiple concepts at once.
        </div>
        <div
          style={{
            height: 1,
            background:
              'linear-gradient(90deg, #d4af37 0%, rgba(212, 175, 55, 0.3) 40%, transparent 100%)',
          }}
        />
      </div>

      <style>{`.nl-mobile-exam-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        className="nl-mobile-exam-scroll"
        style={{
          overflowX: 'auto',
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '0 20px',
            width: 'max-content',
          }}
        >
          {books.map((b, i) => (
            <MobileExaminationCard
              key={b.id}
              num={i + 1}
              title={b.title}
              blurb={blurbFor(b)}
              cards={b.cardCount}
              due={b.dueCount > 0 ? b.dueCount : null}
              href={b.href}
            />
          ))}
          <MobileCustomCard />
        </div>
      </div>
    </section>
  )
}

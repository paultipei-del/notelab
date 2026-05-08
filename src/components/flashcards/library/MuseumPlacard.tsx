'use client'

import { motion } from 'framer-motion'

export interface PlacardBook {
  title: string
  badge?: number | null
  section?: string
}

interface MuseumPlacardProps {
  book: PlacardBook
  anchorRect: DOMRect | null | undefined
  containerRect: DOMRect | null | undefined
}

const PLACARD_WIDTH = 280
const PLACARD_GAP = 14
const PLACARD_HEIGHT_EST = 100

/**
 * Anchored card that floats above (or below) the currently-hovered book
 * and shows its section, title, and due-count. Uses framer-motion's
 * `layoutId` so the card glides between book positions instead of
 * cross-fading. Edge-detected so it never clips the right edge of the
 * shelf or the top of the viewport.
 */
export function MuseumPlacard({ book, anchorRect, containerRect }: MuseumPlacardProps) {
  if (!book || !anchorRect || !containerRect) return null

  const bookCenterX = anchorRect.left - containerRect.left + anchorRect.width / 2
  const bookTop = anchorRect.top - containerRect.top

  let left = bookCenterX - PLACARD_WIDTH / 2
  let top = bookTop - PLACARD_HEIGHT_EST - PLACARD_GAP
  let placement: 'above' | 'below' = 'above'

  if (left < 8) left = 8
  if (left + PLACARD_WIDTH > containerRect.width - 8) {
    left = containerRect.width - PLACARD_WIDTH - 8
  }
  if (top < 0) {
    top = bookTop + anchorRect.height + PLACARD_GAP
    placement = 'below'
  }

  return (
    <motion.div
      layout
      layoutId="museum-placard"
      initial={{ opacity: 0, y: placement === 'above' ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: placement === 'above' ? 4 : -4 }}
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
        padding: '12px 16px 14px',
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
          fontFamily: 'var(--font-jost), system-ui, -apple-system, sans-serif',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        Volume · {book.section || 'Set'}
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
        {book.title}
      </div>
      {book.badge != null && book.badge > 0 && (
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
          {book.badge} {book.badge === 1 ? 'card' : 'cards'} due
        </div>
      )}
    </motion.div>
  )
}

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useBookProfile } from './bookBindings'

/* ── Public types preserved from the previous Book implementation.
   Page.tsx, deckToBook, and the cards/list views all consume BookProps,
   so the shape stays stable; only the renderer changes. ───────────── */
export type BookTier = 'found' | 'inter' | 'adv'
export type BookTopic =
  | 'pitch' | 'rhythm' | 'harmony'
  | 'expression' | 'notation' | 'form' | 'technique'
  | 'analysis' | 'aural' | 'construction'
export type BookHeight = 's' | 'm' | 'l' | 'xl'
export type BookWidth = 'thin' | 'med' | 'thick'
export type BookState = 'new' | 'active' | 'mastered'

export interface BookProps {
  id: string
  href: string
  title: string
  volume?: string
  tier: BookTier
  topic?: BookTopic
  height: BookHeight
  width: BookWidth
  state: BookState
  cardCount: number
  dueCount: number
  learning: number
  mastered: number
  categoryLabel: string
  lastSeenLabel?: string
  pctMastered: number
}

interface ShelfBookProps extends BookProps {
  isHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onClick?: () => void
}

const Book = React.forwardRef<HTMLDivElement, ShelfBookProps>(function Book(
  { title, dueCount, href, isHovered, onHoverStart, onHoverEnd, onClick },
  ref,
) {
  const router = useRouter()
  const { binding, height, width, pushBack } = useBookProfile(title)
  const badge = dueCount > 0 ? dueCount : null

  return (
    <div
      ref={ref}
      style={{
        perspective: '1400px',
        height: 280,
        display: 'flex',
        alignItems: 'flex-end',
        cursor: 'pointer',
        position: 'relative',
        zIndex: isHovered ? 10 : 1,
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick ?? (() => router.push(href))}
      role="link"
      aria-label={title}
    >
      <motion.div
        animate={{
          z: isHovered ? 32 : -pushBack,
          y: isHovered ? -10 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.7 }}
        style={{
          width,
          height,
          transformOrigin: 'bottom center',
          transformStyle: 'preserve-3d',
          position: 'relative',
          filter: `drop-shadow(0 ${isHovered ? 16 : 3}px ${
            isHovered ? 18 : 4
          }px rgba(40, 20, 8, ${isHovered ? 0.45 : 0.25}))`,
        }}
      >
        {/* SPINE */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: binding.spine,
            borderRadius: '1px 2px 2px 1px',
            overflow: 'hidden',
            boxShadow:
              'inset 2px 0 3px rgba(0,0,0,0.3), inset -2px 0 3px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.08)',
          }}
        >
          {/* Material texture overlay (cloth weave / vellum tooth / leather grain) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                binding.weight === 'cloth'
                  ? 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, transparent 1px, transparent 2px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, transparent 1px, transparent 2px)'
                  : binding.weight === 'vellum'
                  ? 'repeating-linear-gradient(2deg, rgba(80,60,30,0.04) 0px, transparent 1px, transparent 3px)'
                  : 'radial-gradient(ellipse at 30% 40%, rgba(0,0,0,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)',
              mixBlendMode: 'overlay',
              opacity: 0.7,
            }}
          />
          {/* Headband stripes top/bottom */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: `repeating-linear-gradient(90deg, ${binding.headband} 0px, ${binding.headband} 2px, ${binding.bandColor} 2px, ${binding.bandColor} 4px)`,
              borderBottom: `1px solid ${binding.bandColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 8,
              background: `repeating-linear-gradient(90deg, ${binding.headband} 0px, ${binding.headband} 2px, ${binding.bandColor} 2px, ${binding.bandColor} 4px)`,
              borderTop: `1px solid ${binding.bandColor}`,
            }}
          />

          {/* Raised bands (leather only) */}
          {binding.weight === 'leather' && (
            <>
              {[0.28, 0.5, 0.78].map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${pos * 100}%`,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(180deg, ${binding.bandColor} 0%, transparent 50%, ${binding.bandColor} 100%)`,
                    boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 -1px 0 rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </>
          )}

          {/* Decorative ornaments (rules / labels) */}
          {binding.ornament === 'double-rule' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: 4,
                  right: 4,
                  height: 1,
                  background: binding.accentColor,
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 22,
                  left: 4,
                  right: 4,
                  height: 1,
                  background: binding.accentColor,
                  opacity: 0.5,
                }}
              />
            </>
          )}

          {binding.ornament === 'red-label' && (
            <div
              style={{
                position: 'absolute',
                top: '32%',
                left: 3,
                right: 3,
                height: '30%',
                background: 'linear-gradient(180deg, #6a1014 0%, #8a1820 50%, #6a1014 100%)',
                border: `1px solid ${binding.bandColor}`,
                borderRadius: 1,
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
              }}
            />
          )}

          {binding.ornament === 'label' && (
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: 3,
                right: 3,
                height: '32%',
                background: 'linear-gradient(180deg, #3a2818 0%, #5a4028 50%, #3a2818 100%)',
                border: `1px solid ${binding.bandColor}`,
                borderRadius: 1,
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
              }}
            />
          )}

          {/* Vertical foil title */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", "Garamond", serif',
              fontWeight: 600,
              fontSize: width > 38 ? 12 : 11,
              letterSpacing: '0.04em',
              padding: '30px 0',
              background:
                binding.ornament === 'red-label' || binding.ornament === 'label'
                  ? 'linear-gradient(180deg, #f4e5a1 0%, #d4af37 50%, #8b6914 100%)'
                  : binding.foil,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 0.5px 0 rgba(0,0,0,0.3))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>

        {/* TOP EDGE — gilt or paper depending on weight */}
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: 1,
            right: 1,
            height: 3,
            background:
              binding.weight === 'leather'
                ? 'linear-gradient(90deg, #8b6914 0%, #d4af37 50%, #8b6914 100%)'
                : 'linear-gradient(90deg, #c8b89a 0%, #e0d0b0 50%, #c8b89a 100%)',
            borderRadius: '1px 1px 0 0',
            transform: 'rotateX(45deg)',
            transformOrigin: 'bottom',
          }}
        />

        {/* BADGE (cards due) */}
        {badge != null && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #c83a2a 0%, #a02818 100%)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-jost), system-ui, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              zIndex: 2,
            }}
          >
            {badge}
          </div>
        )}
      </motion.div>
    </div>
  )
})

export default Book

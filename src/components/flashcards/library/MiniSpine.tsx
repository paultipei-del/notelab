'use client'

import { useBookBinding } from './bookBindings'

export interface MiniSpineProps {
  title: string
  /** Outer width including the top-edge gilt strip. */
  width: number
  /** Outer height including the top-edge gilt strip. */
  height: number
}

/**
 * Static, lightweight book spine. Same visual primitives as `<Book>`
 * (binding gradient, weave/grain texture, headbands, raised bands,
 * ornaments, vertical foil title) but with no motion, perspective,
 * hover, click, or 3D — just the spine's painted surface.
 *
 * Built deliberately separate from `<Book>` because the bookshelf needs
 * the motion machinery (lift, glide, anchor placards) and the homepage
 * Continue card doesn't. Keeping them separate avoids threading
 * `if (static) skip framer-motion` branches through `<Book>` and limits
 * regression risk on the high-traffic flashcards page.
 *
 * Visual primitives drift is bounded: both consume `useBookBinding` and
 * the same gradient/headband/foil-title CSS conventions. If those need
 * to change, both update in lockstep through the binding utility.
 */
export default function MiniSpine({ title, width, height }: MiniSpineProps) {
  const binding = useBookBinding(title)

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        flexShrink: 0,
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
            'inset 2px 0 3px rgba(0,0,0,0.3), inset -2px 0 3px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.08), 0 3px 6px rgba(40, 20, 8, 0.25)',
        }}
      >
        {/* Material texture */}
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
        {/* Headbands */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
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
            height: 6,
            background: `repeating-linear-gradient(90deg, ${binding.headband} 0px, ${binding.headband} 2px, ${binding.bandColor} 2px, ${binding.bandColor} 4px)`,
            borderTop: `1px solid ${binding.bandColor}`,
          }}
        />

        {/* Raised bands (leather only) */}
        {binding.weight === 'leather' && (
          <>
            {[0.32, 0.52, 0.72].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${pos * 100}%`,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(180deg, ${binding.bandColor} 0%, transparent 50%, ${binding.bandColor} 100%)`,
                  boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 -1px 0 rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </>
        )}

        {/* Decorative ornaments */}
        {binding.ornament === 'double-rule' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 3,
                right: 3,
                height: 1,
                background: binding.accentColor,
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 17,
                left: 3,
                right: 3,
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
              top: '34%',
              left: 2,
              right: 2,
              height: '28%',
              background: 'linear-gradient(180deg, #6a1014 0%, #8a1820 50%, #6a1014 100%)',
              border: `1px solid ${binding.bandColor}`,
              borderRadius: 1,
              boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
            }}
          />
        )}
        {binding.ornament === 'label' && (
          <div
            style={{
              position: 'absolute',
              top: '32%',
              left: 2,
              right: 2,
              height: '30%',
              background: 'linear-gradient(180deg, #3a2818 0%, #5a4028 50%, #3a2818 100%)',
              border: `1px solid ${binding.bandColor}`,
              borderRadius: 1,
              boxShadow: 'inset 0 0 3px rgba(0,0,0,0.5)',
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
            fontSize: width >= 36 ? 11 : 10,
            letterSpacing: '0.04em',
            padding: '20px 0',
            background:
              binding.ornament === 'red-label' || binding.ornament === 'label'
                ? 'linear-gradient(180deg, #f4e5a1 0%, #d4af37 50%, #8b6914 100%)'
                : binding.foil,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
      </div>

      {/* TOP EDGE */}
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
        }}
      />
    </div>
  )
}

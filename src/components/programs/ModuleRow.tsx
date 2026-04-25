'use client'

// TODO(design-system): Hover state is currently driven by inline onMouseEnter/
// onMouseLeave handlers, which forces this file to be a client component.
// A future refactor can lift hover + focus-visible into a CSS module (or
// :hover/:focus-visible rules in globals.css), at which point ModuleRow can
// become a server component. Tracking with the broader programs styling pass.

import Link from 'next/link'
import { useId, type ReactNode } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export type ModuleRowState = 'unlocked' | 'completed' | 'locked' | 'coming-soon'

interface ModuleRowCommonProps {
  number: number
  title: string
  /**
   * Decoration adjacent to the title. Reserved for the burgundy in-progress
   * dot. The completed ✓ is rendered internally as part of the badge — do not
   * pass it via this prop.
   */
  titleIcon?: ReactNode
  subtitle?: string
  /** Pills/badges shown below the subtitle (clef, tools, level, etc.). */
  chips?: ReactNode
  /** Optional pill pinned to the right end of the chip row (e.g. retention %). */
  trailingChip?: ReactNode
  /**
   * One-line tail under chips. Use for progress text on unlocked rows
   * ("Identify 2/5") and lock-reason on locked rows ("Complete X to unlock").
   * Auto-italicized when state is 'locked'.
   */
  secondaryText?: string
}

export type ModuleRowProps = ModuleRowCommonProps & (
  | { state: 'unlocked' | 'completed'; href: string }
  | { state: 'locked' | 'coming-soon'; href?: never }
)

export default function ModuleRow(props: ModuleRowProps) {
  const { state, number, title, titleIcon, subtitle, chips, trailingChip, secondaryText } = props
  const isInteractive = state === 'unlocked' || state === 'completed'
  const isMuted = state === 'locked' || state === 'coming-soon'
  const secondaryTextId = useId()

  const bg =
    state === 'completed' ? '#F7F4ED' :
    state === 'unlocked' ? 'white' :
    '#FDFAF3'
  const borderColor =
    state === 'completed' ? '#C8C4BA' : '#DDD8CA'
  const opacity =
    state === 'coming-soon' ? 0.55 :
    state === 'locked' ? 0.5 :
    1

  const badgeBg =
    state === 'completed' ? '#3B6D11' :
    state === 'unlocked' ? '#1A1A18' :
    '#EDE8DF'
  const badgeColor = isMuted ? '#B0ACA4' : 'white'

  const titleColor = isMuted ? '#B0ACA4' : '#2A2318'
  const subtitleColor = isMuted ? '#B0ACA4' : '#7A7060'
  const tailGlyph = state === 'locked' ? '🔒' : isInteractive ? '→' : null

  const cardBaseStyle: React.CSSProperties = {
    background: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding: '18px 20px',
    opacity,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'border-color 0.15s',
  }

  const inner = (
    <>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: badgeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {state === 'completed'
          ? <span aria-hidden="true" style={{ color: badgeColor, fontSize: '12px', fontWeight: 400 }}>✓</span>
          : <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: badgeColor }}>{number}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: titleColor, margin: 0 }}>
            {title}
          </p>
          {titleIcon}
          {state === 'coming-soon' && (
            <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#DDD8CA', letterSpacing: '0.06em' }}>
              Coming Soon
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{
            fontFamily: F, fontSize: 'var(--nl-text-badge)',
            color: subtitleColor, margin: '0 0 6px', lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
        {(chips || trailingChip) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {chips && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
                {chips}
              </div>
            )}
            {trailingChip && (
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                {trailingChip}
              </div>
            )}
          </div>
        )}
        {/* Reserve vertical space whether or not secondaryText is present so
            all row heights line up. */}
        <p
          id={secondaryTextId}
          style={{
            fontFamily: F, fontSize: 'var(--nl-text-badge)',
            color: subtitleColor,
            fontStyle: state === 'locked' ? 'italic' : 'normal',
            margin: '6px 0 0', lineHeight: 1.4,
            minHeight: '17px',
          }}
        >
          {secondaryText}
        </p>
      </div>

      {tailGlyph && (
        <span aria-hidden="true" style={{
          fontFamily: F, fontSize: 'var(--nl-text-compact)',
          color: '#DDD8CA', flexShrink: 0,
        }}>
          {tailGlyph}
        </span>
      )}
    </>
  )

  if (isInteractive) {
    return (
      <Link
        href={props.href}
        className="nl-module-row-link"
        style={{ textDecoration: 'none' }}
      >
        <div
          style={{ ...cardBaseStyle, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '' }}
        >
          {inner}
        </div>
      </Link>
    )
  }

  if (state === 'locked') {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-describedby={secondaryText ? secondaryTextId : undefined}
        style={{
          ...cardBaseStyle,
          width: '100%',
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'default',
        }}
      >
        {inner}
      </button>
    )
  }

  // coming-soon
  return (
    <div
      role="group"
      aria-disabled="true"
      aria-label={`${title}. Coming soon.`}
      style={cardBaseStyle}
    >
      {inner}
    </div>
  )
}

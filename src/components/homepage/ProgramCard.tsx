'use client'

import Link from 'next/link'
import { useBookBinding } from '@/components/flashcards/library/bookBindings'
import type {
  ProgramHeroData,
  ProgramHeroModule,
} from './programAdapters/types'

export type ProgramCardDensity = 'default' | 'compact' | 'mini'

const ROW_LIMIT: Record<ProgramCardDensity, number> = {
  default: 6,
  compact: 4,
  mini: 3,
}

export interface ProgramCardProps {
  program: ProgramHeroData
  density?: ProgramCardDensity
  /** Render the Continue button at the bottom (mobile / Phase 3 mini). */
  showCta?: boolean
  /**
   * Override the density's default visible-row count. Used by the
   * State 4 mobile stack which wants 2 rows (vs compact's default 4)
   * to keep the stacked card pair from running long.
   */
  rowLimit?: number
}

export default function ProgramCard({
  program,
  density = 'default',
  showCta = false,
  rowLimit,
}: ProgramCardProps) {
  // Hash on programId so each program gets a stable stripe color across
  // renders and aligns with the Cards/List binding system used elsewhere.
  const binding = useBookBinding(program.programId)
  const limit = rowLimit ?? ROW_LIMIT[density]

  // Always include the next-up module if it exists, even if it would
  // otherwise fall outside the row limit. Render in original order.
  const visible = pickRowsKeepingNext(program.modules, limit)

  return (
    <div
      style={{
        background: 'rgba(255, 250, 238, 0.7)',
        border: '1px solid rgba(139, 105, 20, 0.25)',
        borderLeft: `4px solid ${binding.stripe}`,
        borderRadius: 4,
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          fontWeight: 700,
        }}
      >
        Your program · in progress
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 26,
          fontWeight: 500,
          margin: 0,
          color: '#1a1208',
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
        }}
      >
        {program.title}
      </h2>
      {program.subtitle && (
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: '#5a4028',
            marginTop: -8,
          }}
        >
          {program.subtitle}
        </div>
      )}
      <ProgressRow
        doneCount={program.doneCount}
        totalModules={program.totalModules}
        pct={program.pct}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((m, i) => (
          <ModuleRow
            key={m.id}
            module={m}
            programId={program.programId}
            instanceIdx={i}
            density={density}
          />
        ))}
      </div>
      {showCta && program.next && (
        <Link
          href={program.next.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 18px',
            marginTop: 4,
            borderRadius: 6,
            background: '#1a1208',
            color: '#f0e7d0',
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 14,
            textDecoration: 'none',
            minHeight: 44,
            whiteSpace: 'nowrap',
          }}
        >
          Continue {nextLabel(program.next)} →
        </Link>
      )}
    </div>
  )
}

function pickRowsKeepingNext(
  modules: ProgramHeroModule[],
  limit: number,
): ProgramHeroModule[] {
  if (modules.length <= limit) return modules
  const nextIdx = modules.findIndex(m => m.status === 'next')
  // Prefer a window that places the next-up roughly in the middle.
  if (nextIdx === -1) return modules.slice(0, limit)
  const half = Math.floor(limit / 2)
  let start = Math.max(0, nextIdx - half)
  let end = start + limit
  if (end > modules.length) {
    end = modules.length
    start = Math.max(0, end - limit)
  }
  return modules.slice(start, end)
}

function nextLabel(m: ProgramHeroModule): string {
  // Strip a leading "Lesson N — " or similar prefix to keep the button
  // tight, matching the spec's "Continue Module 4 →" style.
  return m.title.replace(/^Lesson\s+[^—]+—\s+/, '').replace(/^Module\s+\d+\s*—\s*/, '')
}

function ProgressRow({
  doneCount,
  totalModules,
  pct,
}: {
  doneCount: number
  totalModules: number
  pct: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: 3,
          background: 'rgba(139, 105, 20, 0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #c9a449 0%, #d4af37 100%)',
          }}
        />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: '#8a7560',
          flex: '0 0 auto',
        }}
      >
        {doneCount} of {totalModules} · {pct}%
      </div>
    </div>
  )
}

function ModuleRow({
  module,
  programId,
  instanceIdx,
  density,
}: {
  module: ProgramHeroModule
  programId: string
  instanceIdx: number
  density: ProgramCardDensity
}) {
  const isDone = module.status === 'done'
  const isNext = module.status === 'next'
  const isCompact = density !== 'default'
  // On compact (mobile / mini), strip the "Lesson N — " or "Module N — "
  // prefix so titles like "Lesson 8 — Major Five-Finger Patterns and
  // Triads" don't truncate mid-phrase in the narrower column.
  const displayTitle = isCompact ? stripModulePrefix(module.title) : module.title

  return (
    <Link
      href={module.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textDecoration: 'none',
        color: 'inherit',
        padding: '4px 0',
      }}
    >
      <div style={{ flex: '0 0 14px', display: 'flex', justifyContent: 'center' }}>
        {isDone && (
          // Density goes into the gradient id so the desktop and mobile
          // ProgramCard instances (both mounted, only display-toggled)
          // don't share an id and silently break the mobile gradient.
          <GiltCheckmark id={`gilt-prog-${programId}-${density}-${instanceIdx}`} />
        )}
        {isNext && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#c83a2a',
              boxShadow: '0 0 0 3px rgba(200, 58, 42, 0.15)',
              display: 'inline-block',
            }}
          />
        )}
        {!isDone && !isNext && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              border: '1px solid rgba(139, 105, 20, 0.35)',
              display: 'inline-block',
            }}
          />
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 15,
          lineHeight: 1.2,
          fontWeight: isNext ? 500 : 400,
          // Done lessons stay readable but visually subordinate — the
          // strikethrough already does the "completed" signal; the color
          // now matches the hero context paragraph instead of fading
          // toward invisibility.
          color: isDone ? '#5a4028' : isNext ? '#1a1208' : '#a89878',
          textDecoration: isDone ? 'line-through' : undefined,
          fontStyle: !isDone && !isNext ? 'italic' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayTitle}
      </div>
      {isNext && module.estMinutes != null && (
        <div
          style={{
            // Sans (Jost) for the duration — Cormorant italic renders the
            // tilde glyph as a long stroke that reads like a dash. Sans
            // keeps the tilde unambiguous and the row still scans cleanly
            // because the duration is small numerical metadata.
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 400,
            color: '#8a7560',
            flex: '0 0 auto',
            letterSpacing: '0.02em',
          }}
        >
          ~{module.estMinutes} min
        </div>
      )}
      {isNext && (
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 14,
            color: '#a0381c',
            flex: '0 0 auto',
          }}
        >
          →
        </div>
      )}
    </Link>
  )
}

function stripModulePrefix(title: string): string {
  return title
    .replace(/^Lesson\s+[^—]+—\s+/, '')
    .replace(/^Module\s+\d+\s*—\s*/, '')
}

function GiltCheckmark({ id }: { id: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4e5a1" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
      </defs>
      <path
        d="M3 7.5 L6 10.5 L11 4.5"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

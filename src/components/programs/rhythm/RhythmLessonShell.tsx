'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export type LessonStepKind = 'concept' | 'listen' | 'practice' | 'check'

export interface LessonStep {
  kind: LessonStepKind
  href: string
  label: string
  /** True if this step has been completed (or auto-completed by visiting). Drives the dot color. */
  done?: boolean
  /** True if this is the step the user is currently on. */
  active?: boolean
}

interface Props {
  /** Topic display name shown in the header. */
  topicName: string
  /** Sub-program slug for breadcrumb back-link. */
  programSlug: string
  /** Sub-program display name (e.g. "Fundamentals"). */
  programTitle: string
  /** Where the "← back to topic" link points. */
  topicHref: string
  steps: LessonStep[]
  children: React.ReactNode
}

/**
 * Side-rail wrapper for rhythm program lesson pages. Renders the breadcrumb,
 * topic header, a vertical step-progress rail, and the page body. Lesson pages
 * (concept / listen / practice / check) supply their content as `children`.
 *
 * The shell does not own progression state — pages decide what's done/active
 * via the `steps` array. The rail is purely presentational + navigational.
 */
export default function RhythmLessonShell({
  topicName, programSlug, programTitle, topicHref, steps, children,
}: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <Link href={topicHref} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← {topicName}
          </span>
        </Link>

        <div style={{ marginTop: '20px', marginBottom: '28px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            <Link href={`/programs/rhythm/${programSlug}`} style={{ color: '#7A7060', textDecoration: 'none' }}>
              {programTitle}
            </Link>
            {' · '}
            {topicName}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)', gap: '32px', alignItems: 'start' }}>

          {/* Side rail */}
          <nav aria-label="Lesson steps" style={{ position: 'sticky' as const, top: '24px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 14px 0' }}>
              Lesson
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
              {steps.map((step, idx) => {
                const isLast = idx === steps.length - 1
                return (
                  <li key={step.kind} style={{ position: 'relative' as const }}>
                    <Link
                      href={step.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: step.active ? '#FDFAF3' : 'transparent',
                        border: step.active ? '1px solid #DDD8CA' : '1px solid transparent',
                      }}
                    >
                      <Dot done={!!step.done} active={!!step.active} />
                      <span style={{
                        fontFamily: F,
                        fontSize: '14px',
                        fontWeight: step.active ? 500 : 400,
                        color: step.active ? '#1A1A18' : step.done ? '#4A4540' : '#7A7060',
                      }}>
                        {idx + 1}. {step.label}
                      </span>
                    </Link>
                    {!isLast && (
                      <span aria-hidden="true" style={{
                        position: 'absolute' as const,
                        left: '19px', // align with dot center (10px padding + 9px to dot center)
                        top: '32px',
                        bottom: '-6px',
                        width: '1px',
                        background: '#DDD8CA',
                      }} />
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Body */}
          <div>
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}

function Dot({ done, active }: { done: boolean; active: boolean }) {
  const bg = done ? '#3B6D11' : active ? '#1A1A18' : '#FDFAF3'
  const border = done || active ? bg : '#C8C4BA'
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: bg,
      border: `1.5px solid ${border}`,
      flexShrink: 0,
    }} />
  )
}

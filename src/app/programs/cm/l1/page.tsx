'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CM_LEVEL1_LESSONS } from '@/lib/programs/cm-level1/lessons'
import { Breadcrumb } from '@/components/programs/cm-level1/nav/Breadcrumb'
import {
  isCMLevel1LessonUnlocked,
  loadCMLevel1Progress,
  type CMLevel1ProgressStore,
} from '@/lib/programs/cm-level1/progress'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#BA7517'

export default function CMLevel1HubPage() {
  const [store, setStore] = useState<CMLevel1ProgressStore>({})

  useEffect(() => {
    setStore(loadCMLevel1Progress())
  }, [])

  const total = CM_LEVEL1_LESSONS.length
  const done = CM_LEVEL1_LESSONS.filter(lesson => store[lesson.slug]?.completed).length

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Breadcrumb
            crumbs={[
              { label: 'Certificate of Merit', href: '/programs/cm' },
              { label: 'Level 1' },
            ]}
          />

          <div style={{ marginTop: '28px', marginBottom: '36px' }}>
            <p
              style={{
                fontFamily: F,
                fontSize: 'var(--nl-text-compact)',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7A7060',
                marginBottom: '10px',
              }}
            >
              Certificate of Merit · Level 1
            </p>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: 'clamp(26px, 4vw, 40px)',
                color: '#2A2318',
                marginBottom: '14px',
                letterSpacing: '0.02em',
              }}
            >
              Level 1 Lesson Blueprint
            </h1>
            <p
              style={{
                fontFamily: F,
                fontSize: 'var(--nl-text-body)',
                color: '#7A7060',
                lineHeight: 1.7,
                maxWidth: '560px',
                marginBottom: '20px',
              }}
            >
              Placeholder scaffolding is ready for all Level 1 lessons, reviews, and the final review test.
              Each module can now be populated from your detailed instructions.
            </p>

            {done > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    flex: 1,
                    maxWidth: '220px',
                    height: '5px',
                    background: '#EDE8DF',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(done / total) * 100}%`,
                      height: '100%',
                      background: ACCENT,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
                  {done} / {total} complete
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CM_LEVEL1_LESSONS.map(lesson => {
              const unlocked = isCMLevel1LessonUnlocked(lesson.slug, store)
              const progress = store[lesson.slug]
              const completed = progress?.completed ?? false
              const inProgress = !completed && (progress?.sessions.length ?? 0) > 0

              if (!unlocked) {
                return (
                  <div
                    key={lesson.slug}
                    style={{
                      background: '#ECE3CC',
                      border: '1px solid #EDE8DF',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      opacity: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#EDE8DF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4' }}>
                        {lesson.number}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#B0ACA4', margin: '0 0 3px' }}>
                        {lesson.title}
                      </p>
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#C8C4BA', margin: 0 }}>
                        {lesson.subtitle}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--nl-text-compact)', color: '#D9CFAE' }}>🔒</span>
                  </div>
                )
              }

              return (
                <Link key={lesson.slug} href={`/programs/cm/l1/${lesson.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: '#FDFBF5',
                      border: `1px solid ${completed ? '#D9CFAE' : '#E8E4DC'}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#1A1A18'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = completed ? '#D9CFAE' : '#E8E4DC'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: completed ? ACCENT : '#1A1A18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {completed ? (
                        <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                      ) : (
                        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: 'white' }}>{lesson.number}</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#2A2318', margin: 0 }}>
                          {lesson.title}
                        </p>
                        {inProgress && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
                        )}
                      </div>
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
                        {lesson.subtitle}
                      </p>
                    </div>

                    {completed && progress && (
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Best: <strong style={{ color: '#2A2318' }}>{Math.round(progress.bestScore * 100)}%</strong>
                      </span>
                    )}

                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#D9CFAE', flexShrink: 0 }}>→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

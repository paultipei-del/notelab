'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CM_PREP_LESSONS } from '@/lib/programs/cm-prep/lessons'
import { Breadcrumb } from '@/components/programs/cm-prep/nav/Breadcrumb'
import {
  loadCMPrepProgress, loadCMPrepProgressRemote, isCMPrepLessonUnlocked,
  type CMPrepProgressStore,
} from '@/lib/programs/cm-prep/progress'
import { useAuth } from '@/hooks/useAuth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#BA7517'

export default function CMPrepHubPage() {
  const [store, setStore] = useState<CMPrepProgressStore>({})
  const { user } = useAuth()

  // Show the local cache right away, then merge/sync with Supabase when signed in.
  useEffect(() => { setStore(loadCMPrepProgress()) }, [])
  useEffect(() => {
    if (!user) return
    let cancelled = false
    loadCMPrepProgressRemote(user.id).then(remote => {
      if (!cancelled) setStore(remote)
    })
    return () => { cancelled = true }
  }, [user])

  const total = CM_PREP_LESSONS.length
  const done = CM_PREP_LESSONS.filter(l => store[l.slug]?.completed).length

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
       <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Breadcrumb trail */}
        <Breadcrumb crumbs={[
          { label: 'Certificate of Merit', href: '/programs/cm' },
          { label: 'Preparatory Level' },
        ]} />

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(26px, 4vw, 40px)', color: '#2A2318', marginBottom: '14px', letterSpacing: '0.02em' }}>
            Preparatory Level
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', color: '#7A7060', lineHeight: 1.7, maxWidth: '560px', marginBottom: '20px' }}>
            The foundation level. Covers staff reading on both clefs, accidentals, intervals, five-finger patterns and triads, key signatures, major scales, time signatures, and signs and terms.
          </p>

          {/* Overall progress */}
          {done > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, maxWidth: '200px', height: '5px', background: '#EDE8DF', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: ACCENT, borderRadius: '3px' }} />
              </div>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
                {done} / {total} complete
              </span>
            </div>
          )}
        </div>

        {/* Lesson list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CM_PREP_LESSONS.map((lesson, i) => {
            const unlocked = isCMPrepLessonUnlocked(lesson.slug, store)
            const progress = store[lesson.slug]
            const completed = progress?.completed ?? false
            const inProgress = !completed && (progress?.sessions.length ?? 0) > 0

            if (!unlocked) {
              return (
                <div key={lesson.slug} style={{
                  background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: '14px',
                  padding: '16px 20px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: '#EDE8DF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4' }}>
                      {lesson.number}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#B0ACA4', margin: '0 0 3px' }}>{lesson.title}</p>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#C8C4BA', margin: 0 }}>{lesson.subtitle}</p>
                  </div>
                  <span style={{ fontSize: 'var(--nl-text-compact)', color: '#D9CFAE' }}>🔒</span>
                </div>
              )
            }

            return (
              <Link key={lesson.slug} href={`/programs/cm/prep/${lesson.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--cream-card-strong)',
                    border: '1px solid var(--brown-faint)',
                    borderRadius: '14px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(154, 124, 80, 0.32)' }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: completed ? 'var(--forest)' : '#1A1A18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {completed
                      ? <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                      : <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: 'white' }}>{lesson.number}</span>
                    }
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
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060',
                      whiteSpace: 'nowrap', flexShrink: 0 }}>
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

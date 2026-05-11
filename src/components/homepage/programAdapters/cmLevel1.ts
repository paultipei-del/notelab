'use client'

import {
  CM_LEVEL1_LESSONS,
} from '@/lib/programs/cm-level1/lessons'
import {
  loadCMLevel1Progress,
  type CMLevel1ProgressStore,
} from '@/lib/programs/cm-level1/progress'
import type {
  ProgramHeroData,
  ProgramHeroModule,
  ProgramTileMeta,
} from './types'

/** Hand-wavy estimate shown on the next-up module row. */
const EST_MINUTES_NEXT = 30

function lastTouchedFor(store: CMLevel1ProgressStore): number {
  let max = 0
  for (const slug of Object.keys(store)) {
    const sessions = store[slug]?.sessions ?? []
    for (const s of sessions) {
      if (s.timestamp > max) max = s.timestamp
    }
  }
  return max
}

export function loadCMLevel1Hero(): ProgramHeroData | null {
  const store = loadCMLevel1Progress()
  const lastTouched = lastTouchedFor(store)
  if (lastTouched === 0) return null

  const modules: ProgramHeroModule[] = CM_LEVEL1_LESSONS.map(lesson => {
    const p = store[lesson.slug]
    const done = !!p?.completed
    return {
      id: lesson.slug,
      title: `Lesson ${lesson.number} — ${lesson.title}`,
      href: `/programs/cm/l1/${lesson.slug}`,
      status: done ? 'done' : 'future',
    }
  })

  // First non-done becomes "next" with the duration estimate.
  const nextIdx = modules.findIndex(m => m.status === 'future')
  if (nextIdx !== -1) {
    modules[nextIdx] = {
      ...modules[nextIdx],
      status: 'next',
      estMinutes: EST_MINUTES_NEXT,
    }
  }

  const doneCount = modules.filter(m => m.status === 'done').length
  const totalModules = modules.length
  const pct = Math.round((doneCount / Math.max(1, totalModules)) * 100)
  const next = modules.find(m => m.status === 'next') ?? null

  return {
    programId: 'cm-level1',
    title: 'Certificate of Merit · Level 1',
    subtitle: '',
    totalModules,
    doneCount,
    pct,
    modules,
    next,
    lastTouched,
  }
}

/**
 * Tile meta is exposed for completeness so future surfaces (e.g. a
 * level-specific landing) can render a CM Level 1 tile on its own. The
 * State 1 hero uses the broader CM tile from cmPrep.ts; this metadata
 * is unused there.
 */
export function getCMLevel1TileMeta(): ProgramTileMeta {
  return {
    programId: 'cm-level1',
    eyebrow: 'Curriculum',
    title: 'Certificate of Merit · Level 1',
    blurb: 'The first level of the MTAC syllabus — landmarks, intervals, and the keyboard.',
    meta: '13 lessons · ~3 months',
    href: '/programs/cm/l1',
    borderColor: '#7a2228', // oxblood — same family as the broader CM tile
  }
}

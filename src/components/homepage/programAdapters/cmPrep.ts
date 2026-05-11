'use client'

import { CM_PREP_LESSONS } from '@/lib/programs/cm/prep/lessons'
import {
  loadCMPrepProgress,
  type CMPrepProgressStore,
} from '@/lib/programs/cm/prep/progress'
import type {
  ProgramHeroData,
  ProgramHeroModule,
  ProgramTileMeta,
} from './types'

const EST_MINUTES_NEXT = 25

function lastTouchedFor(store: CMPrepProgressStore): number {
  let max = 0
  for (const slug of Object.keys(store)) {
    for (const s of store[slug]?.sessions ?? []) {
      if (s.timestamp > max) max = s.timestamp
    }
  }
  return max
}

export function loadCMPrepHero(): ProgramHeroData | null {
  const store = loadCMPrepProgress()
  const lastTouched = lastTouchedFor(store)
  if (lastTouched === 0) return null

  const modules: ProgramHeroModule[] = CM_PREP_LESSONS.map(lesson => {
    const done = !!store[lesson.slug]?.completed
    return {
      id: lesson.slug,
      title: `Lesson ${lesson.number} — ${lesson.title}`,
      href: `/programs/cm/prep/${lesson.slug}`,
      status: done ? 'done' : 'future',
    }
  })

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
    programId: 'cm-prep',
    title: 'CM Prep',
    subtitle: 'Pre-Level 1',
    totalModules,
    doneCount,
    pct,
    modules,
    next,
    lastTouched,
  }
}

/**
 * State 1 (new user) tile copy for the broader CM track. The cmPrep
 * adapter owns the user-facing CM identity since it's the entry point;
 * cmLevel1 keeps its own tile meta for future surfaces. The href points
 * to the CM index (`/programs/cm`) so the user can browse levels rather
 * than landing inside Prep specifically.
 */
export function getCMPrepTileMeta(): ProgramTileMeta {
  return {
    programId: 'cm-prep',
    eyebrow: 'Curriculum',
    title: 'Certificate of Merit',
    blurb: 'Levels 1–10 of the MTAC syllabus, paced for the May exam.',
    meta: '10 levels · ~6 months',
    href: '/programs/cm',
    borderColor: '#7a2228', // oxblood
  }
}

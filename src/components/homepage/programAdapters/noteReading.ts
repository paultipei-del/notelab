'use client'

import { NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  loadNRProgress,
  type NRProgressStore,
} from '@/lib/programs/note-reading/progress'
import type {
  ProgramHeroData,
  ProgramHeroModule,
  ProgramTileMeta,
} from './types'

const EST_MINUTES_NEXT = 20

function lastTouchedFor(store: NRProgressStore): number {
  let max = 0
  for (const id of Object.keys(store)) {
    const mp = store[id]
    if (!mp) continue
    for (const tool of ['identify', 'locate', 'play'] as const) {
      for (const s of mp[tool].sessions) {
        if (s.timestamp > max) max = s.timestamp
      }
    }
  }
  return max
}

export function loadNoteReadingHero(): ProgramHeroData | null {
  const store = loadNRProgress()
  const lastTouched = lastTouchedFor(store)
  if (lastTouched === 0) return null

  const modules: ProgramHeroModule[] = NOTE_READING_MODULES.map(mod => {
    const done = !!store[mod.id]?.completed
    return {
      id: mod.id,
      title: mod.title,
      href: `/programs/note-reading/${mod.id}`,
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
    programId: 'note-reading',
    title: 'Note Reading',
    subtitle: 'Grand staff fluency',
    totalModules,
    doneCount,
    pct,
    modules,
    next,
    lastTouched,
  }
}

export function getNoteReadingTileMeta(): ProgramTileMeta {
  return {
    programId: 'note-reading',
    eyebrow: 'Foundation',
    title: 'Note Reading',
    blurb: 'Build fluent reading on both clefs — pitch, rhythm, key.',
    meta: '12 modules · ~8 weeks',
    href: '/programs/note-reading',
    borderColor: '#2a4470', // navy
  }
}

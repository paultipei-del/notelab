'use client'

import { useMemo } from 'react'

/**
 * Eight historical binding variants. A book's binding is chosen
 * deterministically by hashing its title, so the same set always renders
 * the same way across reloads. Variation comes from material weight
 * (leather / cloth / vellum) and ornament (rules, label, red label).
 */
export interface Binding {
  name: string
  spine: string
  /** Solid color for thin edge stripes on Cards/List rows — sampled mid-spine. */
  stripe: string
  foil: string
  bandColor: string
  accentColor: string
  headband: string
  ornament: 'double-rule' | 'single-rule' | 'label' | 'red-label'
  weight: 'leather' | 'cloth' | 'vellum'
}

export const BINDINGS: Binding[] = [
  {
    name: 'oxblood',
    spine: 'linear-gradient(90deg, #4a1418 0%, #6b1d22 8%, #7a2228 50%, #6b1d22 92%, #4a1418 100%)',
    stripe: '#7a2228',
    foil: 'linear-gradient(180deg, #f4e5a1 0%, #d4af37 50%, #8b6914 100%)',
    bandColor: '#3a0e12',
    accentColor: '#d4af37',
    headband: '#1a0608',
    ornament: 'double-rule',
    weight: 'leather',
  },
  {
    name: 'navy-cloth',
    spine: 'linear-gradient(90deg, #15243d 0%, #1f3354 10%, #2a4470 50%, #1f3354 90%, #15243d 100%)',
    stripe: '#2a4470',
    foil: 'linear-gradient(180deg, #e8e8ec 0%, #b8b8c0 50%, #6c6c74 100%)',
    bandColor: '#0d1626',
    accentColor: '#b8b8c0',
    headband: '#8a1d1d',
    ornament: 'single-rule',
    weight: 'cloth',
  },
  {
    name: 'tan-calf',
    spine: 'linear-gradient(90deg, #8a6d4a 0%, #a8845a 10%, #b8966a 50%, #a8845a 90%, #8a6d4a 100%)',
    stripe: '#a8845a',
    foil: 'linear-gradient(180deg, #f4e5a1 0%, #c9a449 50%, #7a5a1f 100%)',
    bandColor: '#5a4028',
    accentColor: '#c9a449',
    headband: '#3a2818',
    ornament: 'label',
    weight: 'leather',
  },
  {
    name: 'forest-green',
    spine: 'linear-gradient(90deg, #1a3525 0%, #234a32 10%, #2d5a3e 50%, #234a32 90%, #1a3525 100%)',
    stripe: '#2d5a3e',
    foil: 'linear-gradient(180deg, #f4e5a1 0%, #d4af37 50%, #8b6914 100%)',
    bandColor: '#0e1f15',
    accentColor: '#d4af37',
    headband: '#c9a449',
    ornament: 'double-rule',
    weight: 'cloth',
  },
  {
    name: 'cream-vellum',
    spine: 'linear-gradient(90deg, #d4c8a8 0%, #e6dcc0 10%, #ede4cc 50%, #e6dcc0 90%, #d4c8a8 100%)',
    stripe: '#c8b89a',
    foil: 'linear-gradient(180deg, #2a2018 0%, #1a1410 50%, #0a0606 100%)',
    bandColor: '#a89878',
    accentColor: '#3a2818',
    headband: '#7a5a3a',
    ornament: 'single-rule',
    weight: 'vellum',
  },
  {
    name: 'burgundy',
    spine: 'linear-gradient(90deg, #3a0a14 0%, #5a141e 10%, #6e1a26 50%, #5a141e 90%, #3a0a14 100%)',
    stripe: '#6e1a26',
    foil: 'linear-gradient(180deg, #f4e5a1 0%, #d4af37 50%, #8b6914 100%)',
    bandColor: '#1f0508',
    accentColor: '#d4af37',
    headband: '#0e1f15',
    ornament: 'double-rule',
    weight: 'leather',
  },
  {
    name: 'charcoal',
    spine: 'linear-gradient(90deg, #1a1a1c 0%, #28282c 10%, #34343a 50%, #28282c 90%, #1a1a1c 100%)',
    stripe: '#34343a',
    foil: 'linear-gradient(180deg, #d4af37 0%, #b89227 50%, #7a5f15 100%)',
    bandColor: '#0a0a0c',
    accentColor: '#d4af37',
    headband: '#4a1418',
    ornament: 'single-rule',
    weight: 'cloth',
  },
  {
    name: 'ivory-red',
    spine: 'linear-gradient(90deg, #c8b89a 0%, #d8c8a8 10%, #e0d0b0 50%, #d8c8a8 90%, #c8b89a 100%)',
    stripe: '#c8b89a',
    foil: 'linear-gradient(180deg, #f4e5a1 0%, #c9a449 50%, #7a5a1f 100%)',
    bandColor: '#9a8868',
    accentColor: '#7a1418',
    headband: '#7a1418',
    ornament: 'red-label',
    weight: 'vellum',
  },
]

export function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export interface BookProfile {
  binding: Binding
  height: number
  width: number
  pushBack: number
}

/**
 * Stable per-title visual profile. Picks a binding, height (188-244),
 * width (32-46), and a small push-back (0-4 px) so books vary along the
 * shelf. Memoised on `title` so re-renders don't reshuffle.
 */
export function useBookProfile(title: string): BookProfile {
  return useMemo(() => {
    const h = hash(title)
    return {
      binding: BINDINGS[h % BINDINGS.length],
      height: 188 + (h % 56),
      width: 32 + ((h >> 4) % 14),
      pushBack: (h >> 16) % 5,
    }
  }, [title])
}

/**
 * Same binding-selection hash as `useBookProfile`, but only returns the
 * binding (skips height/width/pushBack). For Cards/List consumers that
 * only need the colored stripe.
 */
export function useBookBinding(title: string): Binding {
  return useMemo(() => BINDINGS[hash(title) % BINDINGS.length], [title])
}

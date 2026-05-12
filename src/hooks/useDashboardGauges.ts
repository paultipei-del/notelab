'use client'

import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/toolsCatalog'

const DEFAULT_BPM = 120
const DEFAULT_CLICK = { count: 0, target: 10 }

interface ClickCounterState {
  count: number
  target: number
}

interface DashboardGauges {
  metronomeBpm: number
  clickCounter: ClickCounterState
}

function readBpm(): number {
  if (typeof window === 'undefined') return DEFAULT_BPM
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.metronomeBpm)
    if (!raw) return DEFAULT_BPM
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 20 || n > 400) return DEFAULT_BPM
    return n
  } catch {
    return DEFAULT_BPM
  }
}

function readClickCounter(): ClickCounterState {
  if (typeof window === 'undefined') return DEFAULT_CLICK
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.clickCounterState)
    if (!raw) return DEFAULT_CLICK
    const parsed = JSON.parse(raw) as Partial<ClickCounterState>
    return {
      count: typeof parsed.count === 'number' ? parsed.count : DEFAULT_CLICK.count,
      target: typeof parsed.target === 'number' ? parsed.target : DEFAULT_CLICK.target,
    }
  } catch {
    return DEFAULT_CLICK
  }
}

/**
 * Reads last-known state from the Metronome and Click Counter pages
 * for the /tools dashboard strip. SSR-safe: initial state uses defaults
 * (which match server output), localStorage is only read after mount.
 * Cross-tab updates are picked up via the `storage` event.
 *
 * Re-runs on remount, so navigating back to /tools after using one of
 * the underlying tools picks up the new value.
 */
export function useDashboardGauges(): DashboardGauges {
  const [gauges, setGauges] = useState<DashboardGauges>({
    metronomeBpm: DEFAULT_BPM,
    clickCounter: DEFAULT_CLICK,
  })

  useEffect(() => {
    const sync = () => {
      setGauges({
        metronomeBpm: readBpm(),
        clickCounter: readClickCounter(),
      })
    }
    sync()
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.metronomeBpm ||
        e.key === STORAGE_KEYS.clickCounterState ||
        e.key === null // storage.clear()
      ) {
        sync()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return gauges
}

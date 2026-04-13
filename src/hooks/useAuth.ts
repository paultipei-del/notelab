'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    let cancelled = false

    // Never leave the UI stuck on the gray loading chip (e.g. LAN dev, flaky network, blocked Supabase)
    const loadingCap = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 4500)

    const clearCap = () => {
      window.clearTimeout(loadingCap)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      setLoading(false)
      clearCap()
    })

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        setUser(session?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          clearCap()
        }
      })

    return () => {
      cancelled = true
      clearCap()
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

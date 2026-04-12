'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export function usePurchases(userId: string | null) {
  const [purchases, setPurchases] = useState<string[]>([])
  // undefined = haven't fetched for any userId yet
  const [fetchedFor, setFetchedFor] = useState<string | null | undefined>(undefined)

  // loading is true whenever fetchedFor doesn't match the current userId.
  // This is synchronously true when userId changes, before the effect fires.
  const loading = fetchedFor !== userId

  useEffect(() => {
    if (!userId) {
      setPurchases([])
      setFetchedFor(null)
      return
    }

    const supabase = getSupabaseClient()
    supabase
      .from('purchases')
      .select('stripe_price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .then(({ data }) => {
        setPurchases(data?.map(p => p.stripe_price_id) ?? [])
        setFetchedFor(userId)
      })
  }, [userId])

  function hasPurchased(priceId: string): boolean {
    return purchases.includes(priceId)
  }

  function hasSubscription(): boolean {
    return purchases.includes(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')
  }

  return { purchases, loading, hasPurchased, hasSubscription }
}

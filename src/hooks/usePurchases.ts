'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export function usePurchases(userId: string | null) {
  const [purchases, setPurchases] = useState<string[]>([]) // array of price IDs
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setPurchases([])
      setLoading(false)
      return
    }

    setLoading(true)
    const supabase = getSupabaseClient()
    supabase
      .from('purchases')
      .select('stripe_price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .then(({ data }) => {
        setPurchases(data?.map(p => p.stripe_price_id) ?? [])
        setLoading(false)
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

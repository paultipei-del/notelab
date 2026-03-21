import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Use service role key to bypass RLS for recording purchases
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature error:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const { userId, priceId, productType } = session.metadata || {}

    if (userId && priceId) {
      const { error } = await supabase.from('purchases').insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_price_id: priceId,
        product_type: productType || 'unknown',
        status: 'active',
      })

      if (error) console.error('Failed to record purchase:', error)
      else console.log('Purchase recorded for user:', userId)
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const priceId = subscription.items.data[0]?.price.id

    if (priceId) {
      await supabase
        .from('purchases')
        .update({ status: 'cancelled' })
        .eq('stripe_price_id', priceId)
    }
  }

  return NextResponse.json({ received: true })
}

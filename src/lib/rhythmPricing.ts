/**
 * Per-collection pricing for Rhythm Trainer (`program_slug` on `rhythm_exercises`).
 *
 * - Omit a slug or set `stripePriceId` undefined → collection is free for everyone.
 * - Set `stripePriceId` → purchase required (recorded in `purchases` like other products).
 * - Set `grantWithPro: true` → Pro subscription unlocks without buying the collection.
 *
 * Add a Stripe Price in the dashboard, put its ID in `.env.local`, then add a row below.
 */

export type RhythmProgramEntitlement = {
  stripePriceId?: string
  grantWithPro?: boolean
}

const RHYTHM_PROGRAM_ENTITLEMENTS: Record<string, RhythmProgramEntitlement> = {
  /** Default library — free */
  core: {},
  // Example paid collection (uncomment and set env when ready):
  // 'syncopation-lab': {
  //   stripePriceId: process.env.NEXT_PUBLIC_STRIPE_RHYTHM_SYNCOPATION_LAB_PRICE_ID,
  //   grantWithPro: false,
  // },
}

export function getRhythmProgramEntitlement(programSlug: string): RhythmProgramEntitlement {
  return RHYTHM_PROGRAM_ENTITLEMENTS[programSlug] ?? {}
}

export function rhythmProgramRequiresPurchase(programSlug: string): boolean {
  const e = getRhythmProgramEntitlement(programSlug)
  return Boolean(e.stripePriceId)
}

export function canAccessRhythmProgram(
  programSlug: string,
  opts: { hasPurchased: (priceId: string) => boolean; hasSubscription: () => boolean }
): boolean {
  const e = getRhythmProgramEntitlement(programSlug)
  if (!e.stripePriceId) return true
  if (e.grantWithPro && opts.hasSubscription()) return true
  return opts.hasPurchased(e.stripePriceId)
}

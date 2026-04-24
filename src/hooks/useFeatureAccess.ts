'use client'

import { useAuth } from './useAuth'
import {
  FEATURE_CATALOG,
  DEFAULT_ENTITLEMENT,
  isAdminBypassActive,
  isPlusPlan,
  type FeatureKey,
  type UserEntitlement,
} from '@/lib/entitlements'

/**
 * MASTER SWITCH. While this is `true`, every feature is free for every
 * user. The entitlement catalog, the Paywall component, the gated-content
 * UI, and this hook are all wired up — the only thing blocking gating is
 * this flag. Flip to `false` to activate gates (after Stripe is wired).
 */
const FREE_NOW = true

export type FeatureAccessResult = {
  hasAccess: boolean
  /** A string describing what the user would need: 'free' | 'plus' | `program:${id}` */
  requiredPlan: 'free' | 'plus' | `program:${string}`
  /** Human-readable reason (useful for the Paywall UI). */
  reason: string
}

/**
 * Look up a user's entitlement. For now returns the default (free plan)
 * for any signed-in user — this is where server/DB integration will plug
 * in once Stripe is live.
 */
function useEntitlement(): UserEntitlement {
  const { user } = useAuth()
  if (!user) return DEFAULT_ENTITLEMENT
  // Future: fetch from Supabase / Stripe customer → entitlement table.
  return DEFAULT_ENTITLEMENT
}

/**
 * Check whether the current user has access to the given feature.
 * Returns hasAccess + metadata useful for rendering paywall UI.
 */
export function useFeatureAccess(featureKey: FeatureKey): FeatureAccessResult {
  const entitlement = useEntitlement()
  const rule = FEATURE_CATALOG[featureKey]

  // Precompute what the user would need (this runs regardless of FREE_NOW
  // so the Paywall card can always show the right CTA when enabled).
  const requiredPlan: FeatureAccessResult['requiredPlan'] = rule.free
    ? 'free'
    : rule.requiresProgram
      ? (`program:${rule.requiresProgram}` as `program:${string}`)
      : 'plus'

  // Global kill switch — while monetization is off, everyone gets in.
  if (FREE_NOW) {
    return { hasAccess: true, requiredPlan, reason: 'Free during beta' }
  }

  // Admin override — bypass all gates for admin accounts.
  if (entitlement.isAdmin || isAdminBypassActive()) {
    return { hasAccess: true, requiredPlan, reason: 'Admin bypass' }
  }

  // Always-free features.
  if (rule.free) {
    return { hasAccess: true, requiredPlan: 'free', reason: 'Included in Free' }
  }

  // Plus subscribers get everything that requires Plus.
  if (rule.requiresPlus && isPlusPlan(entitlement.plan)) {
    return { hasAccess: true, requiredPlan: 'plus', reason: 'Included in Plus' }
  }

  // Program owners — does any of the user's owned programs match?
  if (rule.requiresProgram && entitlement.ownedPrograms.includes(rule.requiresProgram)) {
    return {
      hasAccess: true,
      requiredPlan: `program:${rule.requiresProgram}` as `program:${string}`,
      reason: 'Included in your program',
    }
  }

  // Default: blocked.
  const whatsNeeded = rule.requiresPlus && rule.requiresProgram
    ? `Plus subscription or ${rule.requiresProgram} program`
    : rule.requiresPlus
      ? 'Plus subscription'
      : rule.requiresProgram
        ? `${rule.requiresProgram} program`
        : 'upgrade'
  return {
    hasAccess: false,
    requiredPlan,
    reason: `Requires ${whatsNeeded}`,
  }
}

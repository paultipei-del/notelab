/**
 * Entitlement system — the source of truth for what each user can access.
 *
 * This file defines:
 *  1. The plan types a user can be on (free / plus / program-owner).
 *  2. The catalog of feature keys that gate components can check.
 *  3. The mapping from each feature key to its access rules.
 *
 * THIS FILE DOES NOT GATE ANYTHING YET. `useFeatureAccess` currently
 * returns `hasAccess: true` for every feature — the infrastructure is in
 * place so that, when monetization flips on, gates activate by changing
 * `FREE_NOW` in `useFeatureAccess.ts` rather than touching this file.
 */

export type PlanType = 'free' | 'plus_monthly' | 'plus_annual' | 'program_owner'

export type UserEntitlement = {
  plan: PlanType
  /** Program IDs the user owns (only used when plan === 'program_owner' or 'plus' + additional purchases). */
  ownedPrograms: string[]
  /** Is this user an admin? Admins bypass every gate. */
  isAdmin: boolean
}

/** Default entitlement for a brand-new signed-in user. */
export const DEFAULT_ENTITLEMENT: UserEntitlement = {
  plan: 'free',
  ownedPrograms: [],
  isAdmin: false,
}

/** All defined feature keys. Kept as a union so TS catches typos. */
export type FeatureKey =
  | 'learn:all'
  | 'tools:all'
  | 'flashcards:foundations'
  | 'flashcards:intermediate'
  | 'flashcards:advanced'
  | 'flashcards:application_review'
  | 'ear_training:intervals_1'
  | 'ear_training:full'
  | 'program:cm:preparatory'
  | 'program:cm:level_1'
  | 'program:cm:level_2'
  | 'program:cm:level_3_plus'
  | 'program:cm:full'
  | 'program:note_reading:level_1'
  | 'program:note_reading:level_2'
  | 'program:note_reading:level_3_plus'
  | 'program:rhythm:level_1'
  | 'program:rhythm:level_2'
  | 'program:rhythm:level_3_plus'

export type FeatureRule = {
  /** Always free — no gate ever, regardless of monetization flip. */
  free: boolean
  /** Requires Plus subscription when gating is active. */
  requiresPlus: boolean
  /** If non-null, this specific program ID grants access (alternative to Plus). */
  requiresProgram: string | null
}

/**
 * The catalog. Every feature key must be present here.
 *
 * Interpretation once gating is active:
 *  - `free: true`                        → always accessible
 *  - `requiresPlus: true`                → needs Plus, OR the named program
 *  - `requiresProgram: 'cm'` (etc.)      → accessible via that program purchase
 *  - `requiresPlus && requiresProgram`   → user needs either
 */
export const FEATURE_CATALOG: Record<FeatureKey, FeatureRule> = {
  'learn:all':                     { free: true,  requiresPlus: false, requiresProgram: null },
  'tools:all':                     { free: true,  requiresPlus: false, requiresProgram: null },

  'flashcards:foundations':        { free: true,  requiresPlus: false, requiresProgram: null },
  'flashcards:intermediate':       { free: false, requiresPlus: true,  requiresProgram: null },
  'flashcards:advanced':           { free: false, requiresPlus: true,  requiresProgram: null },
  'flashcards:application_review': { free: false, requiresPlus: true,  requiresProgram: null },

  'ear_training:intervals_1':      { free: true,  requiresPlus: false, requiresProgram: null },
  'ear_training:full':             { free: false, requiresPlus: true,  requiresProgram: null },

  // CM: only the Preparatory level is free. Every numbered level (L1+) is
  // gated behind Plus or the CM program purchase.
  'program:cm:preparatory':        { free: true,  requiresPlus: false, requiresProgram: null },
  'program:cm:level_1':            { free: false, requiresPlus: true,  requiresProgram: 'cm' },
  'program:cm:level_2':            { free: false, requiresPlus: true,  requiresProgram: 'cm' },
  'program:cm:level_3_plus':       { free: false, requiresPlus: true,  requiresProgram: 'cm' },
  'program:cm:full':               { free: false, requiresPlus: true,  requiresProgram: 'cm' },

  'program:note_reading:level_1':      { free: true,  requiresPlus: false, requiresProgram: null },
  'program:note_reading:level_2':      { free: true,  requiresPlus: false, requiresProgram: null },
  'program:note_reading:level_3_plus': { free: false, requiresPlus: true,  requiresProgram: 'note_reading' },

  'program:rhythm:level_1':        { free: true,  requiresPlus: false, requiresProgram: null },
  'program:rhythm:level_2':        { free: true,  requiresPlus: false, requiresProgram: null },
  'program:rhythm:level_3_plus':   { free: false, requiresPlus: true,  requiresProgram: 'rhythm' },
}

export function isPlusPlan(plan: PlanType): boolean {
  return plan === 'plus_monthly' || plan === 'plus_annual'
}

/**
 * Admin override. If this environment variable is truthy, all gates
 * open for every user — used during development and for admin accounts.
 * The check runs on both server and client (NEXT_PUBLIC_).
 */
export function isAdminBypassActive(): boolean {
  if (typeof process === 'undefined') return false
  return process.env.NEXT_PUBLIC_PAYWALL_ADMIN_BYPASS === '1'
}

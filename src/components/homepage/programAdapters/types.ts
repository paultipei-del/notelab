/**
 * Uniform shape that ProgramCard / ProgramHero render. Each per-program
 * adapter loads that program's progress store and translates its native
 * shape into this. The rendering components never import a program-
 * specific module directly — heterogeneity stops at the adapter layer.
 */

export type ProgramHeroModuleStatus = 'done' | 'next' | 'future'

export interface ProgramHeroModule {
  id: string
  title: string
  href: string
  status: ProgramHeroModuleStatus
  /**
   * Hand-wavy minutes estimate for the next module only. Per-program
   * constant in the adapter; not shown on done/future rows. Undefined
   * everywhere except the next-up module.
   */
  estMinutes?: number
}

/**
 * Compact tile metadata used by the State 1 (new user) hero. Pure
 * presentation — no dependence on user progress.
 */
export interface ProgramTileMeta {
  /** Stable id (kept aligned with `ProgramHeroData.programId` when
   *  the same program also has a hero adapter). Drives the binding hash
   *  for the colored left border. */
  programId: string
  /** Small-caps eyebrow above the title, e.g. "Curriculum". */
  eyebrow: string
  /** Tile title, e.g. "Certificate of Merit". */
  title: string
  /** One- or two-sentence italic body. */
  blurb: string
  /** Right-aligned meta line, e.g. "10 levels · ~6 months". */
  meta: string
  /** Click target — each adapter's existing program detail route. */
  href: string
  /** Optional explicit border color (overrides the binding hash). */
  borderColor?: string
}

export interface ProgramHeroData {
  /** Stable id used for the binding-color hash on the card stripe. */
  programId: string
  /** Card title, e.g. "Certificate of Merit · Level 5". */
  title: string
  /**
   * Italic subtitle below the title. Empty string collapses cleanly
   * (the row isn't rendered when empty). Adapters supply only when
   * they have meaningful real data; the spec's "May exam · 14 weeks
   * remaining" was illustrative, not literal.
   */
  subtitle: string
  /** Total module count and how many are done. */
  totalModules: number
  doneCount: number
  /** Whole-number percent (0–100). */
  pct: number
  /** Ordered modules. Up to N rendered depending on density. */
  modules: ProgramHeroModule[]
  /** The first non-done module, if any. Drives the Continue CTA. */
  next: ProgramHeroModule | null
  /** Highest session timestamp across this program's progress entries. */
  lastTouched: number
}

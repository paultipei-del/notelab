/**
 * Display titles for `program_slug` on `rhythm_exercises` — each slug is a **collection**
 * (e.g. Fundamentals, Syncopation). Add a row here when you introduce a new `program_slug`.
 * Order of collections in the library is `program_sort` (then slug) from the DB.
 */
export const RHYTHM_PROGRAM_LABELS: Record<string, string> = {
  core: 'Fundamentals',
}

export function rhythmProgramTitle(slug: string): string {
  return RHYTHM_PROGRAM_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

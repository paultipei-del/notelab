/** Display titles for `program_slug` values stored on rhythm exercises (optional UX polish). */
export const RHYTHM_PROGRAM_LABELS: Record<string, string> = {
  core: 'Core curriculum',
}

export function rhythmProgramTitle(slug: string): string {
  return RHYTHM_PROGRAM_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

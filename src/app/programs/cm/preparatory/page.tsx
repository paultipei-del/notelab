import { redirect } from 'next/navigation'

// Preparatory was reworked from a flashcard deck into the 13-lesson + 4-review
// hub at /programs/cm/prep. Anyone landing on the legacy URL — old bookmarks,
// search results, internal links we missed — gets redirected so they don't see
// the leftover deck-style page that the generic /programs/cm/[levelSlug] route
// would otherwise render.
export default function PreparatoryRedirect() {
  redirect('/programs/cm/prep')
}

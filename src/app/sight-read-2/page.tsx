import { redirect } from 'next/navigation'

// /sight-read-2 was a legacy duplicate; consolidated into
// /sight-reading 2026-05-13.
export default function SightRead2Redirect() {
  redirect('/sight-reading')
}

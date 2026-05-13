import { redirect } from 'next/navigation'

// /sight-read consolidated into /sight-reading 2026-05-13.
export default function SightReadRedirect() {
  redirect('/sight-reading')
}

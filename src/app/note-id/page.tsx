import { redirect } from 'next/navigation'

// /note-id consolidated into /sight-reading 2026-05-13.
// Permanent redirect; SEO surfaces and bookmarks survive.
export default function NoteIdRedirect() {
  redirect('/sight-reading')
}

import { redirect } from 'next/navigation'

// /repertoire/magrath was a standalone Magrath browser before the
// 2026-Q1 /repertoire rebuild folded the Magrath Guide into the
// main /repertoire page (gated behind a secret unlock). Redirect
// any deep links to the new canonical hub.
export default function MagrathRedirect() {
  redirect('/repertoire')
}

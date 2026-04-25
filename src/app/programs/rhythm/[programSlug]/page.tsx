import { redirect } from 'next/navigation'

interface Props { params: Promise<{ programSlug: string }> }

// Per-program landing pages were collapsed into the consolidated
// /programs/rhythm list. Redirect to the relevant section anchor; the
// consolidated page picks up the hash and runs a brief fade highlight.
export default async function RhythmProgramRedirect({ params }: Props) {
  const { programSlug } = await params
  redirect(`/programs/rhythm#${programSlug}`)
}

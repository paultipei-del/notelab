'use client'

import { usePathname } from 'next/navigation'
import ParticleCanvas from './ParticleCanvas'

// Suppress the background particle canvas on all /programs pages —
// the fixed canvas creates visual artifacts behind scrollable program content.
export default function ParticleCanvasConditional() {
  const pathname = usePathname()
  if (pathname.startsWith('/programs')) return null
  return <ParticleCanvas />
}

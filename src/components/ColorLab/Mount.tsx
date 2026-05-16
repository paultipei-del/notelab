'use client'

/**
 * Client-side wrapper that lazy-loads ColorLab only when the env gate is
 * satisfied. In production builds with no `?colorlab=1` flag, this renders
 * null and the ColorLab chunk is never fetched. In development the chunk
 * loads on first mount.
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ColorLab = dynamic(() => import('./index'), { ssr: false })

export default function ColorLabMount() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const flag = params.get('colorlab') === '1'
    const isDev = process.env.NODE_ENV === 'development'
    setEnabled(flag || isDev)
  }, [])

  if (!enabled) return null
  return <ColorLab />
}

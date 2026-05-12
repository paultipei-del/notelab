'use client'

import Link from 'next/link'
import type { Tool } from '@/lib/toolsCatalog'

interface RefBookProps {
  tool: Tool
  /** Which spine gradient to use. */
  spine: 'light' | 'dark'
}

/**
 * Single "book" inside the reference bookshelf — coloured spine on
 * the left, content on the right. The two books in the reference
 * section use slightly different browns so they read as distinct
 * volumes rather than a duplicate pair.
 */
export default function RefBook({ tool, spine }: RefBookProps) {
  return (
    <Link href={tool.href} className="nl-tool-refbook">
      <span className={`nl-tool-refbook__spine is-${spine}`} aria-hidden />
      <div className="nl-tool-refbook__body">
        <span
          className={`nl-tool-refbook__pill is-${tool.status === 'pro' ? 'pro' : 'free'}`}
        >
          {tool.status === 'pro' ? 'Pro' : 'Free'}
        </span>
        <h3 className="nl-tool-refbook__title">{tool.name}</h3>
        <p className="nl-tool-refbook__pitch">{tool.pitch}</p>
        <span className="nl-tool-refbook__cta">
          Browse
          <span className="nl-tool-refbook__cta-arrow">→</span>
        </span>
      </div>
    </Link>
  )
}

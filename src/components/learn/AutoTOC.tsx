'use client'

import { useEffect, useState } from 'react'
import { OnThisPage } from './OnThisPage'

type Item = { id: string; label: string }

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Picks h2 elements out of the rendered MDX article and builds the
 * right-rail TOC. Runs once after mount: assigns missing ids (so anchor
 * links + scroll-spy work) and hands the list to OnThisPage.
 */
export function AutoTOC({ containerSelector }: { containerSelector: string }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return
    const hs = Array.from(container.querySelectorAll('h2'))
    const seen = new Set<string>()
    const next: Item[] = []
    for (const h of hs) {
      const text = h.textContent?.trim() ?? ''
      if (!text) continue
      let id = h.id
      if (!id) {
        id = slugify(text) || `section-${next.length + 1}`
        let n = 2
        while (seen.has(id)) {
          id = `${slugify(text)}-${n++}`
        }
        h.id = id
      }
      seen.add(id)
      next.push({ id, label: text })
    }
    setItems(next)
  }, [containerSelector])

  if (items.length === 0) return null
  return <OnThisPage items={items} />
}

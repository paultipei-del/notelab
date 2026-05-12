'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ToolsHero from '@/components/tools/ToolsHero'
import DashboardStrip from '@/components/tools/DashboardStrip'
import CategorySection from '@/components/tools/CategorySection'
import ReferenceShelf from '@/components/tools/ReferenceShelf'
import { CATEGORY_META } from '@/lib/toolsCatalog'

export default function ToolsPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  if (loading || !user) {
    return <div className="nl-tool-page" />
  }

  return (
    <div className="nl-tool-page">
      <div className="nl-tool-wrap">
        <ToolsHero />
        <DashboardStrip />
        {CATEGORY_META.map(cat => (
          <CategorySection key={cat.id} category={cat} />
        ))}
        <ReferenceShelf />
      </div>
    </div>
  )
}

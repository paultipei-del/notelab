'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ToolsHub from '@/components/ToolsHub'

export default function ToolsPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
        <ToolsHub headingVariant="page" />
      </div>
    </div>
  )
}

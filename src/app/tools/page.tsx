'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ToolsHub from '@/components/ToolsHub'

export default function ToolsPage() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access=granted'))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
        <ToolsHub headingVariant="page" />
      </div>
    </div>
  )
}

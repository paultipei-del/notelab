import { Suspense } from 'react'
import SuccessContent from './SuccessContent'

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#2C2A27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#9E9A92' }}>Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

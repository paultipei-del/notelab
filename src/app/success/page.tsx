import { Suspense } from 'react'
import SuccessContent from './SuccessContent'

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#2C2A27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#C4C0B8' }}>Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

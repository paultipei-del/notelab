'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ADMIN_EMAILS = ['paul@paulvoiatipei.com', 'paulvoia@gmail.com', 'paultipei@gmail.com']

interface User {
  id: string; email: string; created_at: string
  last_sign_in_at: string; email_confirmed_at: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [sendInvite, setSendInvite] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{type:'success'|'error',text:string}|null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/'); return }
    if (!ADMIN_EMAILS.includes(user.email ?? '')) { router.push('/'); return }
  }, [loading, user])

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email ?? '')) fetchUsers()
  }, [user])

  async function fetchUsers() {
    setUsersLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (data.users) setUsers(data.users.sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    setUsersLoading(false)
  }

  async function createUser() {
    if (!newEmail) return
    setCreating(true); setMessage(null)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword || undefined, sendInvite }),
    })
    const data = await res.json()
    if (data.error) {
      setMessage({ type: 'error', text: data.error })
    } else {
      setMessage({ type: 'success', text: `${sendInvite ? 'Invite sent' : 'Account created'} for ${newEmail}` })
      setNewEmail(''); setNewPassword(''); fetchUsers()
    }
    setCreating(false)
  }

  const filtered = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{padding:'40px',fontFamily:'sans-serif'}}>Loading auth… {user?.email}</div>
  if (!user) return <div style={{padding:'40px',fontFamily:'sans-serif'}}>No user</div>
  if (!ADMIN_EMAILS.includes(user.email ?? '')) return <div style={{padding:'40px',fontFamily:'sans-serif'}}>Access denied: {user.email}</div>

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#C4C0B8', marginBottom: '6px' }}>Admin</p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#F7F4EF' }}>User Management</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/admin/rhythm" style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', border: '1px solid #484542', borderRadius: '8px', padding: '8px 16px', textDecoration: 'none' }}>Rhythm Library →</a>
            <a href="/admin/rhythm/generate" style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', border: '1px solid #484542', borderRadius: '8px', padding: '8px 16px', textDecoration: 'none' }}>Rhythm Generator →</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Last 7 Days', value: users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length },
            { label: 'Confirmed', value: users.filter(u => u.email_confirmed_at).length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '24px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', color: '#C4C0B8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{label}</p>
              <p style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 300, color: '#F7F4EF', lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '28px', marginBottom: '24px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#C4C0B8', marginBottom: '20px' }}>Create Account</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address"
              style={{ flex: 2, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #484542', fontFamily: F, fontSize: '13px', outline: 'none' }} />
            {!sendInvite && (
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password (optional)" type="password"
                style={{ flex: 2, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #484542', fontFamily: F, fontSize: '13px', outline: 'none' }} />
            )}
            <button onClick={createUser} disabled={creating || !newEmail}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#1A1A18', color: 'white', fontFamily: F, fontSize: '13px', cursor: creating || !newEmail ? 'not-allowed' : 'pointer', opacity: creating || !newEmail ? 0.5 : 1 }}>
              {creating ? 'Creating…' : sendInvite ? 'Send Invite' : 'Create Account'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[{value: true, label: 'Send email invite'}, {value: false, label: 'Create with password'}].map(opt => (
              <label key={String(opt.value)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8' }}>
                <input type="radio" checked={sendInvite === opt.value} onChange={() => setSendInvite(opt.value)} style={{ accentColor: '#1A1A18' }} />
                {opt.label}
              </label>
            ))}
          </div>
          {message && <p style={{ marginTop: '12px', fontFamily: F, fontSize: '13px', color: message.type === 'success' ? '#4CAF50' : '#E53935' }}>{message.text}</p>}
        </div>

        <div style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#C4C0B8' }}>All Users ({users.length})</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #484542', fontFamily: F, fontSize: '12px', outline: 'none', width: '180px' }} />
          </div>
          {usersLoading ? (
            <p style={{ fontFamily: F, fontSize: '13px', color: '#C4C0B8' }}>Loading…</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                  {['Email','Signed Up','Last Sign In','Confirmed'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#C4C0B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #2C2A27' }}>
                    <td style={{ padding: '10px 12px', fontFamily: F, fontSize: '13px', color: '#F7F4EF' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', fontFamily: F, fontSize: '12px', color: '#C4C0B8' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px', fontFamily: F, fontSize: '12px', color: '#C4C0B8' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: F, fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: u.email_confirmed_at ? '#E8F5E9' : '#FFF8E1', color: u.email_confirmed_at ? '#4CAF50' : '#F57F17' }}>
                        {u.email_confirmed_at ? '✓ Yes' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Deck, Card, DeckTag } from '@/lib/types'
import { addCard, updateCard, deleteCard, updateDeck, deleteDeck } from "@/lib/userDecks"

interface DeckEditorProps {
  userId: string | null
  deck: Deck
  onUpdate: (deck: Deck) => void
  onDelete: (deckId: string) => void
  onClose: () => void
}

type EntryMode = 'one' | 'list' | 'bulk'

const TAG_OPTIONS: { value: DeckTag; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'cm', label: 'CM' },
  { value: 'theory', label: 'Theory' },
  { value: 'repertoire', label: 'Repertoire' },
]

const s = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(26,26,24,0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  drawer: {
    background: '#F2EDDF',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px 20px',
    borderBottom: '1px solid #DDD8CA',
    background: '#F2EDDF',
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px 32px',
  },
  input: {
    width: '100%',
    background: '#FDFAF3',
    border: '1px solid #DDD8CA',
    borderRadius: '8px',
    padding: '10px 14px',
    fontFamily: 'var(--font-jost), sans-serif',
    fontSize: 'var(--nl-text-ui)',
    fontWeight: 400,
    color: '#2A2318',
    outline: 'none',
  },
  label: {
    fontSize: 'var(--nl-text-compact)',
    fontWeight: 400,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7A7060',
    marginBottom: '6px',
    display: 'block',
  },
  btn: (variant: 'primary' | 'ghost' | 'danger') => ({
    padding: '10px 20px',
    borderRadius: '8px',
    fontFamily: 'var(--font-jost), sans-serif',
    fontSize: 'var(--nl-text-meta)',
    fontWeight: 400,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: variant === 'primary' ? 'none' : '1px solid',
    background: variant === 'primary' ? '#1A1A18' : variant === 'danger' ? '#FCEBEB' : 'transparent',
    color: variant === 'primary' ? 'white' : variant === 'danger' ? '#A32D2D' : '#2C2C2A',
    borderColor: variant === 'danger' ? '#F09595' : '#DDD8CA',
  }),
}

export default function DeckEditor({ deck, onUpdate, onDelete, onClose, userId }: DeckEditorProps) {
  const [localDeck, setLocalDeck] = useState<Deck>(deck)
  const [entryMode, setEntryMode] = useState<EntryMode>('list')
  const [editingCard, setEditingCard] = useState<number | null>(null)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(localDeck.title)
  const [descVal, setDescVal] = useState(localDeck.description)

  function syncDeck(updated: Deck) {
    setLocalDeck(updated)
    onUpdate(updated)
  }

  // ── Deck metadata ──
  function saveMeta() {
    const updates = { title: titleVal, description: descVal }
    updateDeck(localDeck.id, updates, userId)
    syncDeck({ ...localDeck, ...updates })
    setEditingTitle(false)
  }

  function handleTagChange(tag: DeckTag) {
    updateDeck(localDeck.id, { tag }, userId)
    syncDeck({ ...localDeck, tag })
  }

  // ── Add card (one at a time) ──
async function handleAddOne() {
  if (!newFront.trim() || !newBack.trim()) return
  const card = await addCard(localDeck.id, { front: newFront.trim(), back: newBack.trim(), type: 'text' }, userId)
  syncDeck({ ...localDeck, cards: [...localDeck.cards, card] })
  setNewFront('')
  setNewBack('')
}
  // ── Bulk add ──
async function handleBulkAdd() {
  const lines = bulkText.trim().split('\n').filter(l => l.includes('|'))
  const newCards: Card[] = []
  const updatedDeck = { ...localDeck }

  for (const line of lines) {
    const [front, back] = line.split('|').map(s => s.trim())
    if (front && back) {
      const card = await addCard(localDeck.id, { front, back, type: 'text' }, userId)
      newCards.push(card)
    }
  }

  syncDeck({ ...updatedDeck, cards: [...updatedDeck.cards, ...newCards] })
  setBulkText('')
}

  // ── Edit card ──
  function handleUpdateCard(cardId: number, front: string, back: string) {
    updateCard(localDeck.id, cardId, { front, back }, userId)
    syncDeck({
      ...localDeck,
      cards: localDeck.cards.map(c => c.id === cardId ? { ...c, front, back } : c)
    })
    setEditingCard(null)
  }

  // ── Delete card ──
  function handleDeleteCard(cardId: number) {
    deleteCard(localDeck.id, cardId, userId)
    syncDeck({ ...localDeck, cards: localDeck.cards.filter(c => c.id !== cardId) })
  }

  // ── Delete deck ──
  function handleDeleteDeck() {
    deleteDeck(localDeck.id, userId)
    onDelete(localDeck.id)
    onClose()
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.drawer}>

        {/* Header */}
        <div style={s.drawerHeader}>
          <div style={{ flex: 1 }}>
            {editingTitle ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  style={{ ...s.input, fontSize: '18px', fontFamily: 'var(--font-cormorant), serif' }}
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveMeta()}
                  autoFocus
                />
                <button style={s.btn('primary')} onClick={saveMeta}>Save</button>
                <button style={s.btn('ghost')} onClick={() => setEditingTitle(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '24px', color: '#2A2318' }}>
                  {localDeck.title}
                </h2>
                <button
                  onClick={() => setEditingTitle(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--nl-text-compact)', color: '#7A7060', padding: '2px 8px' }}
                >
                  Edit
                </button>
              </div>
            )}

            {/* Description */}
            {!editingTitle && (
              <input
                style={{ ...s.input, marginTop: '6px', fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}
                value={descVal}
                onChange={e => setDescVal(e.target.value)}
                onBlur={() => { updateDeck(localDeck.id, { description: descVal }, userId); syncDeck({ ...localDeck, description: descVal }) }}
                placeholder="Description…"
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }}>
            {/* Tag selector */}
            <select
              value={localDeck.tag}
              onChange={e => handleTagChange(e.target.value as DeckTag)}
              style={{ ...s.input, width: 'auto', cursor: 'pointer' }}
            >
              {TAG_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {!showDeleteConfirm ? (
              <button style={s.btn('danger')} onClick={() => setShowDeleteConfirm(true)}>
                Delete Deck
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--nl-text-meta)', color: '#A32D2D' }}>Are you sure?</span>
                <button style={s.btn('danger')} onClick={handleDeleteDeck}>Yes, delete</button>
                <button style={s.btn('ghost')} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            )}

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7A7060', padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={s.drawerBody}>

          {/* Entry mode tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {([['list', 'Card List'], ['one', 'Add One'], ['bulk', 'Bulk Import']] as [EntryMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setEntryMode(mode)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${entryMode === mode ? '#1A1A18' : '#DDD8CA'}`,
                  background: entryMode === mode ? '#1A1A18' : 'transparent',
                  color: entryMode === mode ? 'white' : '#7A7060',
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 'var(--nl-text-compact)',
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', alignSelf: 'center' }}>
              {localDeck.cards.length} card{localDeck.cards.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ── LIST MODE ── */}
          {entryMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {localDeck.cards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#7A7060', fontSize: 'var(--nl-text-ui)', fontWeight: 400 }}>
                  No cards yet. Switch to "Add One" or "Bulk Import" to get started.
                </div>
              )}
              {localDeck.cards.map((card, i) => (
                <CardRow
                  key={card.id}
                  card={card}
                  index={i}
                  isEditing={editingCard === card.id}
                  onEdit={() => setEditingCard(card.id)}
                  onSave={(front, back) => handleUpdateCard(card.id, front, back)}
                  onCancel={() => setEditingCard(null)}
                  onDelete={() => handleDeleteCard(card.id)}
                />
              ))}
            </div>
          )}

          {/* ── ONE AT A TIME ── */}
          {entryMode === 'one' && (
            <div style={{ maxWidth: '560px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={s.label}>Front</label>
                <input
                  style={s.input}
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="Term, symbol, or question…"
                  onKeyDown={e => e.key === 'Tab' && (e.preventDefault())}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={s.label}>Back</label>
                <textarea
                  style={{ ...s.input, minHeight: '80px', resize: 'vertical' as const, lineHeight: 1.6 }}
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="Definition or answer…"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddOne()
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button style={s.btn('primary')} onClick={handleAddOne}>
                  Add Card
                </button>
                <span style={{ fontSize: 'var(--nl-text-compact)', color: '#7A7060', fontWeight: 400 }}>
                  or Cmd+Enter
                </span>
              </div>

              {/* Recently added preview */}
              {localDeck.cards.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <label style={s.label}>Recently Added</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[...localDeck.cards].reverse().slice(0, 5).map(card => (
                      <div key={card.id} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: '#FDFAF3', borderRadius: '8px', border: '1px solid #DDD8CA', fontSize: 'var(--nl-text-meta)', fontWeight: 400 }}>
                        <span style={{ flex: 1, color: '#2A2318' }}>{card.front}</span>
                        <span style={{ color: '#DDD8CA' }}>→</span>
                        <span style={{ flex: 2, color: '#7A7060' }}>{card.back}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── BULK IMPORT ── */}
          {entryMode === 'bulk' && (
            <div style={{ maxWidth: '640px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label style={s.label}>Paste cards — one per line, front | back</label>
                <span style={{ fontSize: 'var(--nl-text-compact)', color: '#7A7060', fontWeight: 400 }}>separated by |</span>
              </div>
              <textarea
                style={{ ...s.input, minHeight: '240px', resize: 'vertical' as const, lineHeight: 1.8, fontFamily: 'var(--font-jost), sans-serif' }}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={`pp | Pianissimo — very soft\nff | Fortissimo — very loud\nsfz | Sforzando — sudden accent`}
              />
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button style={s.btn('primary')} onClick={handleBulkAdd}>
                  Import {bulkText.trim().split('\n').filter(l => l.includes('|')).length} Cards
                </button>
                <button style={s.btn('ghost')} onClick={() => setBulkText('')}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card row component ──
function CardRow({ card, index, isEditing, onEdit, onSave, onCancel, onDelete }: {
  card: Card
  index: number
  isEditing: boolean
  onEdit: () => void
  onSave: (front: string, back: string) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)

  if (isEditing) {
    return (
      <div style={{ background: '#FDFAF3', border: '1.5px solid #B5402A', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', fontWeight: 400, minWidth: '20px', paddingTop: '10px' }}>{index + 1}</span>
        <input
          style={{ flex: 1, background: '#F2EDDF', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '8px 12px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 400, outline: 'none' }}
          value={front}
          onChange={e => setFront(e.target.value)}
          autoFocus
        />
        <input
          style={{ flex: 2, background: '#F2EDDF', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '8px 12px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-ui)', fontWeight: 400, outline: 'none' }}
          value={back}
          onChange={e => setBack(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSave(front, back)}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onSave(front, back)} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: 'var(--nl-text-compact)', cursor: 'pointer' }}>Save</button>
          <button onClick={onCancel} style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '8px 14px', fontSize: 'var(--nl-text-compact)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#7A7060')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#DDD8CA')}
      onClick={onEdit}
    >
      <span style={{ fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', fontWeight: 400, minWidth: '20px' }}>{index + 1}</span>
      <span style={{ flex: 1, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#2A2318' }}>{card.front}</span>
      <span style={{ color: '#DDD8CA', fontSize: 'var(--nl-text-compact)' }}>→</span>
      <span style={{ flex: 2, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>{card.back}</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DDD8CA', fontSize: 'var(--nl-text-base)', padding: '0 4px', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

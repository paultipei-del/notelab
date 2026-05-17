'use client'

/**
 * ColorLab — dev-only in-page color picker.
 *
 * Gated by NODE_ENV === 'development' OR ?colorlab=1 in the URL. Renders
 * a floating panel that lets you pick any element on the page or edit
 * any --token at :root, applies the changes via a single injected
 * <style id="colorlab-overrides"> element, and exports the result as
 * JSON or CSS for handoff. State persists in localStorage; nothing
 * touches the server or the database.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'colorlab:overrides'
const STYLE_TAG_ID = 'colorlab-overrides'
const PANEL_DATA_ATTR = 'data-colorlab-chrome'

type ElementProps = {
  background?: string
  color?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
}

type ElementOverride = {
  id: string
  selector: string
  label: string
  props: ElementProps
  /** Computed-style snapshot captured the first time this element was
   *  picked. Used to power the "was:" readout + per-property revert. */
  originals?: ElementProps
  /** Raw rgba/rgb strings keyed by prop, so the text input can show
   *  the canonical computed value (with alpha) even though the swatch
   *  is hex-only. */
  liveStrings?: Partial<Record<keyof ElementProps, string>>
}

type State = {
  elementOverrides: Record<string, ElementOverride>
  tokenOverrides: Record<string, string>
  history: string[]
}

const emptyState: State = {
  elementOverrides: {},
  tokenOverrides: {},
  history: [],
}

function loadState(): State {
  if (typeof window === 'undefined') return emptyState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw)
    return { ...emptyState, ...parsed }
  } catch {
    return emptyState
  }
}

function saveState(state: State) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function shortId() {
  return Math.random().toString(36).slice(2, 10)
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return '#ffffff'
  const r = parseInt(m[1]).toString(16).padStart(2, '0')
  const g = parseInt(m[2]).toString(16).padStart(2, '0')
  const b = parseInt(m[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

function extractAlpha(rgb: string): number | null {
  const m = rgb.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
  return m ? parseFloat(m[1]) : null
}

/** Swap the rgb portion of an rgba string with a new hex, preserving alpha.
 *  If the source has no alpha, returns the hex (or rgb string). */
function swapHexInRgba(source: string | undefined, newHex: string): string {
  const alpha = source ? extractAlpha(source) : null
  if (alpha === null || alpha >= 1) return newHex
  const r = parseInt(newHex.slice(1, 3), 16)
  const g = parseInt(newHex.slice(3, 5), 16)
  const b = parseInt(newHex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function isTransparent(v: string | undefined): boolean {
  if (!v) return true
  if (v === 'transparent') return true
  const a = extractAlpha(v)
  return a === 0
}

/** Read the element's current computed style and return a normalized
 *  ElementProps + raw string map suitable for seeding overrides + the
 *  "was:" readouts. */
function captureComputedStyles(el: Element): { props: ElementProps; strings: Partial<Record<keyof ElementProps, string>> } {
  const cs = window.getComputedStyle(el)
  const strings: Partial<Record<keyof ElementProps, string>> = {}
  const props: ElementProps = {}

  const bg = cs.backgroundColor
  if (!isTransparent(bg)) {
    props.background = bg
    strings.background = bg
  }

  const color = cs.color
  if (color) {
    props.color = color
    strings.color = color
  }

  const bw = parseFloat(cs.borderTopWidth || '0')
  const bs = cs.borderTopStyle
  if (bw > 0 && bs && bs !== 'none') {
    props.borderColor = cs.borderTopColor
    strings.borderColor = cs.borderTopColor
    props.borderWidth = Math.round(bw)
  }

  const br = parseFloat(cs.borderTopLeftRadius || '0')
  if (br > 0) {
    props.borderRadius = Math.round(br)
  }

  const op = parseFloat(cs.opacity || '1')
  if (op < 1) {
    props.opacity = op
  }

  return { props, strings }
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return cls.length ? `<${tag} class="${cls.join(' ')}">` : `<${tag}>`
}

function buildSelector(el: Element): string {
  // Prefer a stable selector based on classes; fall back to nth-child path.
  const classList = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)
  if (classList.length) {
    const sel = '.' + classList.join('.')
    if (document.querySelectorAll(sel).length === 1) return sel
  }
  if (el.id) return `#${el.id}`
  // nth-child path from body
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur !== document.body && cur.parentElement) {
    const parent: HTMLElement = cur.parentElement
    const idx = Array.from(parent.children).indexOf(cur) + 1
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx})`)
    cur = parent
  }
  return parts.join(' > ') || el.tagName.toLowerCase()
}

function isInPanel(el: Element | null): boolean {
  while (el) {
    if (el.hasAttribute && el.hasAttribute(PANEL_DATA_ATTR)) return true
    el = el.parentElement
  }
  return false
}

function readTokens(): Array<{ name: string; value: string }> {
  if (typeof window === 'undefined') return []
  const style = getComputedStyle(document.documentElement)
  const tokens: Array<{ name: string; value: string }> = []
  // CSSStyleDeclaration exposes custom props only via item()/length
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i)
    if (name && name.startsWith('--')) {
      tokens.push({ name, value: style.getPropertyValue(name).trim() })
    }
  }
  // Some browsers don't enumerate custom props on the computed style of html
  // when defined elsewhere. Walk the stylesheets as a fallback.
  if (tokens.length === 0) {
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList
        try { rules = sheet.cssRules } catch { continue }
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (let i = 0; i < rule.style.length; i++) {
              const name = rule.style.item(i)
              if (name.startsWith('--')) {
                tokens.push({ name, value: rule.style.getPropertyValue(name).trim() })
              }
            }
          }
        }
      }
    } catch {}
  }
  // Dedupe by name (last wins).
  const map = new Map<string, string>()
  tokens.forEach(t => map.set(t.name, t.value))
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))
}

function buildCSS(state: State): string {
  const parts: string[] = []
  const tokenEntries = Object.entries(state.tokenOverrides)
  if (tokenEntries.length) {
    parts.push(':root {')
    for (const [name, value] of tokenEntries) {
      parts.push(`  ${name}: ${value} !important;`)
    }
    parts.push('}')
  }
  for (const ov of Object.values(state.elementOverrides)) {
    const sel = `[data-colorlab-id="${ov.id}"]`
    const lines: string[] = []
    if (ov.props.background !== undefined) lines.push(`  background: ${ov.props.background} !important;`)
    if (ov.props.color !== undefined) lines.push(`  color: ${ov.props.color} !important;`)
    if (ov.props.borderColor !== undefined) lines.push(`  border-color: ${ov.props.borderColor} !important;`)
    if (ov.props.borderWidth !== undefined) lines.push(`  border-width: ${ov.props.borderWidth}px !important;`)
    if (ov.props.borderRadius !== undefined) lines.push(`  border-radius: ${ov.props.borderRadius}px !important;`)
    if (ov.props.opacity !== undefined) lines.push(`  opacity: ${ov.props.opacity} !important;`)
    if (lines.length) {
      parts.push(`${sel} {`)
      parts.push(...lines)
      parts.push('}')
    }
  }
  return parts.join('\n')
}

function buildExportCSS(state: State): string {
  const parts: string[] = []
  const tokenEntries = Object.entries(state.tokenOverrides)
  if (tokenEntries.length) {
    parts.push(':root {')
    for (const [name, value] of tokenEntries) {
      parts.push(`  ${name}: ${value};`)
    }
    parts.push('}')
  }
  for (const ov of Object.values(state.elementOverrides)) {
    const lines: string[] = []
    if (ov.props.background !== undefined) lines.push(`  background: ${ov.props.background};`)
    if (ov.props.color !== undefined) lines.push(`  color: ${ov.props.color};`)
    if (ov.props.borderColor !== undefined) lines.push(`  border-color: ${ov.props.borderColor};`)
    if (ov.props.borderWidth !== undefined) lines.push(`  border-width: ${ov.props.borderWidth}px;`)
    if (ov.props.borderRadius !== undefined) lines.push(`  border-radius: ${ov.props.borderRadius}px;`)
    if (ov.props.opacity !== undefined) lines.push(`  opacity: ${ov.props.opacity};`)
    if (lines.length) {
      parts.push(`${ov.selector} {`)
      parts.push(...lines)
      parts.push('}')
    }
  }
  return parts.join('\n')
}

function applyOverrides(state: State) {
  if (typeof document === 'undefined') return
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = buildCSS(state)
  // Make sure every override target carries its data-colorlab-id.
  // (Elements tagged in a prior session need re-tagging by selector.)
  for (const ov of Object.values(state.elementOverrides)) {
    try {
      const existing = document.querySelector(`[data-colorlab-id="${ov.id}"]`)
      if (existing) continue
      const match = document.querySelector(ov.selector)
      if (match) match.setAttribute('data-colorlab-id', ov.id)
    } catch {}
  }
}

function countUnmatched(state: State): number {
  if (typeof document === 'undefined') return 0
  let n = 0
  for (const ov of Object.values(state.elementOverrides)) {
    try {
      if (!document.querySelector(`[data-colorlab-id="${ov.id}"]`) &&
          !document.querySelector(ov.selector)) n++
    } catch { n++ }
  }
  return n
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ColorLab() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const flag = params.get('colorlab') === '1'
    const isDev = process.env.NODE_ENV === 'development'
    setEnabled(flag || isDev)
  }, [])

  if (!enabled) return null
  return <ColorLabPanel />
}

// ─────────────────────────────────────────────────────────────────────────────

const PANEL_BG = '#1c1c1c'
const PANEL_FG = '#e8e8e8'
const PANEL_MUTED = '#9a9a9a'
const PANEL_BORDER = '#2e2e2e'
const PANEL_INPUT_BG = '#252525'
const PANEL_ACCENT = '#a0381c'

function ColorLabPanel() {
  const [state, setState] = useState<State>(emptyState)
  const [hydrated, setHydrated] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visibility, setVisibility] = useState<'open' | 'minimized' | 'closed'>('open')
  const [activeTab, setActiveTab] = useState<'pick' | 'token' | 'export'>('pick')
  const [isPicking, setIsPicking] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [unmatched, setUnmatched] = useState(0)

  // Initial hydration from localStorage (after mount; avoids SSR mismatch).
  useEffect(() => {
    const s = loadState()
    setState(s)
    setHydrated(true)
    // Default panel position: bottom-right with 16px gutter.
    setPos({
      x: Math.max(0, window.innerWidth - 360 - 16),
      y: Math.max(0, window.innerHeight - 520 - 16),
    })
  }, [])

  // Apply overrides whenever state changes.
  useEffect(() => {
    if (!hydrated) return
    applyOverrides(state)
    saveState(state)
    setUnmatched(countUnmatched(state))
  }, [state, hydrated])

  // Keyboard shortcut: Cmd/Ctrl+Shift+C toggles the panel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setVisibility(v => (v === 'open' ? 'closed' : 'open'))
      }
      if (e.key === 'Escape') {
        if (isPicking) {
          setIsPicking(false)
        } else if (visibility === 'open') {
          setVisibility('closed')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPicking, visibility])

  const updateElementOverride = useCallback((id: string, patch: Partial<ElementProps>) => {
    setState(s => {
      const existing = s.elementOverrides[id]
      if (!existing) return s
      const props = { ...existing.props, ...patch }
      // Drop undefined keys so the export view doesn't render empty lines.
      for (const k of Object.keys(props) as Array<keyof ElementProps>) {
        if (props[k] === undefined) delete props[k]
      }
      return {
        ...s,
        elementOverrides: { ...s.elementOverrides, [id]: { ...existing, props } },
      }
    })
  }, [])

  const resetElement = useCallback((id: string) => {
    setState(s => {
      const next = { ...s.elementOverrides }
      delete next[id]
      return { ...s, elementOverrides: next, history: s.history.filter(h => h !== id) }
    })
    if (selectedId === id) setSelectedId(null)
    // Strip the data attribute so the element is fully reverted.
    const el = document.querySelector(`[data-colorlab-id="${id}"]`)
    if (el) el.removeAttribute('data-colorlab-id')
  }, [selectedId])

  const updateToken = useCallback((name: string, value: string) => {
    setState(s => ({ ...s, tokenOverrides: { ...s.tokenOverrides, [name]: value } }))
  }, [])

  const resetToken = useCallback((name: string) => {
    setState(s => {
      const next = { ...s.tokenOverrides }
      delete next[name]
      return { ...s, tokenOverrides: next }
    })
  }, [])

  const clearAll = useCallback(() => {
    // Strip data-colorlab-id attributes off any tagged elements.
    document.querySelectorAll('[data-colorlab-id]').forEach(el => el.removeAttribute('data-colorlab-id'))
    setState(emptyState)
    setSelectedId(null)
  }, [])

  const onElementPicked = useCallback((el: Element) => {
    // Tag with data-colorlab-id and seed an override entry.
    let id = el.getAttribute('data-colorlab-id')
    if (!id) {
      id = shortId()
      el.setAttribute('data-colorlab-id', id)
    }
    const label = describeElement(el)
    const selector = buildSelector(el)
    // Capture the element's current computed style. Used both to seed
    // overrides on a fresh pick (so inputs reflect the live state) and
    // to populate the "was:" readout on every subsequent pick.
    const { props: capturedProps, strings: capturedStrings } = captureComputedStyles(el)
    setState(s => {
      const existing = s.elementOverrides[id!]
      // First-ever pick of this element: seed props from the computed
      // style so toggles start ON for any non-default property and the
      // inputs already reflect what's rendering. originals snapshot is
      // captured once and never overwritten.
      const isFirstPick = !existing
      const entry: ElementOverride = existing || {
        id: id!,
        selector,
        label,
        props: capturedProps,
        originals: capturedProps,
        liveStrings: capturedStrings,
      }
      const next: ElementOverride = {
        ...entry,
        label,
        selector,
        // On re-pick, refresh liveStrings (raw rgba) so the text input
        // can echo the current computed value with alpha, but keep
        // originals frozen at the first capture.
        liveStrings: { ...(entry.liveStrings || {}), ...capturedStrings },
        originals: entry.originals || capturedProps,
      }
      // If existing element gets re-picked AND has no recorded originals
      // (shouldn't happen for new picks but guards old state), snapshot now.
      if (!isFirstPick && !entry.originals) next.originals = capturedProps
      const history = [id!, ...s.history.filter(h => h !== id)].slice(0, 5)
      return {
        ...s,
        elementOverrides: { ...s.elementOverrides, [id!]: next },
        history,
      }
    })
    setSelectedId(id)
    setActiveTab('pick')
  }, [])

  if (!hydrated) return null
  if (visibility === 'closed') {
    return <FloatingToggle onOpen={() => setVisibility('open')} />
  }

  const selected = selectedId ? state.elementOverrides[selectedId] : null

  return (
    <>
      {isPicking && (
        <Picker
          onPick={(el) => { onElementPicked(el); setIsPicking(false) }}
          onCancel={() => setIsPicking(false)}
        />
      )}
      <div
        {...{ [PANEL_DATA_ATTR]: '' }}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: 360,
          maxHeight: visibility === 'minimized' ? 38 : 'min(620px, calc(100vh - 32px))',
          background: PANEL_BG,
          color: PANEL_FG,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          font: '13px / 1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          zIndex: 2147483646,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header
          unmatched={unmatched}
          onMinimize={() => setVisibility(v => v === 'minimized' ? 'open' : 'minimized')}
          onClose={() => setVisibility('closed')}
          onDrag={(dx, dy) => setPos(p => ({ x: p.x + dx, y: p.y + dy }))}
        />
        {visibility === 'open' && (
          <>
            <Tabs active={activeTab} onChange={setActiveTab} />
            <div style={{ overflow: 'auto', padding: 12 }}>
              {activeTab === 'pick' && (
                <PickTab
                  isPicking={isPicking}
                  onStartPick={() => setIsPicking(true)}
                  selected={selected}
                  history={state.history.map(id => state.elementOverrides[id]).filter(Boolean)}
                  onSelectHistory={(id) => setSelectedId(id)}
                  onUpdate={updateElementOverride}
                  onReset={resetElement}
                />
              )}
              {activeTab === 'token' && (
                <TokenTab
                  overrides={state.tokenOverrides}
                  onUpdate={updateToken}
                  onReset={resetToken}
                  onResetAll={() => setState(s => ({ ...s, tokenOverrides: {} }))}
                />
              )}
              {activeTab === 'export' && (
                <ExportTab state={state} onClearAll={clearAll} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function FloatingToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      {...{ [PANEL_DATA_ATTR]: '' }}
      onClick={onOpen}
      title="Open ColorLab (Cmd/Ctrl+Shift+C)"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        border: `1px solid ${PANEL_BORDER}`,
        background: PANEL_BG,
        color: PANEL_FG,
        fontSize: 20,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 2147483646,
      }}
    >🎨</button>
  )
}

function Header({
  unmatched, onMinimize, onClose, onDrag,
}: {
  unmatched: number
  onMinimize: () => void
  onClose: () => void
  onDrag: (dx: number, dy: number) => void
}) {
  const draggingRef = useRef<{ x: number; y: number } | null>(null)
  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    draggingRef.current = { x: e.clientX, y: e.clientY }
    function onMove(me: MouseEvent) {
      if (!draggingRef.current) return
      const dx = me.clientX - draggingRef.current.x
      const dy = me.clientY - draggingRef.current.y
      draggingRef.current = { x: me.clientX, y: me.clientY }
      onDrag(dx, dy)
    }
    function onUp() {
      draggingRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#161616',
        borderBottom: `1px solid ${PANEL_BORDER}`,
        cursor: 'grab',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 600, letterSpacing: 0.2 }}>🎨 ColorLab</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {unmatched > 0 && (
          <span style={{
            fontSize: 11, color: PANEL_MUTED,
            border: `1px solid ${PANEL_BORDER}`, padding: '2px 6px', borderRadius: 10,
          }}>{unmatched} unmatched</span>
        )}
        <HeaderBtn onClick={onMinimize} title="Minimize">–</HeaderBtn>
        <HeaderBtn onClick={onClose} title="Close">×</HeaderBtn>
      </span>
    </div>
  )
}

function HeaderBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        color: PANEL_FG,
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        width: 22,
        height: 22,
        lineHeight: 1,
        padding: 0,
      }}
    >{children}</button>
  )
}

function Tabs({ active, onChange }: { active: 'pick' | 'token' | 'export'; onChange: (t: 'pick' | 'token' | 'export') => void }) {
  const tabs: Array<{ id: 'pick' | 'token' | 'export'; label: string }> = [
    { id: 'pick', label: 'Pick' },
    { id: 'token', label: 'Token' },
    { id: 'export', label: 'Export' },
  ]
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${PANEL_BORDER}`,
      flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            background: active === t.id ? PANEL_BG : '#161616',
            color: active === t.id ? PANEL_FG : PANEL_MUTED,
            border: 'none',
            borderBottom: active === t.id ? `2px solid ${PANEL_ACCENT}` : '2px solid transparent',
            padding: '8px 0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === t.id ? 600 : 400,
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Picker({ onPick, onCancel }: { onPick: (el: Element) => void; onCancel: () => void }) {
  const [hovered, setHovered] = useState<Element | null>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || isInPanel(el)) {
        setHovered(null)
        return
      }
      setHovered(el)
    }
    function onClick(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || isInPanel(el)) return
      onPick(el)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.body.style.cursor = 'crosshair'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [onPick, onCancel])

  if (!hovered) return null
  const rect = hovered.getBoundingClientRect()
  return (
    <>
      <div
        {...{ [PANEL_DATA_ATTR]: '' }}
        style={{
          position: 'fixed',
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: `2px dashed ${PANEL_ACCENT}`,
          background: 'rgba(160, 56, 28, 0.08)',
          pointerEvents: 'none',
          zIndex: 2147483645,
        }}
      />
      <div
        {...{ [PANEL_DATA_ATTR]: '' }}
        style={{
          position: 'fixed',
          left: Math.min(rect.left, window.innerWidth - 240),
          top: Math.max(rect.top - 24, 4),
          padding: '3px 6px',
          background: PANEL_BG,
          color: PANEL_FG,
          fontSize: 11,
          fontFamily: 'ui-monospace, Menlo, monospace',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 3,
          pointerEvents: 'none',
          zIndex: 2147483645,
          whiteSpace: 'nowrap',
          maxWidth: 240,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >{describeElement(hovered)}</div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function PickTab({
  isPicking, onStartPick, selected, history, onSelectHistory, onUpdate, onReset,
}: {
  isPicking: boolean
  onStartPick: () => void
  selected: ElementOverride | null
  history: ElementOverride[]
  onSelectHistory: (id: string) => void
  onUpdate: (id: string, patch: Partial<ElementProps>) => void
  onReset: (id: string) => void
}) {
  return (
    <div>
      <button
        onClick={onStartPick}
        disabled={isPicking}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: isPicking ? '#3a3a3a' : PANEL_ACCENT,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: isPicking ? 'default' : 'pointer',
          marginBottom: 14,
        }}
      >{isPicking ? 'Picking… (Esc to cancel)' : '🎯 Pick an element'}</button>

      {selected ? (
        <div>
          <div style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 11,
            color: PANEL_MUTED,
            marginBottom: 10,
            wordBreak: 'break-all',
          }}>{selected.label}</div>

          <PropColor
            label="Background"
            value={selected.props.background}
            original={selected.originals?.background}
            onChange={(v) => onUpdate(selected.id, { background: v })}
            onClear={() => onUpdate(selected.id, { background: undefined })}
            onRevert={() => onUpdate(selected.id, { background: selected.originals?.background })}
          />
          <PropColor
            label="Text"
            value={selected.props.color}
            original={selected.originals?.color}
            onChange={(v) => onUpdate(selected.id, { color: v })}
            onClear={() => onUpdate(selected.id, { color: undefined })}
            onRevert={() => onUpdate(selected.id, { color: selected.originals?.color })}
          />
          <PropColor
            label="Border"
            value={selected.props.borderColor}
            original={selected.originals?.borderColor}
            onChange={(v) => onUpdate(selected.id, { borderColor: v })}
            onClear={() => onUpdate(selected.id, { borderColor: undefined })}
            onRevert={() => onUpdate(selected.id, { borderColor: selected.originals?.borderColor })}
          />
          <PropNumber
            label="Border width"
            value={selected.props.borderWidth}
            original={selected.originals?.borderWidth}
            min={0} max={8} step={1} suffix="px"
            onChange={(v) => onUpdate(selected.id, { borderWidth: v })}
            onClear={() => onUpdate(selected.id, { borderWidth: undefined })}
            onRevert={() => onUpdate(selected.id, { borderWidth: selected.originals?.borderWidth })}
          />
          <PropNumber
            label="Border radius"
            value={selected.props.borderRadius}
            original={selected.originals?.borderRadius}
            min={0} max={40} step={1} suffix="px"
            onChange={(v) => onUpdate(selected.id, { borderRadius: v })}
            onClear={() => onUpdate(selected.id, { borderRadius: undefined })}
            onRevert={() => onUpdate(selected.id, { borderRadius: selected.originals?.borderRadius })}
          />
          <PropRange
            label="Opacity"
            value={selected.props.opacity}
            original={selected.originals?.opacity}
            onChange={(v) => onUpdate(selected.id, { opacity: v })}
            onClear={() => onUpdate(selected.id, { opacity: undefined })}
            onRevert={() => onUpdate(selected.id, { opacity: selected.originals?.opacity })}
          />

          <button
            onClick={() => onReset(selected.id)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px',
              background: 'transparent',
              color: PANEL_MUTED,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >Reset element</button>
        </div>
      ) : (
        <div style={{ color: PANEL_MUTED, fontSize: 12, marginBottom: 14 }}>
          Pick an element to edit its colors and borders.
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${PANEL_BORDER}` }}>
          <div style={{ color: PANEL_MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>History</div>
          {history.map(ov => (
            <button
              key={ov.id}
              onClick={() => onSelectHistory(ov.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                background: selected?.id === ov.id ? '#252525' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: PANEL_FG,
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 11,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: 3,
                background: ov.props.background || 'transparent',
                border: `1px solid ${PANEL_BORDER}`,
                flexShrink: 0,
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ov.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PropColor({ label, value, original, onChange, onClear, onRevert }: {
  label: string
  value: string | undefined
  original?: string
  onChange: (v: string) => void
  onClear: () => void
  onRevert?: () => void
}) {
  const enabled = value !== undefined
  return (
    <div style={{ marginBottom: 8 }}>
      <Row label={label} enabled={enabled} onToggle={() => enabled ? onClear() : onChange(original ?? '#ffffff')}>
        <input
          type="color"
          value={normalizeColor(value)}
          onChange={(e) => onChange(swapHexInRgba(value, e.target.value))}
          disabled={!enabled}
          style={{ width: 32, height: 26, border: 'none', background: 'transparent', padding: 0, cursor: enabled ? 'pointer' : 'default' }}
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={!enabled}
          placeholder="#hex or rgba()"
          style={{
            flex: 1,
            background: PANEL_INPUT_BG,
            color: PANEL_FG,
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 4,
            padding: '4px 6px',
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 11,
            minWidth: 0,
          }}
        />
      </Row>
      <WasRow original={original} canRevert={enabled && original !== undefined && value !== original} onRevert={onRevert} />
    </div>
  )
}

function WasRow({ original, canRevert, onRevert }: { original: string | number | undefined; canRevert: boolean; onRevert?: () => void }) {
  if (original === undefined) return null
  return (
    <div style={{
      marginLeft: 90, marginTop: 2,
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: 10, color: '#666',
    }}>
      <span>was: {String(original)}</span>
      {canRevert && onRevert && (
        <button onClick={onRevert} title="Revert to original"
          style={{
            background: 'transparent', border: 'none', color: PANEL_MUTED,
            fontSize: 11, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }}>↺</button>
      )}
    </div>
  )
}

function PropNumber({ label, value, original, min, max, step, suffix, onChange, onClear, onRevert }: {
  label: string
  value: number | undefined
  original?: number
  min: number; max: number; step: number; suffix: string
  onChange: (v: number) => void
  onClear: () => void
  onRevert?: () => void
}) {
  const enabled = value !== undefined
  return (
    <div style={{ marginBottom: 8 }}>
      <Row label={label} enabled={enabled} onToggle={() => enabled ? onClear() : onChange(original ?? 1)}>
        <input
          type="number"
          value={value ?? ''}
          min={min} max={max} step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={!enabled}
          style={{
            width: 70,
            background: PANEL_INPUT_BG,
            color: PANEL_FG,
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
          }}
        />
        <span style={{ color: PANEL_MUTED, fontSize: 11 }}>{suffix}</span>
      </Row>
      <WasRow original={original !== undefined ? `${original}${suffix}` : undefined}
        canRevert={enabled && original !== undefined && value !== original}
        onRevert={onRevert} />
    </div>
  )
}

function PropRange({ label, value, original, onChange, onClear, onRevert }: {
  label: string
  value: number | undefined
  original?: number
  onChange: (v: number) => void
  onClear: () => void
  onRevert?: () => void
}) {
  const enabled = value !== undefined
  return (
    <div style={{ marginBottom: 8 }}>
      <Row label={label} enabled={enabled} onToggle={() => enabled ? onClear() : onChange(original ?? 1)}>
        <input
          type="range"
          value={value ?? 1}
          min={0} max={1} step={0.05}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={!enabled}
          style={{ flex: 1, accentColor: PANEL_ACCENT }}
        />
        <span style={{ color: PANEL_MUTED, fontSize: 11, width: 36, textAlign: 'right' }}>
          {Math.round((value ?? 1) * 100)}%
        </span>
      </Row>
      <WasRow original={original !== undefined ? `${Math.round(original * 100)}%` : undefined}
        canRevert={enabled && original !== undefined && value !== original}
        onRevert={onRevert} />
    </div>
  )
}

function Row({ label, enabled, onToggle, children }: {
  label: string
  enabled: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <input type="checkbox" checked={enabled} onChange={onToggle} style={{ accentColor: PANEL_ACCENT, cursor: 'pointer' }} />
      <label
        onClick={onToggle}
        style={{ width: 76, color: enabled ? PANEL_FG : PANEL_MUTED, fontSize: 12, cursor: 'pointer' }}
      >{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function normalizeColor(v: string | undefined): string {
  if (!v) return '#ffffff'
  if (v.startsWith('#') && (v.length === 7 || v.length === 4)) return v
  // Best-effort: HTML color input only accepts hex. Strip rgba to rgb hex.
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (m) {
    const r = Number(m[1]).toString(16).padStart(2, '0')
    const g = Number(m[2]).toString(16).padStart(2, '0')
    const b = Number(m[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  return '#ffffff'
}

// ─────────────────────────────────────────────────────────────────────────────

function TokenTab({ overrides, onUpdate, onReset, onResetAll }: {
  overrides: Record<string, string>
  onUpdate: (name: string, value: string) => void
  onReset: (name: string) => void
  onResetAll: () => void
}) {
  const tokens = useMemo(() => readTokens(), [])
  const [selected, setSelected] = useState<string>('')
  const baseValue = tokens.find(t => t.name === selected)?.value ?? ''
  const overrideValue = overrides[selected]
  const currentValue = overrideValue ?? baseValue

  function setVal(v: string) {
    if (v.trim() === '' || v === baseValue) {
      onReset(selected)
    } else {
      onUpdate(selected, v)
    }
  }

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          background: PANEL_INPUT_BG,
          color: PANEL_FG,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 4,
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        <option value="">Pick a token…</option>
        {tokens.map(t => (
          <option key={t.name} value={t.name}>
            {t.name}{overrides[t.name] !== undefined ? ' ●' : ''}
          </option>
        ))}
      </select>

      {selected && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: PANEL_MUTED, fontSize: 11, width: 50 }}>Default</span>
            <code style={{ fontSize: 11, color: PANEL_MUTED, wordBreak: 'break-all' }}>{baseValue}</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <input
              type="color"
              value={normalizeColor(currentValue)}
              onChange={(e) => setVal(e.target.value)}
              style={{ width: 32, height: 26, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => setVal(e.target.value)}
              style={{
                flex: 1,
                background: PANEL_INPUT_BG,
                color: PANEL_FG,
                border: `1px solid ${PANEL_BORDER}`,
                borderRadius: 4,
                padding: '4px 6px',
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 11,
                minWidth: 0,
              }}
            />
          </div>
          {overrideValue !== undefined && (
            <button
              onClick={() => onReset(selected)}
              style={{
                width: '100%',
                padding: '6px',
                background: 'transparent',
                color: PANEL_MUTED,
                border: `1px solid ${PANEL_BORDER}`,
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >Reset token</button>
          )}
        </div>
      )}

      {Object.keys(overrides).length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${PANEL_BORDER}` }}>
          <div style={{ color: PANEL_MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
            {Object.keys(overrides).length} overrides active
          </div>
          <button
            onClick={onResetAll}
            style={{
              width: '100%',
              padding: '6px',
              background: 'transparent',
              color: PANEL_ACCENT,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >Reset all tokens</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ExportTab({ state, onClearAll }: { state: State; onClearAll: () => void }) {
  const [view, setView] = useState<'element' | 'token' | 'css'>('css')

  const payload = useMemo(() => {
    if (view === 'element') {
      return JSON.stringify(Object.values(state.elementOverrides), null, 2)
    }
    if (view === 'token') {
      return JSON.stringify(state.tokenOverrides, null, 2)
    }
    return buildExportCSS(state)
  }, [view, state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload)
    } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['element', 'token', 'css'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: '6px',
              background: view === v ? PANEL_INPUT_BG : 'transparent',
              color: view === v ? PANEL_FG : PANEL_MUTED,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >{v === 'css' ? 'CSS' : v === 'element' ? 'Elements' : 'Tokens'}</button>
        ))}
      </div>

      <textarea
        readOnly
        value={payload || '/* no overrides yet */'}
        style={{
          width: '100%',
          height: 220,
          background: PANEL_INPUT_BG,
          color: PANEL_FG,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 4,
          padding: 8,
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 11,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={copy}
          style={{
            flex: 1,
            padding: '8px',
            background: PANEL_ACCENT,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >Copy to clipboard</button>
        <button
          onClick={onClearAll}
          style={{
            flex: 1,
            padding: '8px',
            background: 'transparent',
            color: PANEL_MUTED,
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >Clear all overrides</button>
      </div>
    </div>
  )
}

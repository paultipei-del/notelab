'use client'

// TODO: temporary visual reference harness — remove after the /learn primitive
// design work is complete. Mounted at /dev/notation-reference.

import { useEffect, useRef, useState } from 'react'
import SharpsFlatsLesson from '@/components/programs/cm-prep/SharpsFlatsLesson'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import MultiNoteStaff from '@/components/cards/MultiNoteStaff'
import StaffPreview from '@/components/programs/note-reading/StaffPreview'
import { PianoKeyboard } from '@/components/programs/cm-prep/PianoKeyboard'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface SectionMeta {
  id: string
  name: string
  filePath: string
  cluster: 'A (step=6)' | 'B (step=8)' | 'C (parametric)' | 'PianoKeyboard (SVG)'
  step: string
  viewBox: string
  noteheadFontSize: string
  clefFontSize: string
  inkColor: string
  notes?: string
}

function MetaPanel({ meta }: { meta: SectionMeta }) {
  const rows: Array<[string, string]> = [
    ['Component', meta.name],
    ['File path', meta.filePath],
    ['Cluster', meta.cluster],
    ['step', meta.step],
    ['viewBox', meta.viewBox],
    ['Notehead font-size', meta.noteheadFontSize],
    ['Clef font-size', meta.clefFontSize],
    ['Ink color', meta.inkColor],
  ]
  return (
    <div style={{
      background: '#F7F4ED',
      border: '1px solid #DDD8CA',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 12,
      fontFamily: F,
      fontSize: 12,
      color: '#2A2318',
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '2px 12px 2px 0', color: '#7A7060', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{k}</td>
              <td style={{ padding: '2px 0', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{v}</td>
            </tr>
          ))}
          {meta.notes && (
            <tr>
              <td style={{ padding: '6px 12px 0 0', color: '#7A7060', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>Notes</td>
              <td style={{ padding: '6px 0 0', fontStyle: 'italic', color: '#7A7060' }}>{meta.notes}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SvgCapture({ containerRef, label }: {
  containerRef: React.RefObject<HTMLDivElement | null>
  label: string
}) {
  const [items, setItems] = useState<Array<{ key: string; html: string }>>([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Re-scan on next tick to make sure the children have mounted (esp. for
    // SharpsFlatsLesson, which lazy-renders its phase children).
    const id = window.setTimeout(() => {
      const svgs = Array.from(el.querySelectorAll('svg'))
      setItems(svgs.map((svg, i) => ({
        key: `${label}-${i}`,
        html: svg.outerHTML,
      })))
    }, 250)
    return () => window.clearTimeout(id)
  }, [containerRef, label])

  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{
        cursor: 'pointer',
        fontFamily: F,
        fontSize: 12,
        color: '#7A7060',
        fontWeight: 600,
        userSelect: 'none',
      }}>
        Rendered SVG outerHTML ({items.length})
      </summary>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <div key={item.key}>
            <div style={{ fontFamily: F, fontSize: 11, color: '#7A7060', marginBottom: 4 }}>
              SVG #{i + 1}
            </div>
            <pre style={{
              background: '#1A1A18',
              color: '#E5DFCB',
              padding: 12,
              borderRadius: 6,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              lineHeight: 1.4,
              overflow: 'auto',
              maxHeight: 360,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>{item.html}</pre>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ fontFamily: F, fontSize: 12, color: '#B5402A', margin: 0 }}>
            No SVG nodes found in this section.
          </p>
        )}
      </div>
    </details>
  )
}

function Section({ id, title, meta, children }: {
  id: string
  title: string
  meta: SectionMeta
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <section style={{ marginBottom: 60 }}>
      <h2 id={id} style={{
        fontFamily: SERIF,
        fontWeight: 300,
        fontSize: 28,
        color: '#2A2318',
        margin: '0 0 4px',
      }}>
        {title}
      </h2>
      <MetaPanel meta={meta} />
      <div style={{
        background: 'white',
        border: '0.5px solid #DDD8CA',
        borderRadius: 14,
        padding: 24,
      }}>
        <div ref={ref}>
          {children}
        </div>
      </div>
      <SvgCapture containerRef={ref} label={id} />
    </section>
  )
}

export default function NotationReferenceHarness() {
  // SharpsFlatsLesson requires onComplete + passingScore. We supply no-op
  // defaults so it mounts at the default phase ('sharps-intro'), which is
  // exactly the SharpsIntro card that wraps <PianoKeyboard mode="sharps" />.
  // The staff Cluster B is visible in later phases — to capture it, click
  // through to "Exercise 1 → Draw the sharp" inside the live page.
  const handleComplete = () => {}

  return (
    <main style={{
      minHeight: '100vh',
      background: '#FDFAF3',
      padding: '40px 16px 80px',
      fontFamily: F,
      color: '#2A2318',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <header style={{ marginBottom: 36 }}>
          <p style={{
            fontFamily: F,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#B0ACA4',
            margin: '0 0 8px',
          }}>
            Internal — visual reference harness
          </p>
          <h1 style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 40,
            color: '#2A2318',
            margin: '0 0 8px',
            letterSpacing: '0.01em',
          }}>
            Notation surfaces — current visual lineage
          </h1>
          <p style={{ fontSize: 14, color: '#7A7060', lineHeight: 1.6, margin: 0 }}>
            Each section mounts a production component and exposes its rendered SVG outerHTML
            via the disclosure below. Background is the cream <code>#FDFAF3</code> used across
            <code> /programs</code> surfaces. Open this route at desktop width (~1200px viewport).
          </p>
        </header>

        <Section
          id="section-1"
          title="Section 1 — SharpsFlatsLesson (sharps intro phase)"
          meta={{
            id: 'section-1',
            name: 'SharpsFlatsLesson + PianoKeyboard',
            filePath: 'src/components/programs/cm-prep/SharpsFlatsLesson.tsx (renders <PianoKeyboard mode="sharps" /> inside <SharpsIntro>)',
            cluster: 'B (step=8)',
            step: '8 (staff exercises) — keyboard uses its own viewBox 0 0 740 480',
            viewBox: 'PianoKeyboard: 0 0 740 480 — staff exercises (later phases): 0 0 376 ~172',
            noteheadFontSize: '60 (Bravura U+E0A2 whole notehead used as generic notehead)',
            clefFontSize: 'treble 62, bass 66',
            inkColor: '#1A1A18 (DARK constant)',
            notes: 'Default phase is "sharps-intro" — only the PianoKeyboard is visible. To capture the Cluster-B staff surface, click "Exercise 1 →" inside the lesson; the harness will auto-rescan the SVGs on each render.',
          }}
        >
          <SharpsFlatsLesson
            passingScore={0.8}
            previouslyCompleted={false}
            onComplete={handleComplete}
          />
        </Section>

        <Section
          id="section-1b"
          title="Section 1b — PianoKeyboard standalone (no lesson chrome)"
          meta={{
            id: 'section-1b',
            name: 'PianoKeyboard (mode="sharps")',
            filePath: 'src/components/programs/cm-prep/PianoKeyboard.tsx',
            cluster: 'PianoKeyboard (SVG)',
            step: 'n/a — fixed pixel layout',
            viewBox: '0 0 740 480',
            noteheadFontSize: 'n/a (no noteheads)',
            clefFontSize: 'n/a',
            inkColor: 'wood gradient + #1A1A18 + amber/blue/green per mode',
          }}
        >
          <PianoKeyboard mode="sharps" />
        </Section>

        <Section
          id="section-2"
          title="Section 2 — GrandStaffCard (F#5 treble, F2 bass)"
          meta={{
            id: 'section-2',
            name: 'GrandStaffCard',
            filePath: 'src/components/cards/GrandStaffCard.tsx',
            cluster: 'A (step=6)',
            step: '6',
            viewBox: '0 0 300 ~190 (height computed from bassTop + 8*step + 50)',
            noteheadFontSize: '46 (U+E0A4 filled notehead, dominantBaseline="central")',
            clefFontSize: 'treble 50, bass 52, brace dynamic ≈ braceHeight × 1.0 (U+E000)',
            inkColor: '#1A1A18',
            notes: 'GrandStaffCard renders one note. Two instances side by side so you see treble + accidental + ledger and bass + accidental together.',
          }}
        >
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: F, fontSize: 11, color: '#7A7060', textAlign: 'center', margin: '0 0 8px' }}>F#5</p>
              <GrandStaffCard note="F#5" />
            </div>
            <div>
              <p style={{ fontFamily: F, fontSize: 11, color: '#7A7060', textAlign: 'center', margin: '0 0 8px' }}>F2</p>
              <GrandStaffCard note="F2" />
            </div>
          </div>
        </Section>

        <Section
          id="section-3"
          title="Section 3 — MultiNoteStaff (treble, mixed)"
          meta={{
            id: 'section-3',
            name: 'MultiNoteStaff',
            filePath: 'src/components/cards/MultiNoteStaff.tsx',
            cluster: 'A (step=6)',
            step: '6',
            viewBox: '0 0 (staffLeft + clefWidth + N*52 + rightPad) × ~150',
            noteheadFontSize: '46',
            clefFontSize: 'treble 50, bass 50',
            inkColor: '#1A1A18 (default), #4CAF50 correct, #E53935 wrong, #B5402A active',
            notes: 'Notes: C5 (on staff), F#5 (sharp on staff), B5 (above staff, no ledgers needed), A6 (above staff with ledgers).',
          }}
        >
          <MultiNoteStaff
            clef="treble"
            notes={[
              { note: 'C5', status: 'pending' },
              { note: 'F#5', status: 'pending' },
              { note: 'B5', status: 'pending' },
              { note: 'A6', status: 'pending' },
            ]}
          />
        </Section>

        <Section
          id="section-4"
          title="Section 4 — StaffPreview (parametric Cluster C)"
          meta={{
            id: 'section-4',
            name: 'StaffPreview',
            filePath: 'src/components/programs/note-reading/StaffPreview.tsx',
            cluster: 'C (parametric)',
            step: 'derived from container — default scale',
            viewBox: 'computed from notes count and step',
            noteheadFontSize: 'noteFontSize prop (proportional to step)',
            clefFontSize: 'treble step×7.4, bass step×8',
            inkColor: '#6B6459 (lighter than Cluster A/B) for staff/clef; noteheads default #1A1A18',
            notes: 'Single note (G4) on grand staff with showLabels enabled so the letter caption is visible.',
          }}
        >
          <StaffPreview
            notes={['G4']}
            clef="grand"
            showLabels
          />
        </Section>

        <footer style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: '1px solid #DDD8CA',
          fontFamily: F,
          fontSize: 12,
          color: '#7A7060',
          textAlign: 'center',
        }}>
          Harness file: <code>src/app/dev/notation-reference/page.tsx</code> — delete after design work completes.
        </footer>
      </div>
    </main>
  )
}

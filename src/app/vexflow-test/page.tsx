'use client'

import { useEffect, useId } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function VexFlowTestPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'transparent', padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 300, marginBottom: 8 }}>
          VexFlow test
        </h1>
        <p style={{ fontFamily: F, fontSize: 14, color: '#7A7060', marginBottom: 32 }}>
          Sample music notation rendered by VexFlow. Each card below is one example.
        </p>

        <Example
          title="Example 1 — C major, treble clef, simple melody"
          caption="4/4 time · quarter notes + a half note"
          render={(el) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            import('vexflow').then((mod: any) => {
              const { Factory } = mod
              const factory = new Factory({ renderer: { elementId: el, width: 560, height: 180 } })
              const score = factory.EasyScore()
              const system = factory.System({ width: 540, x: 10, y: 20 })
              system.addStave({
                voices: [score.voice(
                  score.notes('C5/q, E5, G5, E5 | F5, D5, G5/h | C5/q, E5, G5/h | C5/w', { stem: 'up' }),
                  { time: '4/4' }
                )],
              }).addClef('treble').addTimeSignature('4/4')
              factory.draw()
            })
          }}
        />

        <Example
          title="Example 2 — G major, treble clef, with the key signature's F♯ in the melody"
          caption="Notice: no sharp accidental appears on the F — the key sig handles it"
          render={(el) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            import('vexflow').then((mod: any) => {
              const { Factory } = mod
              const factory = new Factory({ renderer: { elementId: el, width: 560, height: 180 } })
              const score = factory.EasyScore()
              const system = factory.System({ width: 540, x: 10, y: 20 })
              system.addStave({
                voices: [score.voice(
                  score.notes('G4/q, B4, D5, B4 | A4, F#4, A4/h | G4/q, B4, D5/h | G4/w', { stem: 'up' }),
                  { time: '4/4' }
                )],
              }).addClef('treble').addKeySignature('G').addTimeSignature('4/4')
              factory.draw()
            })
          }}
        />

        <Example
          title="Example 3 — Grand staff, F major, melody + bass line"
          caption="Both staves share the same key signature · B♭ rendered automatically"
          render={(el) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            import('vexflow').then((mod: any) => {
              const { Factory } = mod
              const factory = new Factory({ renderer: { elementId: el, width: 560, height: 260 } })
              const score = factory.EasyScore()
              const system = factory.System({ width: 540, x: 10, y: 20 })
              system.addStave({
                voices: [score.voice(
                  score.notes('F4/q, A4, C5, A4 | Bb4, A4, G4/h | F4/q, A4, C5/h | F4/w', { stem: 'up' }),
                  { time: '4/4' }
                )],
              }).addClef('treble').addKeySignature('F').addTimeSignature('4/4')
              system.addStave({
                voices: [score.voice(
                  score.notes('F3/h, C3 | F3, C3 | F3, A3 | F3/w', { stem: 'down' }),
                  { time: '4/4' }
                )],
              }).addClef('bass').addKeySignature('F').addTimeSignature('4/4')
              system.addConnector('brace')
              system.addConnector('singleLeft')
              system.addConnector('boldDoubleRight')
              factory.draw()
            })
          }}
        />

        <Example
          title="Example 4 — Mixed rhythms: eighths with beaming"
          caption="VexFlow handles stem direction and beaming automatically"
          render={(el) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            import('vexflow').then((mod: any) => {
              const { Factory } = mod
              const factory = new Factory({ renderer: { elementId: el, width: 560, height: 180 } })
              const score = factory.EasyScore()
              const system = factory.System({ width: 540, x: 10, y: 20 })
              system.addStave({
                voices: [score.voice(
                  score.notes('C5/8, D5, E5, F5, G5/q, E5 | F5/8, E5, D5, C5, B4/q, D5 | C5/w',
                    { stem: 'up' }),
                  { time: '4/4' }
                )],
              }).addClef('treble').addTimeSignature('4/4')
              factory.draw()
            })
          }}
        />

        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 300, margin: '40px 0 12px' }}>
          OpenSheetMusicDisplay — loading your MusicXML files
        </h2>
        <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 20 }}>
          Below: the three pieces you dropped in <code>public/music/prep/</code>, rendered directly from their <code>.mxl</code> files by OSMD.
        </p>

        <OsmdExample
          title="F major — No. 1"
          url="/music/prep/f-major.mxl"
        />
        <OsmdExample
          title="C major — No. 2"
          url="/music/prep/c-major.mxl"
        />
        <OsmdExample
          title="G major — No. 3"
          url="/music/prep/g-major.mxl"
        />

        <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', marginTop: 40, fontStyle: 'italic' }}>
          VexFlow ships with Bravura — the same font used elsewhere in Notelab — so the notation matches visually.
        </p>
      </div>
    </div>
  )
}

function OsmdExample({ title, url }: { title: string; url: string }) {
  const rawId = useId()
  const divId = `osmd-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  useEffect(() => {
    let cancelled = false
    import('opensheetmusicdisplay').then(({ OpenSheetMusicDisplay }) => {
      const container = document.getElementById(divId)
      if (!container || cancelled) return
      container.innerHTML = ''
      const osmd = new OpenSheetMusicDisplay(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,        // hides the instrument / part label left of the staff
        drawPartAbbreviations: false,
      })
      osmd.load(url).then(() => {
        if (!cancelled) osmd.render()
      })
    })
    return () => { cancelled = true }
  }, [divId, url])

  return (
    <div style={{
      background: 'white', border: '1px solid #E8E4DC', borderRadius: 14,
      padding: 20, marginBottom: 20,
    }}>
      <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{title}</h3>
      <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', marginBottom: 14 }}>
        Source: <code>{url}</code>
      </p>
      <div id={divId} style={{ overflowX: 'auto' }} />
    </div>
  )
}

function Example({ title, caption, render }: {
  title: string
  caption: string
  render: (elementId: string) => void
}) {
  // useId gives us a stable SSR-safe id. VexFlow rejects colons, so sanitize.
  const rawId = useId()
  const divId = `vf-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  useEffect(() => {
    render(divId)
  }, [render, divId])

  return (
    <div style={{
      background: 'white', border: '1px solid #E8E4DC', borderRadius: 14,
      padding: 20, marginBottom: 20,
    }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{title}</h2>
      <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', marginBottom: 14 }}>{caption}</p>
      <div id={divId} style={{ overflowX: 'auto' }} />
    </div>
  )
}

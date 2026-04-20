'use client'

import { useEffect, useId } from 'react'

interface ScoreFromXmlProps {
  src: string          // URL to .mxl or .musicxml file served from /public
}

// Renders a MusicXML file via OpenSheetMusicDisplay. Client-only — OSMD needs
// the DOM. We hide every text label (title, composer, part name, etc.) so the
// staff sits flush left.
export default function ScoreFromXml({ src }: ScoreFromXmlProps) {
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
        drawPartNames: false,
        drawPartAbbreviations: false,
      })
      // Stretch the final (shorter) system so each row spans the full width.
      osmd.EngravingRules.StretchLastSystemLine = true
      osmd.EngravingRules.LastSystemMaxScalingFactor = 3
      osmd.load(src).then(() => {
        if (!cancelled) osmd.render()
      })
    })
    return () => { cancelled = true }
  }, [divId, src])

  return <div id={divId} style={{ overflowX: 'auto' }} />
}

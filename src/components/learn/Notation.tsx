'use client'

import { useEffect, useId } from 'react'

type NotationProps = {
  musicXml: string        // raw MusicXML string (not a URL)
  caption?: string        // optional caption rendered below the notation
  ariaLabel?: string      // accessibility description
  zoom?: number           // OSMD zoom level, defaults to 1.0
}

/**
 * Inline-notation wrapper around OpenSheetMusicDisplay for /learn reference
 * pages. Accepts raw MusicXML (not a URL) so pages can inline small examples
 * alongside their prose. Based on the existing ScoreFromXml pattern —
 * client-only, OSMD dynamic-imported on mount.
 */
export default function Notation({ musicXml, caption, ariaLabel, zoom = 1 }: NotationProps) {
  const rawId = useId()
  const divId = `learn-notation-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  useEffect(() => {
    let cancelled = false
    let osmdInstance: import('opensheetmusicdisplay').OpenSheetMusicDisplay | null = null

    import('opensheetmusicdisplay').then(({ OpenSheetMusicDisplay }) => {
      if (cancelled) return
      const container = document.getElementById(divId)
      if (!container) return
      container.innerHTML = ''

      osmdInstance = new OpenSheetMusicDisplay(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
        drawMeasureNumbers: false,
      })
      osmdInstance.Zoom = zoom

      // OSMD's `load` accepts either a URL or a raw MusicXML string.
      osmdInstance.load(musicXml).then(() => {
        if (!cancelled && osmdInstance) osmdInstance.render()
      }).catch(() => {
        // TODO: verify rendering — if the MusicXML fails to parse, the
        // caller should either supply a simpler file or this component can
        // render a text fallback. For now, leave the container empty.
      })
    })

    return () => {
      cancelled = true
    }
  }, [divId, musicXml, zoom])

  return (
    <figure
      className="nl-notation"
      role="figure"
      aria-label={ariaLabel}
      style={{ margin: '24px 0', textAlign: 'center' }}
    >
      <div id={divId} style={{ overflowX: 'auto', width: '100%' }} />
      {caption && (
        <figcaption
          style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#7A7060',
            marginTop: '10px',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

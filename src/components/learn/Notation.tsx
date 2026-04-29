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
        // autoResize stretches the SVG to fill the container width, which
        // makes parent-level centering pointless. Turn it off so the SVG
        // renders at its natural width and the parent flex/text-align
        // centering can then place it horizontally.
        autoResize: false,
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
        if (!cancelled && osmdInstance) {
          osmdInstance.render()
          // Brute-force center: OSMD generates a wrapper div + SVG with its
          // own width/positioning. After render, measure the SVG natural
          // width, then constrain the container to that width and let
          // `margin: 0 auto` (set on the figure-level wrapper above) center it.
          const svg = container.querySelector('svg') as SVGSVGElement | null
          if (svg) {
            const w = svg.getBoundingClientRect().width
            // Strip any width OSMD applied to the inner wrapper divs and set
            // the SVG's display so margin auto works.
            container.style.width = w ? `${Math.ceil(w)}px` : container.style.width
            container.style.maxWidth = '100%'
            container.style.marginLeft = 'auto'
            container.style.marginRight = 'auto'
            // Also force the SVG itself to block + auto margin in case the
            // wrapper width approach misses anything.
            svg.style.display = 'block'
            svg.style.margin = '0 auto'
            // Some OSMD wrappers are absolutely positioned — re-flow them.
            Array.from(container.querySelectorAll('div')).forEach((d) => {
              const el = d as HTMLElement
              if (el.style.position === 'absolute') {
                el.style.position = 'static'
              }
              el.style.marginLeft = 'auto'
              el.style.marginRight = 'auto'
            })
          }
        }
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
      style={{ margin: '24px auto', textAlign: 'center' }}
    >
      {/* OSMD renders its SVG client-side and gives it block layout. The CSS
          rule below centers that SVG inside its container regardless of the
          width OSMD assigns to it. */}
      <style>{`
        .nl-notation > div > svg {
          display: block;
          margin: 0 auto;
        }
      `}</style>
      <div id={divId} style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }} />
      {caption && (
        <figcaption
          style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#7A7060',
            marginTop: '4px',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

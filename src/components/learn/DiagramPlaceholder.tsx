const F = 'var(--font-jost), sans-serif'

/**
 * Visible placeholder for `[Diagram: ...]` slots in reference-page MDX —
 * shown until custom SVG or illustrations land. Carries the diagram's
 * description as a prop so the intent is findable both in code (grep
 * "DiagramPlaceholder") and on the rendered page.
 */
export default function DiagramPlaceholder({ description }: { description: string }) {
  return (
    <figure
      role="figure"
      aria-label={`Diagram placeholder: ${description}`}
      style={{
        margin: '24px 0',
        padding: '28px 24px',
        border: '1px dashed #C9C0AC',
        borderRadius: '10px',
        background: 'rgba(253, 250, 243, 0.55)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#9A9081',
          marginBottom: '8px',
        }}
      >
        Diagram coming
      </div>
      <div
        style={{
          fontFamily: F,
          fontSize: '13px',
          fontWeight: 300,
          fontStyle: 'italic',
          color: '#7A7060',
          lineHeight: 1.6,
          maxWidth: '420px',
          margin: '0 auto',
        }}
      >
        {description}
      </div>
    </figure>
  )
}

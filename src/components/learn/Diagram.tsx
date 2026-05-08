const F = 'var(--font-jost), sans-serif'

/**
 * Renders an SVG diagram stored in /public/diagrams/ inside a figure matching
 * the surrounding /learn prose style. Caption appears below the image in a
 * muted serif — same visual weight as the existing DiagramPlaceholder caption
 * so the two components can coexist until every placeholder is replaced.
 */
export default function Diagram({
  src,
  caption,
  ariaLabel,
}: {
  src: string
  caption?: string
  ariaLabel?: string
}) {
  return (
    <figure
      role="figure"
      aria-label={ariaLabel ?? caption ?? 'Diagram'}
      style={{
        margin: '24px 0',
        padding: '20px',
        border: '1px solid #D9CFAE',
        borderRadius: '10px',
        background: 'rgba(253, 250, 243, 0.55)',
        textAlign: 'center',
      }}
    >
      <img
        src={src}
        alt={ariaLabel ?? caption ?? ''}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          margin: '0 auto',
        }}
      />
      {caption && (
        <figcaption
          style={{
            marginTop: '12px',
            fontFamily: F,
            fontSize: '13px',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.55,
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

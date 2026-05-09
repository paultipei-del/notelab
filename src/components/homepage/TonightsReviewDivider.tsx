'use client'

/**
 * Editorial divider used in the mobile State 4 stack between the
 * ProgramCard and the MiniShelf. Italic Cormorant text centered with a
 * hairline rule on either side. Defined as a discrete primitive
 * (per spec) rather than a generic separator so the typographic system
 * stays coherent.
 */
export default function TonightsReviewDivider({
  children = 'or pick up tonight’s review',
}: {
  children?: string
}) {
  return (
    <div
      style={{
        margin: '4px 0 8px',
        paddingTop: 8,
        textAlign: 'center',
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: 12,
        color: '#8a7560',
      }}
    >
      <span aria-hidden style={ruleStyle} />
      {children}
      <span aria-hidden style={ruleStyle} />
    </div>
  )
}

const ruleStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 30,
  height: 1,
  background: 'rgba(139, 105, 20, 0.25)',
  verticalAlign: 'middle',
  margin: '0 12px',
}

import { Fragment, type ReactNode } from 'react'

/**
 * Render a string and downscale every U+00AE registered-mark glyph via
 * the global .r-mark class. Use this anywhere a data-driven string
 * (program title, pitch, whoFor, etc.) contains "®" and the surface
 * has no other reason to switch to dangerouslySetInnerHTML.
 */
export function renderWithRMark(text: string): ReactNode {
  if (!text.includes('®')) return text
  const parts = text.split('®')
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <sup className="r-mark">®</sup>}
    </Fragment>
  ))
}

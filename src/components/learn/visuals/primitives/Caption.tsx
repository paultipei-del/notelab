import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface CaptionProps {
  children: React.ReactNode
  T: LearnTokens
  variant?: 'figure' | 'inline'
}

export function Caption({ children, T, variant = 'figure' }: CaptionProps) {
  // Figure captions are the italic Cormorant prose under each visual
  // ("The same physical pitch behaves differently…"). Previously they
  // sat at T.captionFontSize / inkSubtle, which read as faded against
  // the warm cream background. Bumped one step on size, darkened to
  // inkMuted (still softer than primary ink, but legibly so), and
  // generous lineHeight so wrapped lines stay readable.
  const figureFontSize = T.size === 'small' ? 14 : T.size === 'hero' ? 17 : 15
  const style: React.CSSProperties = variant === 'figure'
    ? {
        fontFamily: T.fontLabel,
        fontSize: figureFontSize,
        fontWeight: 300,
        color: T.inkMuted,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 1.55,
        maxWidth: '64ch',
        marginLeft: 'auto',
        marginRight: 'auto',
      }
    : {
        fontFamily: T.fontLabel,
        fontSize: T.labelFontSize,
        color: T.inkMuted,
      }
  return <p style={style}>{children}</p>
}

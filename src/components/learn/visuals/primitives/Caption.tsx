import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface CaptionProps {
  children: React.ReactNode
  T: LearnTokens
  variant?: 'figure' | 'inline'
}

export function Caption({ children, T, variant = 'figure' }: CaptionProps) {
  const style: React.CSSProperties = variant === 'figure'
    ? {
        fontFamily: T.fontDisplay,
        fontSize: T.captionFontSize,
        color: T.inkSubtle,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 12,
      }
    : {
        fontFamily: T.fontLabel,
        fontSize: T.labelFontSize,
        color: T.inkMuted,
      }
  return <p style={style}>{children}</p>
}

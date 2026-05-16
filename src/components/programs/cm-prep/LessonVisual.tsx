'use client'

import Link from 'next/link'
import InteractiveGrandStaff from './InteractiveGrandStaff'
import {
  LineSpaceDiagram,
  LabeledTrebleStaff,
  LabeledBassStaff,
  ReviewLetterNamesDiagram,
} from './visuals/StaffDiagrams'

import {
  AccidentalsDiagram,
  StepsDiagram,
  IntervalsDiagram,
} from './visuals/PitchDiagrams'

import {
  MajorPatternDiagram,
  MinorPatternDiagram,
  ReviewPatternsDiagram,
  KeySignatureDiagram,
  MajorScaleDiagram,
  TimeSignatureDiagram,
} from './visuals/PatternDiagrams'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { lessonSlug: string }

export default function LessonVisual({ lessonSlug }: Props) {
  const visual = getVisual(lessonSlug)
  if (!visual) return null

  return (
    <div style={{
      background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)',
      border: '1px solid var(--brown-faint)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
    }}>
      <p style={{
        fontFamily: F, fontSize: 'var(--nl-text-compact)',
        fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#B0ACA4', marginBottom: '18px',
      }}>
        Visual Guide
      </p>
      {visual}
    </div>
  )
}

function getVisual(slug: string) {
  switch (slug) {
    case 'grand-staff':
      return <InteractiveGrandStaff />
    case 'line-space-notes':
      return <LineSpaceDiagram />
    case 'treble-clef-notes':
      return <LabeledTrebleStaff />
    case 'bass-clef-notes':
      return <LabeledBassStaff />
    case 'review-letter-names':
      return <ReviewLetterNamesDiagram />
    case 'sharps-flats-naturals':
      return <AccidentalsDiagram />
    case 'half-whole-steps':
      return <StepsDiagram />
    case 'intervals':
      return <IntervalsDiagram />
    case 'major-patterns':
      return <MajorPatternDiagram />
    case 'minor-patterns':
      return <MinorPatternDiagram />
    case 'review-patterns':
      return <ReviewPatternsDiagram />
    case 'key-signatures':
      return <KeySignatureDiagram />
    case 'major-scales':
      return <MajorScaleDiagram />
    case 'time-signatures':
      return <TimeSignatureDiagram />
    default:
      return null
  }
}

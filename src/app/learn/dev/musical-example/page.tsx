'use client'

import React from 'react'
import { MusicalExample } from '@/components/learn/visuals/MusicalExample'
import { MusicXmlScore } from '@/components/learn/visuals/MusicXmlScore'
import type { MusicalElement, Score } from '@/lib/learn/visuals/notation-types'

/**
 * Hidden test route for the <MusicalExample> primitive. NOT linked from the
 * curriculum; reachable only at /learn/_test/musical-example. Each fixture
 * exercises a different slice of the API. Click "Play" to verify rhythmic
 * audio playback; click individual notes for single-note playback.
 */

const odeToJoy: MusicalElement[] = [
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q.', tied: true },
  { type: 'note', pitch: 'E5', duration: 'e' },
  { type: 'note', pitch: 'D5', duration: 'h' },
]

const waltzFigure: MusicalElement[] = [
  { type: 'note', pitch: 'G4', duration: 'q' },
  { type: 'note', pitch: 'B4', duration: 'e' },
  { type: 'note', pitch: 'D5', duration: 'e' },
  { type: 'note', pitch: 'B4', duration: 'q' },
  { type: 'note', pitch: 'G4', duration: 'q' },
  { type: 'note', pitch: 'A4', duration: 'e' },
  { type: 'note', pitch: 'C5', duration: 'e' },
  { type: 'note', pitch: 'A4', duration: 'q' },
  { type: 'note', pitch: 'F#4', duration: 'q' },
  { type: 'note', pitch: 'A4', duration: 'q' },
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'G4', duration: 'h.' },
]

const mozartK545: MusicalElement[] = [
  // Opening of K. 545 (simplified): C-E-G-C-B-G-A-G alberti-ish, then
  // D-G-F-E broken-chord run. Tests sixteenths + beaming + multi-duration mix.
  { type: 'note', pitch: 'C5', duration: 'h' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  { type: 'note', pitch: 'B4', duration: 'e' },
  { type: 'note', pitch: 'C5', duration: 'e' },
  { type: 'note', pitch: 'D5', duration: 'e' },
  { type: 'note', pitch: 'C5', duration: 'e' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'G4', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'B4', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'h' },
  { type: 'rest', duration: 'h' },
]

const jigFragment: MusicalElement[] = [
  // 6/8 — beamed groups of three eighths.
  { type: 'note', pitch: 'D5', duration: 'e' },
  { type: 'note', pitch: 'F#5', duration: 'e' },
  { type: 'note', pitch: 'A5', duration: 'e' },
  { type: 'note', pitch: 'D5', duration: 'e' },
  { type: 'note', pitch: 'F#5', duration: 'e' },
  { type: 'note', pitch: 'A5', duration: 'e' },
  { type: 'note', pitch: 'B4', duration: 'e' },
  { type: 'note', pitch: 'D5', duration: 'e' },
  { type: 'note', pitch: 'F#5', duration: 'e' },
  { type: 'note', pitch: 'A4', duration: 'q.' },
  { type: 'note', pitch: 'D5', duration: 'q.' },
  { type: 'note', pitch: 'A4', duration: 'q.' },
]

// Multi-voice on a single staff (V1 stems up, V2 stems down).
// 4 measures of soprano + alto in 4/4 — V1 quarter-note line, V2 half-note
// pedal. Validates voice 1 stems up + voice 2 stems down + rest stacking.
const sopranoAltoScore: Score = {
  staves: [
    {
      clef: 'treble',
      voices: [
        {
          stemPolicy: 'up',
          elements: [
            { type: 'note', pitch: 'E5', duration: 'q' },
            { type: 'note', pitch: 'F5', duration: 'q' },
            { type: 'note', pitch: 'G5', duration: 'q' },
            { type: 'note', pitch: 'F5', duration: 'q' },
            { type: 'note', pitch: 'E5', duration: 'h' },
            { type: 'note', pitch: 'D5', duration: 'h' },
            { type: 'note', pitch: 'C5', duration: 'q' },
            { type: 'note', pitch: 'D5', duration: 'q' },
            { type: 'note', pitch: 'E5', duration: 'q' },
            { type: 'note', pitch: 'D5', duration: 'q' },
            { type: 'note', pitch: 'C5', duration: 'w' },
          ],
        },
        {
          stemPolicy: 'down',
          elements: [
            { type: 'note', pitch: 'C5', duration: 'h' },
            { type: 'note', pitch: 'C5', duration: 'h' },
            { type: 'note', pitch: 'B4', duration: 'h' },
            { type: 'note', pitch: 'B4', duration: 'h' },
            { type: 'note', pitch: 'A4', duration: 'h' },
            { type: 'note', pitch: 'B4', duration: 'h' },
            { type: 'note', pitch: 'C5', duration: 'w' },
          ],
        },
      ],
    },
  ],
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
}

// Grand staff (treble + bass + brace), one voice per stave.
const grandStaffScore: Score = {
  staves: [
    {
      clef: 'treble',
      voices: [{
        elements: [
          { type: 'note', pitch: 'C5', duration: 'q' },
          { type: 'note', pitch: 'E5', duration: 'q' },
          { type: 'note', pitch: 'G5', duration: 'q' },
          { type: 'note', pitch: 'C6', duration: 'q' },
          { type: 'note', pitch: 'B5', duration: 'q' },
          { type: 'note', pitch: 'G5', duration: 'q' },
          { type: 'note', pitch: 'E5', duration: 'q' },
          { type: 'note', pitch: 'C5', duration: 'q' },
        ],
      }],
    },
    {
      clef: 'bass',
      voices: [{
        elements: [
          { type: 'note', pitch: 'C3', duration: 'h' },
          { type: 'note', pitch: 'G3', duration: 'h' },
          { type: 'note', pitch: 'C3', duration: 'h' },
          { type: 'note', pitch: 'G3', duration: 'h' },
        ],
      }],
    },
  ],
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
}

// 8-measure period for the annotation example.
const periodMelody: MusicalElement[] = [
  // Measure 1
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  // Measure 2
  { type: 'note', pitch: 'A5', duration: 'q' },
  { type: 'note', pitch: 'A5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'h' },
  // Measure 3
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  // Measure 4 — half cadence on V (G major triad / G note).
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'G4', duration: 'h' },
  // Measure 5
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'q' },
  // Measure 6
  { type: 'note', pitch: 'A5', duration: 'q' },
  { type: 'note', pitch: 'A5', duration: 'q' },
  { type: 'note', pitch: 'G5', duration: 'h' },
  // Measure 7
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'F5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  { type: 'note', pitch: 'E5', duration: 'q' },
  // Measure 8 — authentic cadence on I (C).
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'D5', duration: 'q' },
  { type: 'note', pitch: 'C5', duration: 'h' },
]

export default function MusicalExampleTestPage() {
  return (
    <main
      style={{
        fontFamily: 'var(--font-jost), sans-serif',
        maxWidth: 880,
        margin: '0 auto',
        padding: '48px 24px 96px',
        color: '#2A2318',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300 }}>
        MusicalExample test fixtures
      </h1>
      <p style={{ fontStyle: 'italic', color: '#5F5E5A', marginBottom: 32 }}>
        Hidden development route. Each fixture below exercises a different
        capability of the &lt;MusicalExample&gt; primitive. Click Play to
        verify rhythm; click individual notes for single-note playback.
      </p>

      <Section title="1. Beethoven — Ode to Joy (4/4, treble, basic + tied note)">
        <MusicalExample
          elements={odeToJoy}
          timeSignature={{ numerator: 4, denominator: 4 }}
          keySignature={0}
          clef="treble"
          bpm={88}
          caption="Quarters with a dotted-quarter + eighth tied figure in measure 4. Tests beam-less basic rhythms and ties."
        />
      </Section>

      <Section title="2. 3/4 waltz figure with beamed eighths">
        <MusicalExample
          elements={waltzFigure}
          timeSignature={{ numerator: 3, denominator: 4 }}
          keySignature={1}
          clef="treble"
          bpm={120}
          caption="Each beat in 3/4 beams independently. The F♯ from the key signature applies throughout."
        />
      </Section>

      <Section title="3. Mozart K. 545 opening (4/4 with mixed durations)">
        <MusicalExample
          elements={mozartK545}
          timeSignature={{ numerator: 4, denominator: 4 }}
          keySignature={0}
          clef="treble"
          bpm={108}
          caption="Half + quarter + eighth mix. Tests beam grouping inside a single beat."
        />
      </Section>

      <Section title="4. 6/8 jig fragment (compound beaming)">
        <MusicalExample
          elements={jigFragment}
          timeSignature={{ numerator: 6, denominator: 8 }}
          keySignature={2}
          clef="treble"
          bpm={108}
          caption="Compound 6/8 — eighths beam in groups of three, two compound beats per measure."
        />
      </Section>

      <Section title="5. v2 multi-voice on one staff (V1 up, V2 down + rest stacking)">
        <MusicalExample
          score={sopranoAltoScore}
          bpm={84}
          caption="Soprano (V1) stems up, alto (V2) stems down. Voices align on a shared time grid; the alto's half notes coexist with the soprano's quarter line."
        />
      </Section>

      <Section title="6. v2 grand staff (treble + bass + brace)">
        <MusicalExample
          score={grandStaffScore}
          bpm={84}
          caption="Right-hand quarter-note line over a left-hand bass walking line. One bar line spans both staves."
        />
      </Section>

      <Section title="7. v2 K. 265 — Theme, full piano (mm. 1–8)">
        <MusicXmlScore
          src="/music/k265.musicxml"
          measureRange={[1, 8]}
          bpm={108}
          systemBreaks={[4]}
          caption="Mozart, Ah vous dirai-je Maman K. 265 — theme. Right hand and left hand together via the new <MusicXmlScore /> path."
        />
      </Section>

      <Section title="8. 8-bar period with phrase brackets + cadence labels">
        <MusicalExample
          elements={periodMelody}
          timeSignature={{ numerator: 4, denominator: 4 }}
          keySignature={0}
          clef="treble"
          bpm={92}
          systemBreaks={[4]}
          showMeasureNumbers
          annotations={[
            {
              type: 'bracket',
              startIdx: 0,
              endIdx: 13,
              label: 'Antecedent',
              sublabel: '(question)',
              position: 'above',
            },
            {
              type: 'bracket',
              startIdx: 14,
              endIdx: 27,
              label: 'Consequent',
              sublabel: '(answer)',
              position: 'above',
            },
            {
              type: 'cadence',
              startIdx: 13,
              endIdx: 13,
              label: 'Half cadence',
              position: 'below',
            },
            {
              type: 'cadence',
              startIdx: 27,
              endIdx: 27,
              label: 'Authentic cadence',
              position: 'below',
            },
          ]}
          caption="Two parallel four-measure phrases. The antecedent ends on a half cadence; the consequent answers with an authentic cadence."
        />
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 64 }}>
      <h2
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 400,
          fontSize: 22,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

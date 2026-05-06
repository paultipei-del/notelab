'use client'

import React from 'react'
import { MusicalExample } from '@/components/learn/visuals/MusicalExample'
import { MusicXmlScore } from '@/components/learn/visuals/MusicXmlScore'
import { TempoTermsLadder } from '@/components/learn/visuals/TempoTermsLadder'
import { NavigationFlowchart } from '@/components/learn/visuals/NavigationFlowchart'
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

/* ── Phase C–F showcase fixtures ──────────────────────────────────────── */

// 8 quarter-note pitches stepping through scale degrees, repeated across
// 8 bars in 4/4 → 32 quarter notes total. Each measure-downbeat (beats
// 0, 4, 8, …, 28) gets a different dynamic level.
function repeatedQuarterScale(): MusicalElement[] {
  const pitches = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'G5', 'F5']
  const out: MusicalElement[] = []
  for (let bar = 0; bar < 8; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      out.push({ type: 'note', pitch: pitches[(bar + beat) % pitches.length], duration: 'q' })
    }
  }
  return out
}

const dynamicsShowcase: Score = {
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
  staves: [{
    clef: 'treble',
    voices: [{
      elements: repeatedQuarterScale(),
      dynamics: [
        { beat: 0,  level: 'pp' },
        { beat: 4,  level: 'p' },
        { beat: 8,  level: 'mp' },
        { beat: 12, level: 'mf', modifier: 'subito' },
        { beat: 16, level: 'f' },
        { beat: 20, level: 'ff' },
        { beat: 24, level: 'sfz' },
        { beat: 28, level: 'fz' },
      ],
    }],
  }],
}

// 4-bar treble-clef passage with three hairpin shapes layered with dynamics.
const hairpinsShowcase: Score = {
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
  staves: [{
    clef: 'treble',
    voices: [{
      elements: [
        // Measure 1 — short cresc.
        { type: 'note', pitch: 'C5', duration: 'q' },
        { type: 'note', pitch: 'D5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        { type: 'note', pitch: 'F5', duration: 'q' },
        // Measures 2–4 — long decresc. (cross-system if break is at m. 2).
        { type: 'note', pitch: 'G5', duration: 'q' },
        { type: 'note', pitch: 'A5', duration: 'q' },
        { type: 'note', pitch: 'B5', duration: 'q' },
        { type: 'note', pitch: 'A5', duration: 'q' },
        { type: 'note', pitch: 'G5', duration: 'q' },
        { type: 'note', pitch: 'F5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        { type: 'note', pitch: 'D5', duration: 'q' },
        // Measure 4 (last bar) — p < f > pattern wraps cresc/decresc with dynamics.
        { type: 'note', pitch: 'C5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        { type: 'note', pitch: 'G5', duration: 'q' },
        { type: 'note', pitch: 'C5', duration: 'q' },
      ],
      dynamics: [
        { beat: 0,  level: 'p' },
        { beat: 4,  level: 'mp' },
        { beat: 12, level: 'p' },
        { beat: 16, level: 'f' },
      ],
      hairpins: [
        { startBeat: 0, endBeat: 4, direction: 'cresc' },
        { startBeat: 4, endBeat: 12, direction: 'decresc' },
        { startBeat: 12, endBeat: 14, direction: 'cresc' },
        { startBeat: 14, endBeat: 16, direction: 'decresc' },
      ],
    }],
  }],
}

const tempoShowcase: Score = {
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
  staves: [{
    clef: 'treble',
    voices: [{
      elements: [
        // m. 1
        { type: 'note', pitch: 'G4', duration: 'q' },
        { type: 'note', pitch: 'A4', duration: 'q' },
        { type: 'note', pitch: 'B4', duration: 'q' },
        { type: 'note', pitch: 'C5', duration: 'q' },
        // m. 2
        { type: 'note', pitch: 'D5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        { type: 'note', pitch: 'F5', duration: 'q' },
        { type: 'note', pitch: 'G5', duration: 'q' },
        // m. 3 — start of rit.
        { type: 'note', pitch: 'A5', duration: 'q' },
        { type: 'note', pitch: 'G5', duration: 'q' },
        { type: 'note', pitch: 'F5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        // m. 4 — end of rit.
        { type: 'note', pitch: 'D5', duration: 'h' },
        { type: 'note', pitch: 'C5', duration: 'h' },
        // m. 5 — a tempo
        { type: 'note', pitch: 'G4', duration: 'q' },
        { type: 'note', pitch: 'C5', duration: 'q' },
        { type: 'note', pitch: 'E5', duration: 'q' },
        { type: 'note', pitch: 'G5', duration: 'q' },
      ],
    }],
  }],
  tempoMarkings: [
    { measureIdx: 0, text: 'Allegro', metronome: { beatNote: 'q', bpm: 120 }, style: 'normal' },
    { measureIdx: 2, text: 'rit.', style: 'change-with-line', endMeasureIdx: 3 },
    { measureIdx: 4, text: 'a tempo', style: 'change' },
  ],
}

// Grand-staff fixture for pedal showcases. RH: simple chord progression
// in C major. LH: bass octaves. Pedal markings on the bass voice.
const PEDAL_RH: MusicalElement[] = [
  { type: 'note', pitches: ['C5', 'E5', 'G5'], duration: 'h' },
  { type: 'note', pitches: ['C5', 'F5', 'A5'], duration: 'h' },
  { type: 'note', pitches: ['B4', 'D5', 'G5'], duration: 'h' },
  { type: 'note', pitches: ['C5', 'E5', 'G5'], duration: 'h' },
]
const PEDAL_LH: MusicalElement[] = [
  { type: 'note', pitch: 'C3', duration: 'h' },
  { type: 'note', pitch: 'F3', duration: 'h' },
  { type: 'note', pitch: 'G3', duration: 'h' },
  { type: 'note', pitch: 'C3', duration: 'h' },
]

const pedalTextShowcase: Score = {
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
  staves: [
    { clef: 'treble', voices: [{ elements: PEDAL_RH }] },
    { clef: 'bass',
      voices: [{
        elements: PEDAL_LH,
        pedalMarks: [
          { startBeat: 0, endBeat: 4,  style: 'text' },
          { startBeat: 4, endBeat: 12, style: 'text' },
        ],
      }],
    },
  ],
}

const pedalBracketShowcase: Score = {
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: 0,
  staves: [
    { clef: 'treble', voices: [{ elements: PEDAL_RH }] },
    { clef: 'bass',
      voices: [{
        elements: PEDAL_LH,
        pedalMarks: [
          { startBeat: 0, endBeat: 4,  style: 'bracket' },
          { startBeat: 4, endBeat: 12, style: 'bracket' },
        ],
      }],
    },
  ],
}

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

      <Section title="9. Dynamics — all 8 levels with subito modifier">
        <MusicalExample
          score={dynamicsShowcase}
          bpm={88}
          caption="pp · p · mp · mf · f · ff · sfz · fz across eight bars on a treble-clef line. The mf carries the modifier 'subito' to confirm the italic suffix renders next to the Bravura glyph."
        />
      </Section>

      <Section title="10. Hairpins — short cresc, long decresc, p < f > pattern">
        <MusicalExample
          score={hairpinsShowcase}
          bpm={84}
          systemBreaks={[2]}
          caption="A short crescendo wedge in m. 1, a long decrescendo in mm. 2-4 (cross-system after the break), and a p < f > shape across the last two bars demonstrates dynamics + hairpins on a shared baseline."
        />
      </Section>

      <Section title="11. Tempo markings — Allegro + ♩=120 + rit. + a tempo">
        <MusicalExample
          score={tempoShowcase}
          bpm={120}
          systemBreaks={[2]}
          caption="'Allegro' with metronome equation at the start; a 'change-with-line' rit. spans the last two measures of the first system; 'a tempo' resumes on the second system."
        />
      </Section>

      <Section title="12. Pedal — text style (Ped./✱) and bracket style on grand staff">
        <MusicalExample
          score={pedalTextShowcase}
          bpm={72}
          caption="Pedal markings on the bass voice in 'text' style: Ped. at the engagement, ✱ at the release. Spans two pedal changes."
        />
        <MusicalExample
          score={pedalBracketShowcase}
          bpm={72}
          caption="Same passage, 'bracket' style: a continuous bracket below the bass staff with end ticks at engage and release."
        />
      </Section>

      <Section title="13. TempoTermsLadder — slow → fast vertical reference">
        <TempoTermsLadder
          highlight="Allegro"
          caption="Standard Italian tempo terms ordered by approximate BPM range. Allegro is highlighted to show the active-term treatment."
        />
      </Section>

      <Section title="14. NavigationFlowchart — D.S. al Coda flow">
        <NavigationFlowchart
          sections={[
            { label: 'Section A', sublabel: 'opening' },
            { label: 'Section B', sublabel: 'segno marker', variant: 'highlighted' },
            { label: 'Section C', sublabel: 'D.S. al Coda' },
            { label: 'Coda', variant: 'destination' },
          ]}
          jumps={[
            { fromIdx: 2, toIdx: 1, label: 'D.S. — back to segno' },
            { fromIdx: 1, toIdx: 3, label: 'al Coda — skip to coda' },
          ]}
          caption="At the D.S. marking, return to the segno; play forward; at the 'To Coda' indication, skip to the Coda."
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

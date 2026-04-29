# Rhythm Reading — content inventory and generation plan

Phase 1 deliverable. Read-only audit of the Rhythm Reading program's
exercise content, MusicXML schema, and generation tooling. Drives the
Phase 2 decision about how to fill the empty topics.

> **Status of this document.** The static sections (schema, generation
> infrastructure, authoring-path recommendation, audit script) are
> derived from the codebase as it sits at commit `80eb541` and are
> complete as written. The dynamic sections (per-topic filled vs
> placeholder counts, sample MusicXML per topic, anomaly flags) are
> filled in from the output of the audit script in §6. Sections that
> still need that data are clearly tagged **`[DYNAMIC — fill from
> /tmp/rhythm-audit.json]`**.

---

## 1. Per-topic content status

Per-topic filled-vs-placeholder counts are sourced from the live DB via
the audit script (§6). Until that runs, this section shows the
**target** structure (what each topic is supposed to contain) and a
placeholder for the actual content tally.

### 1.1 Targets (from the canonical blueprint)

The blueprint at `scripts/generate-rhythm-exercises.ts` is the source of
truth for what each topic should hold. It defines 28 of the 30 topics —
two Fundamentals topics (`categorySort` 1 and 2, presumably "Pulse Games
& Meter Basics" and "Quarter/Half/Whole Notes") were created outside the
blueprint via `/admin/rhythm/generate` directly. Their structure is
known from the live DB only.

| Sub-program | Topic | Slug | Levels (per blueprint) | Target exercises |
| --- | --- | --- | --- | --- |
| Fundamentals | Pulse Games & Meter Basics *(non-blueprint)* | `pulse-games-meter-basics` | **[DYNAMIC]** | 21 (per spec) |
| Fundamentals | Quarter/Half/Whole Notes *(non-blueprint)* | `quarter-half-whole-notes` | **[DYNAMIC]** | 22 (per spec) |
| Fundamentals | Basic Rests | `basic-rests` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Eighth Notes | `eighth-notes` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Simple Syncopation | `simple-syncopation` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Dotted Rhythms | `dotted-rhythms` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Ties | `ties` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Sixteenth Notes | `sixteenth-notes` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | 6/8 Foundations | `68-foundations` | L1×4 L2×4 L3×4 | 12 |
| Fundamentals | Mixed Review | `mixed-review` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Pulse Refresh | `pulse-refresh` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Core Values + Rests | `core-values-rests` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Eighth-Note Fluency | `eighth-note-fluency` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Groove Syncopation | `groove-syncopation` | L1×4 L2×4 L3×4 L4×4 | 16 |
| Personal Practice | Dotted Values | `dotted-values` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Ties + Phrase | `ties-phrase` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Sixteenth Groove | `sixteenth-groove` | L1×4 L2×4 L3×4 L4×4 | 16 |
| Personal Practice | Compound Meter | `compound-meter` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Style Modules | `style-modules` | L1×4 L2×4 L3×4 | 12 |
| Personal Practice | Reading Etudes | `reading-etudes` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Precision Pulse | `precision-pulse` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Advanced Simple Meter | `advanced-simple-meter` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Complex Rests | `complex-rests` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Syncopation Systems | `syncopation-systems` | L1×4 L2×4 L3×4 L4×4 | 16 |
| Conservatory Prep | Dotted/Tied Complexity | `dottedtied-complexity` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Sixteenth Vocabulary | `sixteenth-vocabulary` | L1×4 L2×4 L3×4 L4×4 | 16 |
| Conservatory Prep | Compound Mastery | `compound-mastery` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Mixed Meter | `mixed-meter` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Polyrhythm Prep | `polyrhythm-prep` | L1×4 L2×4 L3×4 | 12 |
| Conservatory Prep | Performance Etudes | `performance-etudes` | L1×4 L2×4 L3×4 L4×4 | 16 |

Blueprint total (28 topics): **352** exercises. Plus the two non-blueprint
Fundamentals topics (21 + 22 = **43**): grand total **395** exercises
across 30 topics.

> **Note on the 399 vs 395 vs 356 numbers floating around.** The Wave 1
> sub-program card copy says "356 progressive exercises". The Wave 1
> verification report mentions 399 total. This blueprint computes 395.
> Any discrepancy is either (a) duplicate/orphan rows in the DB,
> (b) drift between the sub-program copy strings and the live data, or
> (c) a counting error somewhere. The audit script flags duplicates and
> orphans — see §1.3.

### 1.2 Filled vs placeholder by (program, category, level)

**[DYNAMIC — fill from `/tmp/rhythm-audit.json` → `byProgram`]**

For each topic, expected output rows look like:

```
Fundamentals → Basic Rests
   L1: 4/4 filled, 0/4 placeholder, 0 broken
   L2: 0/4 filled, 4/4 placeholder, 0 broken
   L3: 0/4 filled, 4/4 placeholder, 0 broken
   total: 4/12 filled (33%)
```

When the script JSON is pasted in, render this section as a table per
sub-program, one row per topic, columns = filled/placeholder/broken
with totals on the right.

### 1.3 Anomalies

**[DYNAMIC — fill from `/tmp/rhythm-audit.json` → `placeholderRows`,
`brokenRows`, `orphanRows`]**

Expected categories of anomaly the script surfaces:

- **Placeholder rows** — `file_data` is null or empty. These are the
  "expected to fill" exercises.
- **Broken rows** — `file_data` exists but does not decode/unzip/parse
  to a valid score. Usually a corruption or a generator-side bug. Each
  broken row is listed with the failure reason (`unzip_failed`,
  `missing_score_xml`, `empty_score`, etc.).
- **Orphan rows** — exercises whose `program_slug` doesn't match any
  configured sub-program slug, or whose `category` is not present in
  any other exercise (suggesting it was created and then renamed
  elsewhere). These are quality bugs to investigate before authoring.
- **Duplicates** — exercises with identical `(program_slug, category,
  level, title)` tuples. Common when the generator is re-run without
  clearing prior rows.

---

## 2. Sample existing content per topic

For every topic with at least one filled exercise, this section shows
one representative MusicXML file plus a one-line description of what
the notation contains.

**[DYNAMIC — fill from `/tmp/rhythm-audit.json` → `samplesByTopic` and
the corresponding files in `/tmp/rhythm-samples/*.xml`]**

Each entry should look like:

````
### Basic Rests — sample (Fundamentals)

- **id**: `<row id>`
- **title**: `<title>`
- **level**: 1
- **time**: 4/4
- **measures**: 4
- **content**: 4 measures in 4/4, alternating quarter rest and quarter
  note throughout, no ties or accidentals.

```xml
<?xml version="1.0" encoding="UTF-8"?>
…
```
````

When pasting in samples, keep the raw XML exactly as the script
captured it — that's the schema-matching reference for any new
generator we build.

---

## 3. Schema — MusicXML structure NoteLab uses

This is the exact shape of every score NoteLab's rhythm generator emits.
A new authoring tool **must** match it byte-for-byte (or close enough
that `parseMXL` and OSMD both consume it without warnings) for the
exercises to load in the trainer and render in the static preview.

Source of truth: `src/lib/rhythmGenerator.ts → generateMusicXML()` and
`xmlToMxlBuffer()`.

### 3.1 File container (MXL = compressed MusicXML)

The file stored in `rhythm_exercises.file_data` (base64) is a ZIP
archive (`.mxl`) with this layout:

```
<root>
├── META-INF/
│   └── container.xml
└── score.xml
```

The container points to the score:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>
```

The ZIP is built with DEFLATE compression. Both `JSZip` (Node and
browser) and OSMD's MXL loader accept this layout.

### 3.2 score.xml — top-level skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>{TITLE}</work-title>
  </work>
  <identification>
    <encoding>
      <software>NoteLab Rhythm Generator</software>
      <encoding-date>{YYYY-MM-DD}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Rhythm</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    {MEASURES}
  </part>
</score-partwise>
```

Element-by-element:

| Element | Required | Notes |
| --- | --- | --- |
| XML declaration | yes | `version="1.0" encoding="UTF-8"` |
| `<!DOCTYPE>` | yes | MusicXML 4.0 partwise public DTD |
| `<score-partwise version="4.0">` | yes | Outermost wrapper |
| `<work>/<work-title>` | yes | Used by parsers to display title; NoteLab passes the row's `title` here |
| `<identification>/<encoding>/<software>` | yes | Hardcoded `"NoteLab Rhythm Generator"` — useful for forensic/origin queries |
| `<identification>/<encoding>/<encoding-date>` | yes | `YYYY-MM-DD` |
| `<part-list>/<score-part id="P1">/<part-name>Rhythm</part-name>` | yes | Single part. Always `id="P1"`, name `"Rhythm"`. Multi-part isn't used. |
| `<part id="P1">` | yes | Wraps all measures |

### 3.3 Each measure

The first measure carries the `<attributes>` block (key, time, clef,
staff details). Subsequent measures omit it. The final measure carries
the closing barline.

```xml
<measure number="1">
  <attributes>
    <divisions>16</divisions>
    <key><fifths>0</fifths></key>
    <time>
      <beats>{BEATS}</beats>
      <beat-type>{BEAT_TYPE}</beat-type>
    </time>
    <clef><sign>percussion</sign></clef>
    <staff-details><staff-lines>1</staff-lines></staff-details>
  </attributes>
  {NOTES}
</measure>
…
<measure number="{N}">
  {NOTES}
  <barline location="right"><bar-style>light-heavy</bar-style></barline>
</measure>
```

| Element | Required | Notes |
| --- | --- | --- |
| `<measure number="N">` | yes | 1-indexed, sequential |
| `<attributes>` | first measure only | All five children below are required when present |
| `<divisions>16</divisions>` | yes (in attrs) | **Hardcoded to 16** divisions per quarter note. All `<duration>` integers are in 16ths-of-a-quarter units. Whole = 64, half = 32, quarter = 16, eighth = 8, sixteenth = 4. Dotted variants = base × 1.5. |
| `<key><fifths>0</fifths></key>` | yes (in attrs) | Always C major / no key signature for rhythm exercises |
| `<time><beats>X</beats><beat-type>Y</beat-type></time>` | yes (in attrs) | Time signature; rendered by OSMD/parseMXL |
| `<clef><sign>percussion</sign></clef>` | yes (in attrs) | Percussion clef — single-line staff |
| `<staff-details><staff-lines>1</staff-lines></staff-details>` | yes (in attrs) | One-line rhythm staff |
| `<barline location="right"><bar-style>light-heavy</bar-style></barline>` | last measure only | Final double-bar |

### 3.4 Each note

There are two note shapes — pitched (rendered as a notehead on the
single staff line) and rest. Both have the same envelope.

#### 3.4.1 Pitched note (rhythmic placeholder)

```xml
<note>
  <unpitched>
    <display-step>E</display-step>
    <display-octave>4</display-octave>
  </unpitched>
  <duration>{DURATION_IN_DIVISIONS}</duration>
  {TIE_STOP_IF_ANY}
  {TIE_START_IF_ANY}
  <voice>1</voice>
  <type>{NOTE_TYPE}</type>
  {DOT_IF_ANY}
  <stem>up</stem>
  {NOTATIONS_IF_ANY}
</note>
```

| Element | Required | Notes |
| --- | --- | --- |
| `<unpitched>` | yes (for non-rest) | Placeholder pitch — always E4. Tells renderers to draw a notehead at the standard rhythm-staff position. |
| `<duration>` | yes | Integer divisions. Must equal `quarterBeats * 16` (rounded). |
| `<tie type="stop"/>` | conditional | Emitted before `<tie type="start"/>` when the same note is both ending one tie and starting another. (Doesn't happen in current generator output, but the emission order is fixed.) |
| `<tie type="start"/>` | conditional | Tie origin — the next note must carry `<tie type="stop"/>`. |
| `<voice>1</voice>` | yes | Single voice; multi-voice not used. |
| `<type>` | yes | One of: `whole`, `half`, `quarter`, `eighth`, `sixteenth`. Note: NoteLab does **not** emit `8th`/`16th` aliases when generating, but `parseMXL` accepts them on read for compatibility. |
| `<dot/>` | conditional | Augmentation dot. Generator emits at most one. |
| `<stem>up</stem>` | yes (for non-rest) | All stems up — hardcoded. |
| `<notations><tied .../></notations>` | conditional | Carries the **graphical** tie alongside the structural `<tie>`. Always paired. |

#### 3.4.2 Rest

```xml
<note>
  <rest/>
  <duration>{DURATION_IN_DIVISIONS}</duration>
  <voice>1</voice>
  <type>{NOTE_TYPE}</type>
  {DOT_IF_ANY}
</note>
```

Rests omit `<unpitched>`, `<stem>`, `<tie>`, and `<notations>`. Type
strings are the same set as pitched notes.

### 3.5 What the schema does NOT include

These would be valid MusicXML but NoteLab does not emit them. If a new
authoring tool emits any of these, the trainer's parser will **not**
fail — but the rendering pipeline will silently ignore them (no
beam/tuplet/dynamic awareness). Document and avoid:

- **`<beam>` elements** — explicitly absent. The trainer auto-beams in
  its renderer (`computeBeamGroups()` in `src/app/rhythm/page.tsx`) and
  the static preview enables OSMD's `autoBeam` flag (`RhythmStaffPreview.tsx`
  commit `4e375d2`). Adding `<beam>` markup would be additive for
  third-party tools but isn't required for NoteLab itself.
- **`<time-modification>` / tuplet brackets** — `parseMXL` doesn't read
  them. The generator has a `tupletType` option but never wires it
  through to the XML (`generateMusicXML` ignores `n.tuplet`).
- **`<accidental>`** — never emitted (key is always C, pitches are
  always E4 placeholders).
- **`<dynamics>`, `<articulations>`, `<ornaments>`** — never emitted.
- **`<staves>` greater than 1** — `hands` is always 1 in the seed and
  the admin form is hardcoded to 1.
- **Tempo markings** — no `<sound tempo>` or `<direction>/<metronome>`.
  Tempo is set at runtime by the trainer's BPM control, not the file.
- **Anacrusis / pickup measures** — no `<measure number="0" implicit="yes">`.
- **`<barline>` other than the final double-bar** — measure separators
  are implicit; only the closing one is emitted.

### 3.6 Filename / storage convention

| Field | Format | Where it lives |
| --- | --- | --- |
| **Storage** | `rhythm_exercises.file_data` (base64-encoded MXL bytes) on Supabase Postgres. There is **no** Storage-bucket file. The migration `001_rhythm_exercises.sql` mentions a `rhythm-exercises` bucket but that path is not used by current code. |
| **Path field** | `rhythm_exercises.file_path` is purely descriptive metadata — not used for fetching. Format generated by both the seed script and the admin UI: `generated/{program-slug}/{category-slug}/{title-slug}-{epoch-ms}.mxl`. |
| **Row ID** | `rhythm_exercises.id` — UUID, generated by `gen_random_uuid()` server-side. |
| **Title** | `rhythm_exercises.title` — free-form. The seed script emits `"#{N} - {Blueprint Title}"` (e.g. `"#1 - Quarter Rests"`). |

The trainer fetches by `id` only; `file_path` is a human-readable hint
only. If you regenerate exercises, the `id` changes (new row) but the
`file_path` may collide with an old row's metadata — only the row count
and `(program, category, level, title)` tuple are meaningful.

### 3.7 Loading pipeline (URL → trainer)

```
/rhythm?exercise={id}
   ↓
src/app/rhythm/page.tsx
   ↓ (loadExercise)
src/lib/rhythmLibrary.ts → fetchExerciseFile(id)
   ↓ (Supabase query: select file_data from rhythm_exercises where id = ?)
   ↓ (atob → ArrayBuffer)
src/lib/parseMXL.ts → parseMXL(buffer)
   ↓ (JSZip → score.xml string → DOMParser → walk <measure>/<note>)
RhythmExercise object
   ↓
src/app/rhythm/page.tsx (custom SVG renderer with auto-beam, ties, etc.)
```

The static preview path is similar but truncated: `RhythmStaffPreview`
fetches the same buffer via the same `fetchExerciseFile`, then hands the
`Blob` directly to OSMD (`osmd.load(blob)`), bypassing `parseMXL`. OSMD
parses the MXL itself, which is why the schema must remain correct
MusicXML (not just whatever shape parseMXL happens to accept).

### 3.8 Topic/level association

The metadata that ties an exercise to its UI position lives entirely on
the row itself — no join tables.

| Column | Type | Used for |
| --- | --- | --- |
| `program_slug` | text | Sub-program slug (`fundamentals`, `personal-practice`, `conservatory-prep`). Matched against `RHYTHM_PROGRAMS[].slug`. |
| `program_sort` | int | Tiebreaker for sub-program ordering (currently 1, 2, 3). |
| `category` | text | Topic display name. Becomes the URL slug via `categorySlug(name) = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`. |
| `category_sort` | int | Sort key within a sub-program. Lower = earlier. |
| `level` | int (≥1) | Level group within a topic. Determines which `Level N` section the exercise renders inside. |
| `order_index` | int | Position within a (program, category, level) bucket. Currently 0-3 in the seed. |
| `difficulty` | int (1–5) | Topic-level skill bracket. Same value across all rows in a topic. |
| `beats` / `beat_type` | int / int | Time signature, rendered as a chip on the launcher. |

Sort order in the library tree (per `sortRhythmExercises` in
`rhythmLibrary.ts`): `program_sort` → `category_sort` → `category` →
`level` → `order_index` → `title`.

There is **no foreign-key constraint** anywhere — orphan rows
(`program_slug` not matching any configured program, or `category` not
matching any other rows in the same program) are silently dropped from
the UI but remain in the DB.

---

## 4. Generation infrastructure assessment

### 4.1 What `/admin/rhythm/generate` does

Single React page at `src/app/admin/rhythm/generate/page.tsx`. Workflow:

1. Operator picks parameters in the form: time signature (beats / beat
   type), measures (2 / 4 / 6 / 8 / 12 / 16), note pool (whole /
   half / quarter / eighth / sixteenth subset), dotted-note pool,
   rests on/off + probability, ties on/off + probability.
2. Operator picks library metadata: title, category, difficulty (1–5),
   `program_slug`, `program_sort`, `category_sort`, `level`.
3. **Generate button** invokes `generateExercise(opts)` — a pure
   function in `src/lib/rhythmGenerator.ts` that returns a
   `GeneratedExercise` (no I/O).
4. **Diagnose button** (when a preview is rendered) shows a dump of
   beat positions per measure with on-beat / off-beat / tie markers —
   strictly a debugging aid.
5. **Save to Library button** invokes `generateMusicXML(preview, title)
   → xmlToMxlBuffer(xml)` → base64-encodes → inserts a row into
   `rhythm_exercises` via the in-page Supabase client.

### 4.2 Inputs and outputs

| Layer | Inputs | Outputs |
| --- | --- | --- |
| `generateExercise(opts: GeneratorOptions)` | timeSignature, measures, notePool, allowRests, restProbability, allowDots, dotPool, dotProbability, allowTies, tieProbability, allowTuplets, tupletType, hands, seed | `GeneratedExercise` (in-memory) |
| `generateMusicXML(ex, title)` | GeneratedExercise + title | MusicXML string (no I/O) |
| `xmlToMxlBuffer(xml)` | MusicXML string | Compressed `.mxl` `ArrayBuffer` (no I/O) |
| `/admin/rhythm/generate` (UI form + Save button) | All of the above plus library metadata | One row inserted into `rhythm_exercises` |

The XML and MXL conversion are pure functions. The DB insert is the
only side effect.

### 4.3 Programmatic invocation

**The UI page is strictly UI-only.** It can't be invoked programmatically:
it depends on browser APIs (DOM, `useState`, file input listeners) and
the in-page Supabase client uses the user's session token.

**The underlying library (`rhythmGenerator.ts`) is fully Node-friendly.**
`generateExercise`, `generateMusicXML`, and `xmlToMxlBuffer` are pure
functions — no DOM, no React. The only runtime dependency is JSZip,
which works in Node.

**There is already a CLI proof-of-concept**: `scripts/generate-rhythm-exercises.ts`.
It imports the same three functions, iterates a hardcoded `BLUEPRINT`
array, and uses `@supabase/supabase-js` with the **service-role key**
from `.env.local` to insert each generated exercise. This is the
existing seam for any programmatic regeneration. It is currently the
sole canonical script for fundamentals + personal-practice +
conservatory-prep seeding, although as noted in §1 it is missing the
two non-blueprint Fundamentals topics.

There is **no HTTP API endpoint** for generation. `src/app/api/`
contains routes for webhooks, checkout, unlock, admin user management,
and explanations — nothing for rhythm generation.

### 4.4 Limitations of the current generator

These are all in `rhythmGenerator.ts → fillMeasure()` and downstream:

- **Single line only.** `hands: 1` is hardcoded by every caller. The
  `hands: 2` branch exists in the type but is not wired through
  `generateMusicXML` (which always emits one part).
- **One time signature per exercise.** No mid-exercise meter changes —
  the `<attributes>` block is emitted only on measure 1.
- **No tuplets actually emitted.** `tupletType` is a parameter but
  `generateMusicXML` ignores `n.tuplet`. `parseMXL` also ignores
  `<time-modification>`. Polyrhythm Prep / triplet-based topics cannot
  be authored through this generator without a code change.
- **No tempo metadata.** Tempo is set at runtime by the trainer.
  Acceptable for current pedagogy but a blocker for authored content
  that needs a target BPM (e.g. Conservatory Prep audition etudes).
- **Random pattern generation only.** The generator is stochastic —
  deterministic given a seed, but not pattern-targeted. There is no way
  to say "I want this exact rhythmic gesture: dotted-eighth + sixteenth
  + quarter." You can only constrain the note pool and probability
  knobs; the engine fills measures at random within those constraints.
  This is the **primary limitation** for hand-curated pedagogy.
- **Compound-meter beat-grouping rules are heuristic.** Notes that
  cross beats are sometimes split with auto-ties, sometimes split into
  separate notes — works for 6/8 and 12/8 but mixed-meter (5/8, 7/8)
  hasn't been deeply tested.
- **`console.log` calls in `mergeConsecutiveRests` and
  `mergeMultiBeatRests`.** Production code logs `merge:` and
  `mergeMulti:` debug lines on every generation. Cosmetic — not a
  correctness issue, but worth a one-line cleanup before authoring at
  scale.

### 4.5 What the generator handles well

- Quarter / half / whole / eighth / sixteenth note pools, alone and
  mixed, with controllable rest density.
- Dotted half, dotted quarter, dotted eighth (in pool plus auto-injected
  complement notes for fillability).
- Ties across beats and ties across the measure midpoint, with a
  probability knob. Heuristic chooses to tie when a combined duration
  cannot be expressed as a standard or dotted note value.
- Time signatures: 2/4, 3/4, 4/4, 5/4, 6/4, 9/4, 12/4, 2/8, 3/8, 4/8,
  6/8, 9/8, 12/8 (the form lets you pick beats ∈ {2,3,4,5,6,9,12} and
  beatType ∈ {2,4,8,16}).
- Reproducibility via `seed` (every call to `generateExercise` accepts
  one).

---

## 5. Authoring path recommendation

Three options ranked by my honest preference. Final pick should wait on
the §1.2 numbers — if the live DB shows ~80 exercises filled and the
rest empty, the math favors a different option than if it shows ~360
filled with just a handful of placeholders.

### 5.1 Option A — Extend `scripts/generate-rhythm-exercises.ts` (preferred)

**What it is**: Add the two missing Fundamentals topics to the
`BLUEPRINT` constant, then run the script with a `--missing-only` flag
that skips topics already filled in the DB. Optionally also add
deterministic seeds per blueprint row so re-running produces the same
content.

**Pros**
- Reuses everything that already works. No new code paths, no parallel
  authoring tool, no schema drift risk.
- The blueprint is already the canonical source for 28 of 30 topics.
  Closing the gap (adding Pulse Games, Quarter/Half/Whole Notes) makes
  the blueprint **the** source of truth and removes the "seed vs DB"
  drift problem.
- Programmatic, reproducible, version-controlled.
- Uses the service-role key path that's already plumbed.

**Cons**
- The generator is stochastic. You can't author specific pedagogical
  gestures ("show me eighth-quarter-eighth syncopation with a tie
  across the bar"). You can only nudge probability knobs. For
  fundamentals topics this is fine; for Conservatory Prep audition
  etudes it may produce filler that doesn't read like real audition
  material.
- The two missing Fundamentals topics need their `noteValues / dotted /
  rests / ties / level structure` parameters defined — that's a
  20-minute pedagogical decision, not a code task.
- Doesn't address the polyrhythm / tuplet limitation (§4.4) — those
  topics will need a generator extension regardless.

**Effort estimate**: ~30 min to extend the blueprint + add a
`--missing-only` filter, then run-time of the existing script.

### 5.2 Option B — Hand-author MXL files for high-stakes topics, generate the rest

**What it is**: Use the generator (Option A) for the bread-and-butter
Fundamentals and Personal Practice topics. For Conservatory Prep —
specifically Performance Etudes, Polyrhythm Prep, Mixed Meter, and
Syncopation Systems — hand-author MusicXML files using a tool that
produces NoteLab-shaped output. Two sub-paths:

- **B1**: Use MuseScore / Dorico / Sibelius to author, export as MXL,
  post-process with a small Node script that strips/normalizes to the
  NoteLab schema (drops `<beam>`, `<dynamics>`, `<accidental>`, etc.,
  enforces `<unpitched>E4`, percussion clef, `divisions=16`). Insert
  the post-processed file into the DB the same way the script does.
- **B2**: Author the MusicXML by hand in a text editor for short
  exercises (2-4 measures). Tedious but produces exactly the gesture
  you want.

**Pros**
- Conservatory-grade content gets human pedagogical judgment.
- Mid-exercise meter changes, tuplets, and other limitations of the
  current generator become possible (the trainer's `parseMXL` already
  reads `<type>` correctly for `8th`/`16th` aliases — would need to
  extend it for tuplets).
- Pedagogy-first content for the topics that matter most.

**Cons**
- Significant authoring time. Even with MuseScore, normalizing 16
  Conservatory Prep exercises per topic across 4 topics = ~64 files,
  many hours of human work.
- Schema drift risk. The post-processor must be exhaustive — anything
  it misses leaves cruft in the file_data.
- Requires extending `parseMXL` for tuplets / time changes if those
  topics use them. Real code work.

**Effort estimate**: 1–2 days to build the post-processor and parser
extensions, plus 4–8 hours per topic for hand-authoring.

### 5.3 Option C — Write a pattern-targeted generator (new code)

**What it is**: Build a new layer on top of `rhythmGenerator.ts` that
takes a list of explicit rhythmic gestures (e.g. `["q. e | q q | e e
e e | h"]`) and emits a measure that contains exactly that sequence.
Make this the input format for the blueprint instead of probability
knobs.

**Pros**
- Pedagogically explicit. Each exercise is described by a string a
  music teacher could write directly. No "regenerate until it looks
  right".
- Eliminates the stochastic-output drift problem.
- The generator can still inherit `generateMusicXML` and
  `xmlToMxlBuffer` unchanged — only `fillMeasure` gets replaced.
- Solves the "Conservatory Prep audition etudes don't look real"
  problem from Option A.

**Cons**
- Net-new code. A small DSL parser, gesture-to-note mapping, and
  validation that gestures fit the time signature. Maybe 200–300 lines.
- Migration cost: every blueprint entry has to be rewritten in the new
  format. ~395 exercises means ~200 unique gesture patterns (pre-
  deduplication). That's curatorial work, not just a syntax change.
- We'd commit to maintaining the DSL going forward.

**Effort estimate**: 3–5 days for the generator + DSL, plus 1–2 days of
curatorial work writing gestures for all 30 topics.

### 5.4 My honest recommendation

**Default to Option A.** Get the empty topics filled with stochastic
content from a unified blueprint, accept the pedagogical limitation for
the harder topics, and revisit once we see how students respond.

**If the §1.2 audit shows the existing filled exercises were stochastic
and students are doing fine with them**, Option A is the right answer
all the way through — same content quality, just more of it.

**If the existing filled exercises are clearly hand-authored** (look at
the §2 sample MusicXML — distinctive titles like "Quarter Rests" with
deliberate patterns vs. random-looking note distributions), then jumping
to **Option B for Conservatory Prep only** is the right call: those
audition etudes deserve human pedagogy.

**Option C is the right long-term answer** but premature now. Build the
DSL once we have a real reason — student feedback, a specific topic that
keeps producing unsatisfying generator output, or a desire to re-base
the seed entirely.

### 5.5 Blockers to flag

- **Polyrhythm Prep needs tuplets.** The current generator can't emit
  them, and `parseMXL` would silently drop them if a hand-authored MXL
  contained them. This topic cannot be filled correctly until both are
  extended.
- **Performance Etudes need tempo markings.** Audition etudes are
  tempo-specific. If we want students to practice "Allegro 132" vs
  "Andante 80", we need either `<sound tempo>` in the MXL or a per-
  exercise BPM column on `rhythm_exercises`.
- **Mixed Meter needs mid-piece time changes.** Current generator
  emits `<attributes>` on measure 1 only.
- All three of the above are out-of-scope for Phase 2 unless explicitly
  scoped — flagging here so the decision is conscious.

---

## 6. Audit script (re-runnable)

Save as `/tmp/audit-rhythm-content.js` (the script writes its outputs
under `/tmp/`, so it's safe to keep there) and run from the Notelab repo
root:

```
node /tmp/audit-rhythm-content.js
```

It writes `/tmp/rhythm-audit.json` (the structured inventory) and
`/tmp/rhythm-samples/*.xml` (one representative MusicXML per topic that
has at least one filled exercise).

```javascript
#!/usr/bin/env node
/**
 * Rhythm content audit. Read-only.
 *
 * Run from the Notelab repo root:
 *   node /tmp/audit-rhythm-content.js
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from ./.env.local, pulls every
 * row from `rhythm_exercises`, decodes the base64 `file_data`, unzips the MXL,
 * and verifies the inner score.xml contains `<measure>` and `<note>` elements.
 * Aggregates by (program_slug, category, level) and dumps a JSON inventory to
 * /tmp/rhythm-audit.json plus a per-topic XML sample to /tmp/rhythm-samples/.
 */

const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const { createClient } = require('@supabase/supabase-js')

// ── Load .env.local ─────────────────────────────────────────────────────────
// We need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The script
// expects to be run from the project root so the env file resolves correctly.
const envPath = path.join(process.cwd(), '.env.local')
try {
  const text = fs.readFileSync(envPath, 'utf-8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch (e) {
  console.error(`Could not read .env.local at ${envPath}:`, e.message)
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Helpers ─────────────────────────────────────────────────────────────────

function decodeBase64(b64) {
  return Buffer.from(b64, 'base64')
}

// Inspect a single MXL buffer. Returns:
//   { ok: true,  reason: 'parsed',   measureCount, noteCount, restCount, scoreXml }
//   { ok: false, reason: '<why>',    measureCount, noteCount, restCount, scoreXml? }
//
// Failure reasons we expect:
//   - 'unzip_failed:<msg>'        → file_data decoded but isn't a valid ZIP
//   - 'missing_container_xml'     → ZIP doesn't contain META-INF/container.xml
//   - 'container_read_failed:...' → container exists but throws on read
//   - 'missing_score_xml'         → container points to a path the ZIP doesn't have
//   - 'score_read_failed:...'     → score path exists but throws on read
//   - 'empty_score:m=N,n=M'       → unzipped successfully but contains no <measure>/<note>
//
// Anything ok=true is treated as "filled". String-level checks (regex) are
// intentional — full DOMParser isn't necessary for this binary verification.
async function inspectMxl(buffer) {
  let zip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch (e) {
    return { ok: false, reason: 'unzip_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  let containerXml
  try {
    const f = zip.file('META-INF/container.xml')
    if (!f) return { ok: false, reason: 'missing_container_xml', measureCount: 0, noteCount: 0, restCount: 0 }
    containerXml = await f.async('text')
  } catch (e) {
    return { ok: false, reason: 'container_read_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
  const scorePath = rootfileMatch ? rootfileMatch[1] : 'score.xml'
  let scoreXml
  try {
    const f = zip.file(scorePath)
    if (!f) return { ok: false, reason: 'missing_score_xml', measureCount: 0, noteCount: 0, restCount: 0 }
    scoreXml = await f.async('text')
  } catch (e) {
    return { ok: false, reason: 'score_read_failed:' + e.message, measureCount: 0, noteCount: 0, restCount: 0 }
  }
  const measureCount = (scoreXml.match(/<measure\b/g) || []).length
  const noteCount = (scoreXml.match(/<note\b/g) || []).length
  const restCount = (scoreXml.match(/<rest\b/g) || []).length
  if (measureCount === 0 || noteCount === 0) {
    return { ok: false, reason: `empty_score:m=${measureCount},n=${noteCount}`, measureCount, noteCount, restCount, scoreXml }
  }
  return { ok: true, reason: 'parsed', measureCount, noteCount, restCount, scoreXml }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching rhythm_exercises…')
  // Pull every row, including file_data (base64). Yes this is a big payload —
  // ~few MB at most for the current library size. If the table grows large,
  // page this with .range() and stream the inspection.
  const { data, error } = await supabase
    .from('rhythm_exercises')
    .select('id, title, category, order_index, difficulty, beats, beat_type, program_slug, program_sort, category_sort, level, file_path, file_data')
  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }
  console.log(`Pulled ${data.length} rows`)

  const sampleDir = '/tmp/rhythm-samples'
  fs.mkdirSync(sampleDir, { recursive: true })

  // Aggregation buckets. We keep ids in each level bucket so any post-hoc
  // anomaly check (duplicate titles, empty topics, etc.) has the row IDs.
  const byProg = {}             // prog → cat → level → { filled, placeholder, broken, ids[] }
  const samples = {}            // "prog::cat" → first filled exercise's xml + meta
  const placeholderRows = []    // {id, title, prog, cat, level, reason}
  const brokenRows = []         // {id, title, prog, cat, level, reason}
  const filledRows = []
  const orphanRows = []         // reserved for follow-up checks (see below)

  let processed = 0
  for (const row of data) {
    processed++
    if (processed % 50 === 0) console.log(`  ${processed}/${data.length}…`)
    const prog = row.program_slug || '(no program)'
    const cat = row.category || '(no category)'
    const level = row.level == null ? -1 : row.level

    if (!byProg[prog]) byProg[prog] = { byCategory: {} }
    if (!byProg[prog].byCategory[cat]) byProg[prog].byCategory[cat] = { byLevel: {}, sortHint: row.category_sort }
    const catBucket = byProg[prog].byCategory[cat]
    if (!catBucket.byLevel[level]) catBucket.byLevel[level] = { filled: 0, placeholder: 0, broken: 0, ids: [] }
    const lvlBucket = catBucket.byLevel[level]
    lvlBucket.ids.push(row.id)

    // Classify:
    //   - no file_data       → placeholder
    //   - file_data exists   → run inspectMxl; ok=true → filled, ok=false → broken
    if (!row.file_data || row.file_data.length === 0) {
      lvlBucket.placeholder++
      placeholderRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'no_file_data' })
      continue
    }
    let buffer
    try {
      buffer = decodeBase64(row.file_data)
      if (buffer.length === 0) {
        lvlBucket.placeholder++
        placeholderRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'empty_buffer' })
        continue
      }
    } catch (e) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'b64_decode:' + e.message })
      continue
    }
    let result
    try {
      result = await inspectMxl(buffer)
    } catch (e) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: 'inspect_threw:' + e.message })
      continue
    }
    if (!result.ok) {
      lvlBucket.broken++
      brokenRows.push({ id: row.id, title: row.title, prog, cat, level, reason: result.reason })
      continue
    }
    lvlBucket.filled++
    filledRows.push({ id: row.id, title: row.title, prog, cat, level, measures: result.measureCount, notes: result.noteCount, rests: result.restCount })

    // Save the first filled sample per topic. Subsequent filled exercises are
    // counted but not sampled — one representative is enough for §2.
    const sampleKey = `${prog}::${cat}`
    if (!samples[sampleKey]) {
      const safeName = `${prog}__${cat}`.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-')
      const xmlPath = path.join(sampleDir, `${safeName}.xml`)
      fs.writeFileSync(xmlPath, result.scoreXml)
      samples[sampleKey] = {
        id: row.id,
        title: row.title,
        program_slug: row.program_slug,
        category: row.category,
        level: row.level,
        beats: row.beats,
        beat_type: row.beat_type,
        difficulty: row.difficulty,
        file_path: row.file_path,
        measures: result.measureCount,
        notes: result.noteCount,
        rests: result.restCount,
        xmlPath,
        xmlBytes: result.scoreXml.length,
      }
    }
  }

  // Output JSON — paste into §1.2, §1.3, §2 of the inventory report.
  const out = {
    generatedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0],
    totals: {
      rows: data.length,
      filled: filledRows.length,
      placeholder: placeholderRows.length,
      broken: brokenRows.length,
    },
    byProgram: byProg,
    samplesByTopic: samples,
    placeholderRows: placeholderRows.slice(0, 10),  // truncate for readability; full list in JSON if needed
    brokenRows: brokenRows.slice(0, 50),
    orphanRows,
  }
  const jsonPath = '/tmp/rhythm-audit.json'
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2))
  console.log(`\nWrote ${jsonPath}`)
  console.log(`  filled:      ${filledRows.length}`)
  console.log(`  placeholder: ${placeholderRows.length}`)
  console.log(`  broken:      ${brokenRows.length}`)
  console.log(`  samples:     ${Object.keys(samples).length} topics with at least one filled exercise`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
```

### 6.1 Notes on running

- The script depends on `jszip` and `@supabase/supabase-js` from the
  repo's `node_modules` — run from `~/Notelab` so resolution works.
- It uses the **service-role key** because the public anon key may not
  have read access to all rows depending on RLS configuration.
- Read-only — no UPDATE/INSERT/DELETE statements.
- Truncates `placeholderRows` to 10 and `brokenRows` to 50 in the JSON
  output for readability. If the live data has more, the per-topic
  counts in `byProgram` are still complete; the lists are just
  representative samples. To dump all rows, change the slices.
- **Orphan detection** is left as a follow-up because it requires
  cross-referencing the live data against `RHYTHM_PROGRAMS` and the
  category set known to the UI. The script collects the data needed
  (`byProgram` keys) — the orphan list is computed manually from that
  in §1.3 once the JSON is in hand.

---

## 7. What's next

1. Run the audit script per §6, paste the JSON output back.
2. I merge it into §1.2, §1.3, and §2.
3. Review the merged report together.
4. Pick an authoring path (§5).
5. Phase 2: execute the chosen plan.

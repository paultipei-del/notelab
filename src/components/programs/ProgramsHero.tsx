/**
 * Top-of-page hero for /programs: eyebrow + Cormorant title with
 * italic accent on "programs" + intro paragraph. Hardcoded copy
 * — this is the marquee, not data-driven content.
 */
export default function ProgramsHero() {
  return (
    <header className="nl-program-page-hero">
      <p className="nl-program-page-hero__eyebrow">Programs</p>
      <h1 className="nl-program-page-hero__title">
        Curriculum-aligned <em>programs</em>
      </h1>
      <p className="nl-program-page-hero__intro">
        Complete flashcard programs built around real curricula —
        Certificate of Merit and college first-year music theory, each
        self-contained with everything you need.
      </p>
    </header>
  )
}

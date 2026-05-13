'use client'

interface RepInstructionProps {
  /** True during the 600ms set-completion celebration — switches to
   *  the contextual encouragement text in forest green. */
  celebrating: boolean
  /** Contextual encouragement to show during the celebration window. */
  celebrationText: string
}

/**
 * Cormorant italic instruction below the actions row. Default shows
 * the keyboard hint with Space rendered in a <kbd> pill; mobile drops
 * the hint and just says "Tap anywhere".
 */
export default function RepInstruction({
  celebrating,
  celebrationText,
}: RepInstructionProps) {
  if (celebrating) {
    return <p className="nl-cc-instruction is-celebrating">{celebrationText}</p>
  }
  return (
    <p className="nl-cc-instruction">
      <span className="nl-cc-instruction__desktop">
        Tap anywhere — or press <kbd className="nl-cc-kbd">Space</kbd>
      </span>
      <span className="nl-cc-instruction__mobile">Tap anywhere</span>
    </p>
  )
}

'use client'

interface BestLineProps {
  best: number
  /** Only shown after the user has pressed Reset streak at least
   *  once this session — keeps the rising-streak view uncluttered. */
  visible: boolean
}

/**
 * "best this session: N". Reserves vertical space via opacity rather
 * than display: none so revealing it doesn't shift layout.
 */
export default function BestLine({ best, visible }: BestLineProps) {
  return (
    <div
      className={'nl-cc-best' + (visible ? ' is-visible' : '')}
      aria-hidden={!visible}
    >
      best this session: <span className="nl-cc-best__num">{best}</span>
    </div>
  )
}

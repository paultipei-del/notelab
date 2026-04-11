'use client'

interface ProgressBarProps {
  pct: number
  label: string
}

export function ProgressBar({ pct, label }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-4 flex-1 max-w-sm">
      <div className="flex-1 h-1 bg-[#484542] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#BA7517] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-light text-[#888780] tracking-wide whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

interface StreakBarProps {
  history: Array<'hit' | 'miss'>
}

export function StreakBar({ history }: StreakBarProps) {
  const last10 = history.slice(-10)
  if (last10.length === 0) return <div className="h-7" />

  return (
    <div className="flex justify-center gap-2 py-1">
      {last10.map((result, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            result === 'hit' ? 'bg-[#BA7517]' : 'bg-[#F09595]'
          }`}
        />
      ))}
    </div>
  )
}
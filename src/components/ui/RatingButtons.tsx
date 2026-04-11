'use client'

import { useEffect } from 'react'
import { RatingValue } from '@/lib/types'

interface RatingButtonsProps {
  visible: boolean
  intervals: { again: string; hard: string; easy: string }
  onRate: (rating: RatingValue) => void
}

export default function RatingButtons({ visible, intervals, onRate }: RatingButtonsProps) {
  // Keyboard shortcuts: 1 = Again, 2 = Hard, 3 = Easy
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === '1') onRate(1)
      if (e.key === '2') onRate(2)
      if (e.key === '3') onRate(3)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, onRate])

  if (!visible) return <div className="h-24" />

  const buttons: Array<{ rating: RatingValue; label: string; interval: string; style: string }> = [
    {
      rating: 1,
      label: 'Again',
      interval: intervals.again,
      style: 'bg-[#FCEBEB] border-[#F09595] text-[#A32D2D] hover:bg-[#F7C1C1]',
    },
    {
      rating: 2,
      label: 'Hard',
      interval: intervals.hard,
      style: 'bg-[#FAEEDA] border-[#FAC775] text-[#B5402A] hover:bg-[#FAC775]',
    },
    {
      rating: 3,
      label: 'Easy',
      interval: intervals.easy,
      style: 'bg-[#EAF3DE] border-[#C0DD97] text-[#3B6D11] hover:bg-[#C0DD97]',
    },
  ]

  return (
    <div className="flex justify-center gap-3 px-8 pb-8 flex-wrap">
      {buttons.map(({ rating, label, interval, style }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          className={`flex flex-col items-center gap-1 px-8 py-4 rounded-xl border-[1.5px] min-w-[110px] transition-all duration-150 ${style}`}
        >
          <span className="text-[14px] font-normal tracking-wide">{label}</span>
          <span className="text-[11px] font-light opacity-70 tracking-wide">{interval}</span>
        </button>
      ))}
    </div>
  )
}
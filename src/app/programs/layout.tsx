import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Curriculum-aligned music theory programs: exam preparation, note reading, rhythm, and ear training. Built for serious piano students and musicians.',
}

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return children
}

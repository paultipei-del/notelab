import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-cormorant',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
})

export const metadata: Metadata = {
  title: 'NoteLab',
  description: 'Music theory flashcards for CM students and musicians',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @font-face {
            font-family: 'Bravura';
            src: url('https://cdn.jsdelivr.net/gh/steinbergmedia/bravura@master/redist/woff2/Bravura.woff2') format('woff2'),
                 url('https://cdn.jsdelivr.net/gh/steinbergmedia/bravura@master/redist/woff/Bravura.woff') format('woff');
            font-display: swap;
          }
        `}</style>
      </head>
      <body className={`${cormorant.variable} ${jost.variable}`}>
        {children}
      </body>
    </html>
  )
}

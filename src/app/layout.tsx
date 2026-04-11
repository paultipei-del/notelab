import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ParticleCanvas from '@/components/ParticleCanvas'
import { Analytics } from '@vercel/analytics/next'

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'NoteLab Studio',
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
        {/* Preload Bravura so symbols render without flash */}
        <link
          rel="preload"
          href="/Bravura.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'Bravura';
            src: url('/Bravura.woff2') format('woff2'),
                 url('/Bravura.woff2') format('woff');
            font-display: block;
          }
        `}</style>
      </head>
      <body className={`${cormorant.variable} ${jost.variable}`}>
        <ParticleCanvas />
        <SiteHeader />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}

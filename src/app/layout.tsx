import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { Analytics } from '@vercel/analytics/next'
import ColorLabMount from '@/components/ColorLab/Mount'

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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
})

// viewport-fit=cover lets the page render under the iOS safe areas
// (notch / Dynamic Island / home indicator) so the html gradient
// flows under the system strips. theme-color tints Safari's own
// chrome (address bar, bottom toolbar) to match the top of the
// gradient, so the strips read as part of the same paper.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E0D9C4' },
    { media: '(prefers-color-scheme: dark)',  color: '#E0D9C4' },
  ],
}

// Icons follow Next.js's filesystem convention: app/favicon.ico,
// app/icon.png, app/apple-icon.png are auto-served at the right URLs
// and Next.js injects the matching <link> tags. No manual `icons`
// metadata needed.
export const metadata: Metadata = {
  title: 'NoteLab',
  description: 'Music theory flashcards, ear training, and curriculum-aligned programs for piano students, college music majors, and serious adult learners.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NoteLab',
    statusBarStyle: 'default',
  },
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
        {/* iOS PWA splash screens. Apple matches by device-width/height
            and pixel-ratio, so each home-screen launch on a known
            device picks the right cream-padded splash and the brief
            white flash is gone. */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <style>{`
          @font-face {
            font-family: 'Bravura';
            src: url('/Bravura.woff2') format('woff2'),
                 url('/Bravura.woff2') format('woff');
            font-display: block;
          }
          @font-face {
            font-family: 'Bravura Learn';
            src: url('/Bravura.woff2') format('woff2');
            font-display: swap;
            unicode-range: U+E000-F8FF, U+1D100-1D1FF;
          }
        `}</style>
      </head>
      <body className={`${cormorant.variable} ${jost.variable} ${jetbrainsMono.variable}`}>
        {/* ParticleCanvas removed site-wide — it painted a subtle
            dark perlin-noise overlay (rgb(42,35,24) at up to 9%
            opacity) over the cream gradient on every page except
            /programs, which made /programs read significantly
            brighter than the rest of the site. The cleaner solution
            is a uniformly darker html cream (#E1D9C5) that matches
            the iOS status-bar themeColor — same darker character
            without the texture artifacts, and consistent across
            every route. Files kept in repo for easy revert. */}
        <SiteHeader />
        {/* All page content scrolls inside this wrapper, which is
            anchored below the SiteHeader. The body itself doesn't
            scroll (overflow: hidden in globals.css), so content
            physically can't enter the header zone — the header stays
            transparent and seam-free against the page paper without
            any overlay or backdrop trickery. SiteFooter sits inside
            so it scrolls naturally to the bottom. */}
        <div className="nl-page-scroll">
          <div className="nl-page-main">{children}</div>
          <SiteFooter />
        </div>
        <Analytics />
        <ColorLabMount />
      </body>
    </html>
  )
}

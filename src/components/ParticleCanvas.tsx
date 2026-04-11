'use client'

import { useEffect, useRef } from 'react'

const SPACING   = 28
const PROXIMITY = 110
const BASE_R    = 1
const MAX_R     = 2
const BASE_A    = 0.025
const MAX_A     = 0.13

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const mouse = { x: -9999, y: -9999 }

    function resize() {
      canvas!.width  = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    function tick() {
      const w = canvas!.width
      const h = canvas!.height
      ctx!.clearRect(0, 0, w, h)

      // Offset so grid is centered on canvas
      const offsetX = (w % SPACING) / 2
      const offsetY = (h % SPACING) / 2

      for (let x = offsetX; x < w; x += SPACING) {
        for (let y = offsetY; y < h; y += SPACING) {
          const dx   = x - mouse.x
          const dy   = y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          let alpha: number
          let radius: number

          if (dist < PROXIMITY) {
            const t = 1 - dist / PROXIMITY
            alpha  = BASE_A + t * (MAX_A - BASE_A)
            radius = BASE_R + t * (MAX_R - BASE_R)
          } else {
            alpha  = BASE_A
            radius = BASE_R
          }

          ctx!.beginPath()
          ctx!.arc(x, y, radius, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(26,26,24,${alpha})`
          ctx!.fill()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

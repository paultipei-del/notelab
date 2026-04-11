'use client'

import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 120
const PROXIMITY = 140

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseAlpha: number
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

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

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      vx: rand(-0.18, 0.18),
      vy: rand(-0.18, 0.18),
      baseAlpha: rand(0.03, 0.07),
    }))

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    function tick() {
      const w = canvas!.width
      const h = canvas!.height
      ctx!.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < 0) p.x += w
        if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        if (p.y > h) p.y -= h

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        let alpha: number
        let radius: number

        if (dist < PROXIMITY) {
          const t = 1 - dist / PROXIMITY
          alpha  = p.baseAlpha + t * (0.35 - p.baseAlpha)
          radius = 1 + t * 0.5
        } else {
          alpha  = p.baseAlpha
          radius = 1
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(26,26,24,${alpha})`
        ctx!.fill()
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

'use client'

import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0

    // Normalised mouse position
    const mouse = { x: -9999, y: -9999, weight: 0 }

    // Offscreen canvas at 1/4 resolution
    const off = document.createElement('canvas')
    const offCtx = off.getContext('2d')!

    function resize() {
      canvas!.width  = window.innerWidth
      canvas!.height = window.innerHeight
      off.width  = Math.ceil(window.innerWidth  / 4)
      off.height = Math.ceil(window.innerHeight / 4)
    }
    resize()
    window.addEventListener('resize', resize)

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX / window.innerWidth
      mouse.y = e.clientY / window.innerHeight
      mouse.weight = 1
    }
    function onMouseLeave() {
      // weight decays per frame
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    function clamp(v: number, lo: number, hi: number) {
      return v < lo ? lo : v > hi ? hi : v
    }

    function tick() {
      const ow = off.width
      const oh = off.height
      const img = offCtx.createImageData(ow, oh)
      const data = img.data

      // Decay mouse influence
      if (mouse.weight > 0) mouse.weight = Math.max(0, mouse.weight - 0.02)

      for (let py = 0; py < oh; py++) {
        for (let px = 0; px < ow; px++) {
          const x = px
          const y = py

          let n = Math.sin(x * 0.018 + t * 0.7) * Math.cos(y * 0.022 + t * 0.5) * 0.5
                + Math.sin(x * 0.009 + y * 0.013 + t * 0.4) * 0.3
                + Math.cos(x * 0.031 - y * 0.017 + t * 0.9) * 0.2

          // Mouse bulge in normalised space
          if (mouse.weight > 0) {
            const nx = px / ow
            const ny = py / oh
            const dx = nx - mouse.x
            const dy = ny - mouse.y
            const dist2 = dx * dx + dy * dy
            n += Math.exp(-dist2 / 0.04) * 0.35 * mouse.weight
          }

          const alpha = clamp((n + 1) * 0.5, 0, 1) * 0.09
          const i = (py * ow + px) * 4
          data[i]     = 26
          data[i + 1] = 26
          data[i + 2] = 24
          data[i + 3] = Math.round(alpha * 255)
        }
      }

      offCtx.putImageData(img, 0, 0)

      // Scale up to main canvas with smoothing
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.imageSmoothingEnabled = true
      ctx!.imageSmoothingQuality = 'high'
      ctx!.drawImage(off, 0, 0, canvas!.width, canvas!.height)

      t += 0.008
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}

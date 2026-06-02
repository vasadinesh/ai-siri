import { useEffect, useRef } from 'react'

export default function LiveWaveform({ active = false, color = '#4f7cff', height = 48, width = '100%' }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = height

    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    function draw() {
      ctx.clearRect(0, 0, W, H)

      if (!active) {
        // Flat idle line
        ctx.beginPath()
        ctx.moveTo(0, H / 2)
        ctx.lineTo(W, H / 2)
        ctx.strokeStyle = 'rgba(100,116,139,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        animRef.current = requestAnimationFrame(draw)
        return
      }

      tRef.current += 0.04

      // Draw multi-layer animated wave
      const layers = [
        { amp: 0.38, freq: 2.1, speed: 1.0,  alpha: 0.7, width: 2.5 },
        { amp: 0.22, freq: 3.7, speed: 1.6,  alpha: 0.5, width: 1.5 },
        { amp: 0.15, freq: 5.3, speed: 2.2,  alpha: 0.3, width: 1.0 }
      ]

      layers.forEach(({ amp, freq, speed, alpha, width: lw }) => {
        ctx.beginPath()
        for (let x = 0; x <= W; x += 2) {
          const pct = x / W
          const y   = H / 2 +
            Math.sin(pct * Math.PI * 2 * freq + tRef.current * speed) * H * amp +
            Math.sin(pct * Math.PI * 4 + tRef.current * speed * 0.7) * H * amp * 0.3

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        // Color from hex with alpha
        const r = parseInt(color.slice(1,3), 16)
        const g = parseInt(color.slice(3,5), 16)
        const b = parseInt(color.slice(5,7), 16)
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.lineWidth   = lw
        ctx.stroke()
      })

      // Glow effect on top layer
      ctx.beginPath()
      for (let x = 0; x <= W; x += 2) {
        const pct = x / W
        const y   = H / 2 +
          Math.sin(pct * Math.PI * 2 * 2.1 + tRef.current) * H * 0.38
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      const r2 = parseInt(color.slice(1,3), 16)
      const g2 = parseInt(color.slice(3,5), 16)
      const b2 = parseInt(color.slice(5,7), 16)
      ctx.shadowColor  = `rgba(${r2},${g2},${b2},0.6)`
      ctx.shadowBlur   = 8
      ctx.strokeStyle  = `rgba(${r2},${g2},${b2},0.9)`
      ctx.lineWidth    = 2.5
      ctx.stroke()
      ctx.shadowBlur   = 0

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [active, color, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block', borderRadius: 8 }}
    />
  )
}

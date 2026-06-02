import { useEffect, useRef } from 'react'

/**
 * SiriOrb — matches Apple Siri exactly:
 * - Deep translucent glass sphere shell
 * - 3 flowing petal shapes: crimson/rose, teal/cyan, purple/violet
 * - Bright white-blue light core that pulses
 * - Petals continuously morph and rotate like fluid ribbons
 * - State changes affect animation speed and glow intensity
 */
export default function SiriOrb({ state = 'idle', size = 260 }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const R  = size * 0.42   // sphere outer radius

    // ── speed per state ──────────────────────────────────────
    const speeds = { idle:0.006, speaking:0.022, listening:0.018, thinking:0.012, countdown:0.009 }

    // ── Bezier petal path helper ─────────────────────────────
    function petalPath(ctx, ox, oy, rx, ry, rot) {
      ctx.save()
      ctx.translate(ox, oy)
      ctx.rotate(rot)
      ctx.beginPath()
      // Draw a leaf/petal using cubic beziers
      const w = rx, h = ry
      ctx.moveTo(0, -h)
      ctx.bezierCurveTo( w*1.1, -h*0.5,  w*1.1,  h*0.5,  0,  h)
      ctx.bezierCurveTo(-w*1.1,  h*0.5, -w*1.1, -h*0.5,  0, -h)
      ctx.restore()
    }

    function draw(t) {
      ctx.clearRect(0, 0, size, size)
      const spd   = speeds[state] || speeds.idle
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5)   // 0→1 breathing pulse
      const energy = state === 'speaking'  ? 1.0
                   : state === 'listening' ? 0.85
                   : state === 'thinking'  ? 0.65
                   : state === 'countdown' ? 0.5
                   : 0.35                              // idle

      // ── 1. Deep navy background sphere ───────────────────
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      const bgGrad = ctx.createRadialGradient(cx - R*0.15, cy - R*0.2, R*0.05, cx, cy, R)
      bgGrad.addColorStop(0,   'rgba(28,20,65,0.97)')
      bgGrad.addColorStop(0.6, 'rgba(14,10,40,0.99)')
      bgGrad.addColorStop(1,   'rgba(8,6,25,1)')
      ctx.fillStyle = bgGrad
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      // ── 2. PETAL 1 — Crimson / Deep Rose ─────────────────
      const a1   = t * spd * 60 * 0.7          // slow orbital
      const p1rx = R * (0.52 + 0.06 * Math.sin(t * 1.1))
      const p1ry = R * (0.34 + 0.04 * Math.cos(t * 0.9))
      const p1ox = cx + R * 0.08 * Math.sin(t * 0.6)
      const p1oy = cy + R * 0.06 * Math.cos(t * 0.8)

      petalPath(ctx, p1ox, p1oy, p1rx, p1ry, a1 * Math.PI / 180 + Math.PI / 6)
      const g1 = ctx.createRadialGradient(p1ox, p1oy - p1ry*0.3, p1ry*0.05, p1ox, p1oy, p1ry*1.2)
      g1.addColorStop(0,   `rgba(255,80,100,${0.75 * energy + 0.1})`)
      g1.addColorStop(0.4, `rgba(200,30,80,${0.65 * energy})`)
      g1.addColorStop(0.8, `rgba(140,10,60,${0.45 * energy})`)
      g1.addColorStop(1,   'rgba(80,0,40,0)')
      ctx.fillStyle = g1
      ctx.fill()

      // ── 3. PETAL 2 — Teal / Cyan ─────────────────────────
      const a2   = -t * spd * 60 * 0.55 + Math.PI * 0.7
      const p2rx = R * (0.48 + 0.05 * Math.cos(t * 1.3))
      const p2ry = R * (0.30 + 0.05 * Math.sin(t * 1.1))
      const p2ox = cx + R * 0.10 * Math.cos(t * 0.5 + 1.2)
      const p2oy = cy + R * 0.08 * Math.sin(t * 0.7 + 0.8)

      petalPath(ctx, p2ox, p2oy, p2rx, p2ry, a2 + t * 0.008)
      const g2 = ctx.createRadialGradient(p2ox, p2oy + p2ry*0.2, p2ry*0.05, p2ox, p2oy, p2ry*1.2)
      g2.addColorStop(0,   `rgba(0,230,210,${0.72 * energy + 0.08})`)
      g2.addColorStop(0.35,`rgba(0,190,180,${0.62 * energy})`)
      g2.addColorStop(0.75,`rgba(0,130,150,${0.40 * energy})`)
      g2.addColorStop(1,   'rgba(0,60,80,0)')
      ctx.fillStyle = g2
      ctx.fill()

      // ── 4. PETAL 3 — Purple / Violet ─────────────────────
      const a3   = t * spd * 60 * 0.4 + Math.PI * 1.4
      const p3rx = R * (0.42 + 0.06 * Math.sin(t * 0.8 + 2))
      const p3ry = R * (0.26 + 0.04 * Math.cos(t * 1.2 + 1))
      const p3ox = cx + R * 0.06 * Math.sin(t * 0.9 + 2.5)
      const p3oy = cy + R * 0.09 * Math.cos(t * 0.6 + 1.5)

      petalPath(ctx, p3ox, p3oy, p3rx, p3ry, a3 - t * 0.006)
      const g3 = ctx.createRadialGradient(p3ox, p3oy, p3ry*0.08, p3ox, p3oy, p3ry*1.15)
      g3.addColorStop(0,   `rgba(160,80,255,${0.70 * energy + 0.08})`)
      g3.addColorStop(0.4, `rgba(120,40,220,${0.58 * energy})`)
      g3.addColorStop(0.8, `rgba(70,10,160,${0.35 * energy})`)
      g3.addColorStop(1,   'rgba(30,0,80,0)')
      ctx.fillStyle = g3
      ctx.fill()

      // ── 5. BRIGHT WHITE-BLUE CORE ─────────────────────────
      const coreR    = R * (0.18 + 0.04 * pulse) * energy + R * 0.06
      const coreFade = R * coreR * 3.5

      // outer diffuse glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.65)
      glowGrad.addColorStop(0,   `rgba(220,240,255,${0.55 * energy + 0.05 * pulse})`)
      glowGrad.addColorStop(0.2, `rgba(160,200,255,${0.30 * energy})`)
      glowGrad.addColorStop(0.5, `rgba(80,130,220,${0.14 * energy})`)
      glowGrad.addColorStop(1,   'rgba(40,60,160,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.65, 0, Math.PI * 2)
      ctx.fillStyle = glowGrad
      ctx.fill()

      // tight bright core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5)
      coreGrad.addColorStop(0,   `rgba(255,255,255,${0.95 * energy + 0.1})`)
      coreGrad.addColorStop(0.15,`rgba(230,245,255,${0.88 * energy})`)
      coreGrad.addColorStop(0.5, `rgba(160,210,255,${0.55 * energy})`)
      coreGrad.addColorStop(1,   'rgba(80,140,220,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // hotspot specular
      ctx.beginPath()
      ctx.arc(cx + coreR * 0.1, cy - coreR * 0.15, coreR * 0.55, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${0.92 * energy + 0.08})`
      ctx.fill()

      ctx.restore()

      // ── 6. GLASS SPHERE SHELL ────────────────────────────
      // inner edge glow
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      const rimGrad = ctx.createRadialGradient(cx, cy, R*0.82, cx, cy, R)
      rimGrad.addColorStop(0,   'rgba(100,120,200,0)')
      rimGrad.addColorStop(0.7, 'rgba(80,100,180,0.08)')
      rimGrad.addColorStop(1,   'rgba(120,160,220,0.22)')
      ctx.fillStyle = rimGrad
      ctx.fill()

      // glass stroke
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(140,160,230,0.18)'
      ctx.lineWidth   = 1.5
      ctx.stroke()

      // top-left specular highlight
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()
      const hlGrad = ctx.createRadialGradient(cx - R*0.38, cy - R*0.42, 0, cx - R*0.38, cy - R*0.42, R*0.52)
      hlGrad.addColorStop(0,   'rgba(255,255,255,0.18)')
      hlGrad.addColorStop(0.5, 'rgba(200,220,255,0.06)')
      hlGrad.addColorStop(1,   'rgba(180,200,255,0)')
      ctx.fillStyle = hlGrad
      ctx.beginPath()
      ctx.ellipse(cx - R*0.28, cy - R*0.35, R*0.38, R*0.22, -Math.PI/5, 0, Math.PI*2)
      ctx.fill()
      ctx.restore()
    }

    function loop() {
      tRef.current += speeds[state] || speeds.idle
      draw(tRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, size])

  return (
    <canvas
      ref={canvasRef}
      className="no-transition"
      style={{ width:size, height:size, borderRadius:'50%', display:'block' }}
    />
  )
}

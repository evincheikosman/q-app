'use client'

/**
 * QMarkLoader — the Q mark loading animation.
 *
 * An amber dot pulses, then traces the Q in one continuous swoop: bottom of
 * the bowl (6 o'clock), left-first around the bowl (6→9→12→3→6), dip into
 * the left tip of the tail swash, then left-to-right along the tail —
 * gradually fading out as it runs so it's gone at the tip. Full Q holds,
 * fades, loops.
 *
 * Renders the real Bricolage Grotesque 800 "Q" on an offscreen canvas and
 * progressively reveals it with an accumulating circle mask.
 *
 * Correctness guarantees:
 * - Glyph position + geometry derive from measured ink box
 *   (actualBoundingBox*), both axes — the letterform can never clip.
 * - Mask circles are interpolated between frames (no gaps at speed), and the
 *   mask floods at the end of the draw phase, so the FULL Q — tail included —
 *   is always visible when the dot finishes its trace.
 */

import { useEffect, useRef } from 'react'

const PULSE_DUR = 1000
const DRAW_DUR = 3400
const HOLD_DUR = 1600
const FADE_DUR = 600

interface QMarkLoaderProps {
  /** Logical width in px (default 134) */
  width?: number
  /** Logical height in px (default 150) */
  height?: number
  /** Font size in px (default 112) */
  fontSize?: number
  /** Q letterform color (default forest) */
  qColor?: string
  /** Dot color (default amber) */
  dotColor?: string
}

function mk(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export default function QMarkLoader({
  width = 134,
  height = 150,
  fontSize = 112,
  qColor = '#101012',
  dotColor = '#AEC8F5',
}: QMarkLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let cancelled = false

    // next/font hashes the family name — read the real one off the element
    const family =
      getComputedStyle(canvas).fontFamily || "'Bricolage Grotesque', sans-serif"

    function start() {
      if (cancelled || !canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const PW = width * dpr
      const PH = height * dpr
      canvas.width = PW
      canvas.height = PH
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // ── Measure + fit the glyph (both axes) ──
      const off = mk(PW, PH)
      const oc = off.getContext('2d')!
      const pad = Math.min(PW, PH) * 0.04
      let F = fontSize * dpr
      oc.font = `800 ${F}px ${family}`
      let meas = oc.measureText('Q')
      let asc = meas.actualBoundingBoxAscent
      let desc = meas.actualBoundingBoxDescent
      let bbL = meas.actualBoundingBoxLeft
      let bbR = meas.actualBoundingBoxRight
      const fit = Math.min(
        1,
        (PH - pad * 2) / (asc + desc),
        (PW - pad * 2) / (bbL + bbR)
      )
      if (fit < 1) {
        F = Math.floor(F * fit)
        oc.font = `800 ${F}px ${family}`
        meas = oc.measureText('Q')
        asc = meas.actualBoundingBoxAscent
        desc = meas.actualBoundingBoxDescent
        bbL = meas.actualBoundingBoxLeft
        bbR = meas.actualBoundingBoxRight
      }
      const inkW = bbL + bbR
      const QX = (PW - inkW) / 2 + bbL // fillText origin, ink-centered
      const QY = (PH - (asc + desc)) / 2 + asc
      oc.fillStyle = qColor
      oc.fillText('Q', QX, QY)

      // Ink box in physical px
      const inkL = QX - bbL
      const inkR = QX + bbR
      const inkT = QY - asc
      const inkB = QY + desc

      // ── Geometry derived from the measured ink box ──
      // Bowl spans roughly ink-top → baseline; tail swash sits below baseline.
      const strokeHalf = F * 0.1
      const CX = (inkL + inkR) / 2
      const CY = inkT + asc * 0.5
      const RX = inkW / 2 - strokeHalf
      const RY = asc / 2 - strokeHalf
      const CLIP_R = F * 0.24
      const DOT_R = F * 0.054

      const maskC = mk(PW, PH)
      const mc = maskC.getContext('2d')!
      const workC = mk(PW, PH)
      const wc = workC.getContext('2d')!

      // ── Continuous three-segment path (no jumps) ──
      // 1. Bowl: 6 o'clock → 9 → 12 → 3 → back to ~6 (nearly full circle)
      // 2. Zigzag: dip down-left from bowl bottom into the LEFT tip of the tail swash
      // 3. Tail: ride the swash left-to-right off the tip
      const ARC_SWEEP = (344 * Math.PI) / 180
      const arcEndA = Math.PI / 2 + ARC_SWEEP
      const arcEX = CX + RX * Math.cos(arcEndA)
      const arcEY = CY + RY * Math.sin(arcEndA)
      const tailLX = inkL + strokeHalf * 0.6 // left tip of the swash
      const tailLY = QY + desc * 0.45
      const tailEX = inkR - strokeHalf * 0.6 // right tip of the swash
      const tailEY = inkB - strokeHalf
      // Spring direction = final travel direction along the tail
      const tailNLen = Math.hypot(tailEX - tailLX, tailEY - tailLY) || 1
      const tailNX = (tailEX - tailLX) / tailNLen
      const tailNY = (tailEY - tailLY) / tailNLen

      function cubic(
        u: number,
        p0x: number, p0y: number, c1x: number, c1y: number,
        c2x: number, c2y: number, p1x: number, p1y: number
      ) {
        const v = 1 - u
        return {
          x: v * v * v * p0x + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * p1x,
          y: v * v * v * p0y + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * p1y,
        }
      }

      const A1 = 0.68 // bowl
      const A2 = 0.8 // zigzag into left tail

      function getPoint(t: number) {
        if (t <= A1) {
          const a = Math.PI / 2 + (t / A1) * ARC_SWEEP
          return { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) }
        }
        if (t <= A2) {
          const u = (t - A1) / (A2 - A1)
          return cubic(
            u,
            arcEX, arcEY,
            arcEX - RX * 0.55, arcEY + F * 0.06, // keep momentum left + down
            tailLX + F * 0.18, tailLY - F * 0.1, // approach left tip from above
            tailLX, tailLY
          )
        }
        const u = (t - A2) / (1 - A2)
        return tailPoint(u)
      }

      // Point along the tail swash, u: 0 = left tip, 1 = right tip
      function tailPoint(u: number) {
        return cubic(
          u,
          tailLX, tailLY,
          tailLX + (tailEX - tailLX) * 0.35, tailLY + F * 0.09, // wave dips…
          tailLX + (tailEX - tailLX) * 0.7, tailEY - F * 0.07, // …then lifts
          tailEX, tailEY
        )
      }

      function compositeWork() {
        wc.clearRect(0, 0, PW, PH)
        wc.drawImage(off, 0, 0)
        wc.globalCompositeOperation = 'destination-in'
        wc.drawImage(maskC, 0, 0)
        wc.globalCompositeOperation = 'source-over'
      }

      function maskCircle(x: number, y: number, r: number) {
        mc.beginPath()
        mc.arc(x, y, r, 0, 2 * Math.PI)
        mc.fill()
      }

      function drawDot(x: number, y: number, r: number, alpha: number) {
        if (!ctx) return
        ctx.save()
        ctx.globalAlpha = alpha
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
        g.addColorStop(0, dotColor + 'BB')
        g.addColorStop(0.4, dotColor + '55')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r * 3, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = dotColor
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()
      }

      let phase: 'pulse' | 'draw' | 'hold' | 'fadeout' = 'pulse'
      let t0: number | null = null
      let lastP: { x: number; y: number } | null = null

      function tick(ts: number) {
        if (cancelled || !ctx) return
        if (t0 === null) t0 = ts
        const el = ts - t0

        if (phase === 'pulse') {
          // Just a pulsing amber dot — nothing revealed yet
          const p0 = getPoint(0)
          const s = 1 + 0.22 * Math.sin((el / PULSE_DUR) * Math.PI * 3)
          ctx.clearRect(0, 0, PW, PH)
          drawDot(p0.x, p0.y, DOT_R * s, 1)
          if (el >= PULSE_DUR) {
            phase = 'draw'
            t0 = ts
          }
        } else if (phase === 'draw') {
          const prog = Math.min(el / DRAW_DUR, 1)
          const ease = prog < 0.5 ? 4 * prog ** 3 : 1 - (-2 * prog + 2) ** 3 / 2
          const p = getPoint(ease)

          mc.fillStyle = '#fff'
          // Reveal radius blooms up from the dot at the start of the draw
          const rr = CLIP_R * Math.min(1, 0.25 + ease * 6)
          // While tracing the bowl, clip the reveal to the bowl region so the
          // tail below never appears before the dot reaches it
          const bowlOnly = ease <= A1
          if (bowlOnly) {
            mc.save()
            mc.beginPath()
            // Boundary sits above the baseline — the swash top rises slightly
            // past it, so clipping at the baseline leaked a sliver of tail
            mc.rect(0, 0, PW, QY - F * 0.07)
            mc.clip()
          }
          // Interpolate between frames so fast segments leave no gaps
          if (lastP) {
            const d = Math.hypot(p.x - lastP.x, p.y - lastP.y)
            const n = Math.ceil(d / (rr * 0.4))
            for (let i = 1; i <= n; i++) {
              const k = i / n
              maskCircle(lastP.x + (p.x - lastP.x) * k, lastP.y + (p.y - lastP.y) * k, rr)
            }
          } else {
            maskCircle(p.x, p.y, rr)
          }
          if (bowlOnly) mc.restore()
          lastP = p

          if (prog >= 1) {
            // Flood the mask — guarantees the FULL Q (tail included) is visible
            mc.fillRect(0, 0, PW, PH)
          }
          compositeWork()

          ctx.clearRect(0, 0, PW, PH)
          ctx.drawImage(workC, 0, 0)
          // Dot gradually fades during its final left-to-right run along the
          // tail — gone by the time it reaches the tip
          const dotAlpha = ease <= A2 ? 1 : 1 - (ease - A2) / (1 - A2)
          if (dotAlpha > 0.01) drawDot(p.x, p.y, DOT_R, dotAlpha)

          if (prog >= 1) {
            phase = 'hold'
            t0 = ts
          }
        } else if (phase === 'hold') {
          ctx.clearRect(0, 0, PW, PH)
          ctx.drawImage(workC, 0, 0)
          if (el >= HOLD_DUR) {
            phase = 'fadeout'
            t0 = ts
          }
        } else {
          const t = Math.min(el / FADE_DUR, 1)
          ctx.clearRect(0, 0, PW, PH)
          ctx.globalAlpha = 1 - t
          ctx.drawImage(workC, 0, 0)
          ctx.globalAlpha = 1
          if (t >= 1) {
            mc.clearRect(0, 0, PW, PH)
            phase = 'pulse'
            t0 = null
            lastP = null
          }
        }

        raf = requestAnimationFrame(tick)
      }

      raf = requestAnimationFrame(tick)
    }

    document.fonts
      .load(`800 ${fontSize}px ${family}`)
      .then(start)
      .catch(start)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [width, height, fontSize, qColor, dotColor])

  return <canvas ref={canvasRef} aria-hidden="true" />
}

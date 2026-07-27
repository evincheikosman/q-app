/**
 * Scribble — the instructor's marker (Permanent Marker). POWDER rules:
 * handwriting ONLY where it carries meaning. No decorative doodles.
 *
 * PEN COLORS (POWDER discipline — one accent, ever):
 *   PEN.ink    — marker on white/paper surfaces
 *   PEN.powder — marker on black surfaces & B&W photos
 * (violet/periwinkle kept as aliases so old call sites don't break)
 */

export const PEN = {
  ink: '#101012',
  powder: '#AEC8F5',
  violet: '#101012',
  periwinkle: '#AEC8F5',
} as const

/** Note cards — POWDER: paper-white, hairline border. Pastels are out. */
export const STICKY = {
  yellow: '#FFFFFF',
  lavender: '#FFFFFF',
  sage: '#FFFFFF',
} as const

interface ScribbleProps {
  color?: string
  width?: number
  className?: string
  style?: React.CSSProperties
}

/** Loopy arrow — points at the thing worth noticing */
export function ScribbleArrow({ color = '#101012', width = 64, className, style }: ScribbleProps) {
  return (
    <svg
      viewBox="0 0 64 54"
      width={width}
      height={(width / 64) * 54}
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M6 6 C 26 2, 44 10, 46 24 C 47 33, 38 38, 32 33 C 27 29, 33 21, 42 24 C 51 27, 55 38, 53 46"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M46 41 L 53 47 L 58 39" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Handwritten note — the pen actually says something */
export function PenNote({
  children,
  color = PEN.violet,
  size = 18,
  rotate = '-3deg',
  className,
  style,
}: {
  children: React.ReactNode
  color?: string
  size?: number
  rotate?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`font-pen inline-block ${className ?? ''}`}
      style={{
        color,
        fontSize: `${size}px`,
        lineHeight: 1.3,
        transform: `rotate(${rotate})`,
        transformOrigin: 'left center',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Marker highlight — a real hand swipe: wobbly edges, uneven ends, slight tilt */
export function Highlight({
  children,
  color = '#AEC8F5',
}: {
  children: React.ReactNode
  color?: string
}) {
  const swipe = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M4 17 C 12 12.5, 30 13.6, 48 12.8 C 66 12, 84 11.6, 97 13.4 L 95.5 22.5 C 78 24.6, 55 25.4, 34 25 C 20 24.7, 8 24.5, 2.5 22.8 Z" fill="${color}" opacity="0.9"/><path d="M6 15.5 C 20 13, 45 13.5, 70 12.6" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.55"/></svg>`
  )
  return (
    <span
      className="inline-block"
      style={{
        backgroundImage: `url("data:image/svg+xml,${swipe}")`,
        backgroundSize: '100% 100%',
        padding: '1px 7px 3px',
        transform: 'rotate(-1.2deg)',
      }}
    >
      {children}
    </span>
  )
}

/** Hand-drawn star — one loose stroke, uneven points, overshoots where it closes */
export function ScribbleStar({ color = '#101012', width = 22, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 26 26" width={width} height={width} fill="none" className={className} style={style} aria-hidden>
      <path
        d="M13.6 4.1 C 14.3 6.3, 14.9 7.8, 15.7 9.6 C 17.8 9.7, 19.6 9.6, 22.1 10.1 C 20.3 11.8, 18.9 12.7, 17.3 14.3 C 17.9 16.5, 18.7 18.3, 19 20.9 C 16.9 19.6, 15.4 18.4, 13.3 17.3 C 11.3 18.7, 9.8 19.9, 7.5 20.9 C 8.2 18.5, 8.6 16.8, 9 14.6 C 7.3 13.1, 5.7 12, 4.2 10.2 C 6.5 9.9, 8.4 10, 10.6 9.8 C 11.5 7.7, 12.1 6, 12.9 3.5 C 13.1 4.4, 13.3 4.9, 13.9 5.6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Doodled music notes — wobbly eighth notes, drawn quick */
export function ScribbleMusicNotes({ color = '#101012', width = 30, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 32 30" width={width} height={(width / 32) * 30} fill="none" className={className} style={style} aria-hidden>
      {/* beam, slightly bowed */}
      <path d="M11.5 6.5 C 16.5 4.6, 20.5 4.2, 25.8 4.8 L 26.2 8.2 C 21 7.6, 17 8, 12 9.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {/* stems */}
      <path d="M12 7.6 C 11.8 12, 11.9 15.5, 11.6 19.5 M25.9 6 C 25.8 10, 26 13, 25.8 17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* note heads — loose loops */}
      <path d="M11.4 19.2 C 11.6 21.4, 9.9 23.2, 8 22.8 C 6.2 22.4, 5.8 20.1, 7.3 19 C 8.8 17.9, 11.2 18.2, 11.5 19.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M25.7 16.8 C 26 19, 24.3 20.8, 22.4 20.4 C 20.6 20, 20.2 17.7, 21.7 16.6 C 23.2 15.5, 25.5 15.8, 25.8 17.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Sweating face — "that one was HARD". Lumpy, uneven, drawn in two seconds. */
export function ScribbleSweat({ color = '#101012', width = 26, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 28 28" width={width} height={width} fill="none" className={className} style={style} aria-hidden>
      {/* face — lumpy circle that doesn't quite close, flatter on the left */}
      <path
        d="M13 4.8 C 17.5 3.8, 22 6.5, 23.2 11 C 24.3 15.2, 23 19.8, 19.5 22.2 C 15.8 24.7, 10.5 24.2, 7.5 21.2 C 4.8 18.5, 4.2 14, 5.6 10.4 C 6.8 7.3, 9.2 5.2, 12.2 4.9"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* eyes: >< effort — different sizes, different angles */}
      <path d="M8.8 11.2 L11.6 12.9 L9.2 14.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.2 11.6 L16.6 12.7 L18.9 13.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* mouth — shaky, drifting downhill */}
      <path d="M10 18.2 C 11.2 17.3, 12 19, 13.4 18.1 C 14.6 17.4, 15.4 18.9, 16.8 18.4 C 17.3 18.2, 17.7 18.5, 18 18.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* sweat drop — open at the top like a flick of the pen */}
      <path d="M25 5.8 C 26.2 7.7, 27 9.3, 26 10.6 C 25.1 11.7, 23.5 11.3, 23.2 10 C 22.9 8.9, 23.7 7.3, 24.6 6.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Hand-drawn heart — lopsided and quick, like the margins of a real notebook:
 *  big droopy left lobe, smaller flatter right lobe, off-center point, line that
 *  wavers as it goes, small open gap at the dip. Deliberately imperfect. */
export function ScribbleHeart({ color = '#101012', width = 90, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 100 92" width={width} height={(width / 100) * 92} fill="none" className={className} style={style} aria-hidden>
      <path
        d="M54 31
           C 52.5 25.5, 48 17.5, 41 13.8
           C 34.5 10.5, 25 10.8, 19.5 16.5
           C 14.5 21.5, 13.2 29, 15.8 36.5
           C 18 42.5, 23 49, 28.5 55.5
           C 33 60.5, 38.5 66.5, 42.5 72
           C 44.5 74.8, 46.2 77.8, 47.3 80.5
           C 50.5 75.5, 54.5 71, 59.5 65.5
           C 64.5 60, 71 53, 75.5 46.5
           C 79.8 40, 82.5 32.5, 80.8 26
           C 79.2 20, 74 16, 68 16.8
           C 62 17.7, 57.5 22.5, 55.8 27.8"
        stroke={color}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A Lagree spring — loose coil with hook rings, drawn quick */
export function ScribbleSpring({ color = '#101012', width = 110, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 120 36" width={width} height={(width / 120) * 36} fill="none" className={className} style={style} aria-hidden>
      {/* left ring */}
      <path d="M14 18 C 14 12.6, 9 11, 6 14 C 3 17, 4.6 22.6, 9.6 23 C 13 23.2, 14.6 20.6, 14.2 17.4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      {/* coil */}
      <path d="M15 18 C 20 8, 26 8, 30 17 C 33 24, 38 25, 41 17 C 44 9, 50 8, 53 17 C 56 24.6, 61 25, 64 17 C 67 9.6, 73 8.6, 76 17 C 79 24, 84 24.6, 87 17 C 89.6 10, 95 9, 98 16.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* right hook */}
      <path d="M98.6 17 C 103 13, 110 12.6, 113.6 16.6 C 116 19.4, 114.6 23, 111 23.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/** Water bottle doodle — hydrate or die-drate */
export function ScribbleBottle({ color = '#101012', width = 26, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 30 66" width={width} height={(width / 30) * 66} fill="none" className={className} style={style} aria-hidden>
      {/* cap */}
      <path d="M11 6.5 C 13.6 5.4, 16.6 5.5, 19 6.6 L 18.6 12 L 11.6 12 Z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* body */}
      <path d="M11.4 12.4 C 7 16, 5.6 20, 5.8 26 C 6 38, 5.4 48, 6.4 55 C 7 59.6, 10 61.6, 15 61.8 C 20 62, 23.4 60.4, 24 55.6 C 24.8 48, 24.4 38, 24.4 26.4 C 24.4 20.4, 22.8 15.8, 18.8 12.4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      {/* level line */}
      <path d="M8 34 C 13 32.6, 18 33, 22.4 34.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

/** A little cat. Just because. */
export function ScribbleCat({ color = '#101012', width = 34, className, style }: ScribbleProps) {
  return (
    <svg viewBox="0 0 40 34" width={width} height={(width / 40) * 34} fill="none" className={className} style={style} aria-hidden>
      {/* head with ears */}
      <path
        d="M12 12 L10 5.5 L15 9 C 17.5 7.8, 21.5 7.8, 24 9 L29 5.5 L27 12 C 28.6 14, 28.8 17, 27.5 19.4 C 25.5 23, 13.8 23.2, 12 19.4 C 10.8 17, 10.8 14, 12 12 Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* eyes */}
      <path d="M16.5 14.5 L16.5 15.8 M23 14.5 L23 15.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      {/* nose + mouth */}
      <path d="M19.7 17.3 L19.9 18.2 M18.3 19.6 C 19 20.2, 20.6 20.2, 21.3 19.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* whiskers */}
      <path d="M11.5 15.5 L7 14.8 M11.5 17.5 L7.5 18 M28 15.5 L32.5 14.8 M28 17.5 L32 18" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* tail flick */}
      <path d="M29 22.5 C 33 24.5, 36.5 23, 37.5 19.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

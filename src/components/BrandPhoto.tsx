/**
 * BrandPhoto — the ONLY way photos appear in Q. (See Q_art_direction.md)
 * POWDER: photos are ALWAYS high-contrast B&W (never duotone, never color),
 * with a black gradient footer, powder small-caps caption, white headline,
 * and optional pen annotations (the instructor's marker).
 */

interface Annotation {
  /** Percent-based position of the annotation's top-left */
  top?: string
  left?: string
  right?: string
  bottom?: string
  /** Optional rotation, e.g. '-12deg' */
  rotate?: string
  children: React.ReactNode
}

interface BrandPhotoProps {
  src: string
  alt: string
  height: number
  /** CSS object-position, e.g. '50% 40%' */
  position?: string
  /** Small-caps powder label */
  caption: string
  /** Optional bold ink headline under the caption */
  headline?: string
  annotations?: Annotation[]
  className?: string
  style?: React.CSSProperties
}

export default function BrandPhoto({
  src,
  alt,
  height,
  position = '50% 50%',
  caption,
  headline,
  annotations = [],
  className,
  style,
}: BrandPhotoProps) {
  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-border ${className ?? ''}`}
      style={{ height: `${height}px`, ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: position }}
      />

      {/* anchors the caption */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.65) 100%)' }}
      />

      {/* the pen */}
      {annotations.map((a, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: a.top,
            left: a.left,
            right: a.right,
            bottom: a.bottom,
            transform: a.rotate ? `rotate(${a.rotate})` : undefined,
          }}
        >
          {a.children}
        </div>
      ))}

      <div className="absolute left-5 bottom-4 right-5">
        <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: '#AEC8F5' }}>
          {caption}
        </p>
        {headline && (
          <p className="text-lg font-extrabold text-white leading-tight mt-0.5">{headline}</p>
        )}
      </div>
    </div>
  )
}

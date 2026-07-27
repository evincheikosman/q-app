'use client'

/**
 * Loads the pen's handwriting font (Zeyada) browser-side.
 * Build-time font fetching (next/font / CSS @import) fails in this dev
 * environment, so the browser fetches it directly — same approach as the
 * animation prototype, which loads Google Fonts without issue.
 */

import { useEffect } from 'react'

const HREF = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap'

export default function PenFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = 'https://fonts.gstatic.com'
    preconnect.crossOrigin = 'anonymous'
    const sheet = document.createElement('link')
    sheet.rel = 'stylesheet'
    sheet.href = HREF
    document.head.append(preconnect, sheet)
  }, [])

  return null
}

'use client'

/**
 * useUndoToast — a small black toast above the nav with a powder Undo button.
 * Destructive actions (delete note, remove move) should always offer a way back.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface ToastState {
  message: string
  onUndo?: () => void
}

export function useUndoToast(durationMs = 5000) {
  const [state, setState] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setState(null)
  }, [])

  const show = useCallback(
    (message: string, onUndo?: () => void) => {
      if (timer.current) clearTimeout(timer.current)
      setState({ message, onUndo })
      timer.current = setTimeout(() => setState(null), durationMs)
    },
    [durationMs]
  )

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const toast = state ? (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full pl-5 pr-2 py-2 shadow-lg"
      style={{ bottom: '88px', backgroundColor: '#0D0D0F', maxWidth: 'calc(100vw - 40px)' }}
    >
      <span className="text-xs font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
        {state.message}
      </span>
      {state.onUndo && (
        <button
          onClick={() => {
            state.onUndo?.()
            dismiss()
          }}
          className="shrink-0 text-xs font-bold rounded-full px-3 py-1.5 active:opacity-80"
          style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
        >
          Undo
        </button>
      )}
    </div>
  ) : null

  return { toast, show }
}

'use client'

/**
 * Edit schedule — bottom sheet for the instructor's own weekly teaching
 * slots. No default days/times ship with the app; whatever's here is
 * exactly what the instructor typed in, and it's editable any time.
 */

import { useState } from 'react'
import { IconX, IconPlus, IconTrash } from '@tabler/icons-react'
import { DAY_NAMES, saveSchedule, type ClassSlot } from '@/lib/schedule'

function toTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function fromTimeValue(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  return { hour: h || 0, minute: m || 0 }
}

export default function ScheduleSheet({
  initial,
  onClose,
  onSaved,
}: {
  initial: ClassSlot[]
  onClose: () => void
  onSaved: (slots: ClassSlot[]) => void
}) {
  const [slots, setSlots] = useState<ClassSlot[]>(initial.length > 0 ? initial : [])

  function addSlot() {
    setSlots(prev => [...prev, { day: 6, hour: 10, minute: 0 }])
  }

  function updateSlot(i: number, patch: Partial<ClassSlot>) {
    setSlots(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function removeSlot(i: number) {
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  function save() {
    saveSchedule(slots)
    onSaved(slots)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13,13,15,0.5)' }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4 overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          maxHeight: 'min(85vh, 640px)',
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Your teaching schedule</p>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-stone hover:text-ink transition-colors">
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {slots.length === 0 ? (
          <p className="text-xs text-stone leading-relaxed">
            No classes added yet. Add the days and times you teach so Q can show your next class and link routines to it.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-surface border-2 border-border">
                <select
                  value={slot.day}
                  onChange={e => updateSlot(i, { day: Number(e.target.value) })}
                  className="text-sm font-semibold text-ink bg-transparent outline-none flex-1 min-w-0"
                >
                  {DAY_NAMES.map((name, d) => (
                    <option key={d} value={d}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={toTimeValue(slot.hour, slot.minute)}
                  onChange={e => updateSlot(i, fromTimeValue(e.target.value))}
                  className="text-sm font-semibold text-ink bg-transparent outline-none shrink-0"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  aria-label="Remove this class"
                  className="shrink-0 p-1.5 text-stone hover:text-ink transition-colors"
                >
                  <IconTrash size={15} stroke={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addSlot}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold rounded-2xl py-3 border-2 border-dashed border-border text-stone hover:text-ink hover:border-ink transition-colors"
        >
          <IconPlus size={15} stroke={2.5} />
          Add a class
        </button>

        <button
          onClick={save}
          className="w-full h-12 rounded-2xl font-semibold text-sm transition-all active:opacity-80"
          style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
        >
          Save schedule
        </button>
      </div>
    </div>
  )
}

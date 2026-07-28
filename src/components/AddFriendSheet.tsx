'use client'

/**
 * Add a friend — bottom sheet. Shows your own invite code to share, and a
 * field to enter someone else's. No accept/reject step: entering a valid
 * code connects you both immediately (fine for a small circle of testers;
 * see src/lib/social.ts for the connection model).
 */

import { useState } from 'react'
import { IconX, IconCopy, IconCheck } from '@tabler/icons-react'
import { addFriendByCode, type MyAccount } from '@/lib/social'

export default function AddFriendSheet({
  myAccount,
  onClose,
  onConnected,
}: {
  myAccount: MyAccount | null
  onClose: () => void
  onConnected: () => void
}) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'working' | 'connected' | 'already-friends' | 'not-found' | 'self' | 'unavailable'>('idle')
  const [copied, setCopied] = useState(false)

  async function connect() {
    if (!code.trim()) return
    setStatus('working')
    const result = await addFriendByCode(code)
    setStatus(result)
    if (result === 'connected' || result === 'already-friends') {
      onConnected()
    }
  }

  function copyCode() {
    if (!myAccount) return
    navigator.clipboard?.writeText(myAccount.inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const message: Record<string, string> = {
    'not-found': "No one has that code — double-check it with them.",
    self: "That's your own code — have them enter it on their phone instead.",
    unavailable: "Couldn't connect right now. Try again in a moment.",
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13,13,15,0.5)' }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5 overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          maxHeight: 'min(85vh, 640px)',
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Add a friend</p>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-stone hover:text-ink transition-colors">
            <IconX size={16} stroke={2} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">Your code</p>
          <button
            onClick={copyCode}
            disabled={!myAccount}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 disabled:opacity-40"
            style={{ backgroundColor: '#0D0D0F' }}
          >
            <span className="font-extrabold text-xl tracking-[4px]" style={{ color: '#AEC8F5' }}>
              {myAccount?.inviteCode ?? '——————'}
            </span>
            {copied ? (
              <IconCheck size={16} stroke={2.5} style={{ color: '#AEC8F5' }} />
            ) : (
              <IconCopy size={16} stroke={2} style={{ color: '#AEC8F5' }} />
            )}
          </button>
          <p className="text-xs text-stone leading-relaxed">Share this with a friend so they can add you.</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">Enter their code</p>
          <div className="flex items-center gap-2">
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setStatus('idle') }}
              onKeyDown={e => { if (e.key === 'Enter') connect() }}
              placeholder="ABC123"
              maxLength={6}
              className="flex-1 min-w-0 text-base font-bold tracking-[3px] text-center rounded-2xl px-4 py-3.5 bg-surface border-2 border-border text-ink placeholder:text-stone/40 outline-none focus:border-powder transition-colors"
            />
            <button
              onClick={connect}
              disabled={!code.trim() || status === 'working'}
              className="shrink-0 rounded-2xl px-5 py-3.5 font-bold text-sm disabled:opacity-30 transition-opacity"
              style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
            >
              Add
            </button>
          </div>
          {status === 'connected' && (
            <p className="text-xs font-semibold text-ink">Connected! They&apos;ll show up in Community and Messages now.</p>
          )}
          {status === 'already-friends' && (
            <p className="text-xs font-semibold text-ink">You&apos;re already connected.</p>
          )}
          {message[status] && <p className="text-xs text-stone">{message[status]}</p>}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconSparkles,
  IconBooks,
  IconChartBar,
  IconUsers,
  IconMail,
} from '@tabler/icons-react'
import { totalUnread } from '@/lib/instructors'

const tabs = [
  { label: 'Home', href: '/home', icon: IconHome },
  { label: 'Build', href: '/build', icon: IconSparkles },
  { label: 'Library', href: '/library', icon: IconBooks },
  { label: 'Your Cue', href: '/your-cue', icon: IconChartBar },
  { label: 'Community', href: '/community', icon: IconUsers },
  { label: 'Messages', href: '/messages', icon: IconMail },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  // Recompute the badge on navigation and whenever messages change
  useEffect(() => {
    const update = () => {
      try {
        setUnread(totalUnread())
      } catch {}
    }
    update()
    window.addEventListener('q-messages-changed', update)
    return () => window.removeEventListener('q-messages-changed', update)
  }, [pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-canvas border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch w-full app-column" style={{ minHeight: 0, borderTop: 'none' }}>
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const showBadge = label === 'Messages' && unread > 0
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors"
            aria-label={showBadge ? `${label} — ${unread} unread` : label}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative">
              <Icon
                size={24}
                stroke={active ? 2 : 1.5}
                color={active ? '#101012' : '#8A8A8A'}
              />
              {showBadge && (
                <span
                  className="absolute flex items-center justify-center rounded-full font-extrabold"
                  style={{
                    top: '-5px',
                    right: '-9px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    fontSize: '10px',
                    backgroundColor: '#AEC8F5',
                    color: '#0D0D0F',
                    border: '2px solid #FFFFFF',
                  }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </span>
            <span
              className="text-[10px] leading-none"
              style={{ color: active ? '#101012' : '#8A8A8A', fontWeight: active ? 700 : 500 }}
            >
              {label}
            </span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: active ? '#AEC8F5' : 'transparent' }}
            />
          </Link>
        )
      })}
      </div>
    </nav>
  )
}

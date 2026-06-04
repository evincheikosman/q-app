'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconSparkles,
  IconBooks,
  IconChartBar,
  IconUser,
} from '@tabler/icons-react'

const tabs = [
  { label: 'Home', href: '/home', icon: IconHome },
  { label: 'Build', href: '/build', icon: IconSparkles },
  { label: 'Library', href: '/library', icon: IconBooks },
  { label: 'Your Cue', href: '/your-cue', icon: IconChartBar },
  { label: 'Profile', href: '/profile', icon: IconUser },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-canvas border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              size={24}
              stroke={1.5}
              color={active ? '#1B3828' : '#7A7570'}
            />
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: active ? '#1B3828' : '#7A7570' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

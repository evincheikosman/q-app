import Link from 'next/link'

// Weekly recurring schedule: day (0=Sun … 6=Sat), hour, minute (local time)
const SCHEDULE = [
  { day: 6, hour: 11, minute: 0 },   // Saturday  11:00 AM
  { day: 6, hour: 11, minute: 50 },  // Saturday  11:50 AM
  { day: 0, hour: 10, minute: 10 },  // Sunday    10:10 AM
  { day: 0, hour: 11, minute: 0 },   // Sunday    11:00 AM
]

function nextOccurrence(day: number, hour: number, minute: number, now: Date): Date {
  const currentDay = now.getDay()
  let daysUntil = (day - currentDay + 7) % 7

  // If today, check whether the slot has already passed
  if (daysUntil === 0) {
    const slot = new Date(now)
    slot.setHours(hour, minute, 0, 0)
    if (slot <= now) daysUntil = 7
  }

  const date = new Date(now)
  date.setDate(now.getDate() + daysUntil)
  date.setHours(hour, minute, 0, 0)
  date.setSeconds(0, 0)
  return date
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const now = new Date()

  const upcoming = SCHEDULE
    .map(({ day, hour, minute }) => nextOccurrence(day, hour, minute, now))
    .sort((a, b) => a.getTime() - b.getTime())

  const [nextClass, ...rest] = upcoming
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thisWeek = rest.filter(d => d <= sevenDaysOut)

  return (
    <div className="px-5 pt-14 pb-8 flex flex-col gap-8 max-w-lg mx-auto w-full">

      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-stone tracking-wide uppercase mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-4xl font-extrabold text-ink leading-tight">
          {greeting(now.getHours())},<br />Evîn.
        </h1>
      </div>

      {/* Next class */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
          Next class
        </h2>

        <div className="bg-surface rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-stone">{formatDate(nextClass)}</p>
              <p className="text-3xl font-extrabold text-ink mt-1 leading-none">
                {formatTime(nextClass)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-stone bg-canvas border border-border rounded-full px-3 py-1.5 mt-0.5">
              No routine yet
            </span>
          </div>
        </div>

        <Link
          href="/build"
          className="w-full bg-forest text-canvas font-semibold text-base rounded-2xl py-4 text-center block active:opacity-80 transition-opacity"
        >
          Build routine
        </Link>
      </section>

      {/* Upcoming this week */}
      {thisWeek.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
            Upcoming this week
          </h2>
          <div className="flex flex-col gap-2">
            {thisWeek.map((date, i) => (
              <div
                key={i}
                className="bg-surface rounded-xl px-4 py-3.5 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-ink">
                  {formatDate(date)}&nbsp;&middot;&nbsp;{formatTime(date)}
                </span>
                <span className="text-xs font-medium text-stone shrink-0 ml-3">
                  No routine
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent routines */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
          Recent routines
        </h2>
        <div className="bg-surface rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-1">
          <p className="text-sm font-medium text-stone">Nothing here yet.</p>
          <p className="text-sm text-stone opacity-70">Build your first routine.</p>
        </div>
      </section>

    </div>
  )
}

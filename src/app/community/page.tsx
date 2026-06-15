const FEED = [
  {
    name: 'Mara Velden',
    studio: 'Core 40 Amsterdam',
    milestone: 'just hit 300 classes taught',
    timestamp: '2 days ago',
  },
  {
    name: 'Jonah Reyes',
    studio: 'Core 40 Los Angeles',
    milestone: 'taught their first class',
    timestamp: '4 days ago',
  },
  {
    name: 'Suki Tanaka',
    studio: 'Core 40 San Francisco',
    milestone: 'routine favorited 10 times by other instructors',
    timestamp: '5 days ago',
  },
  {
    name: 'Lena Drost',
    studio: 'Core 40 Amsterdam',
    milestone: 'started a new instructor cohort',
    timestamp: '1 week ago',
  },
  {
    name: 'Caleb Monroe',
    studio: 'Core 40 Los Angeles',
    milestone: 'hit a 50-class streak',
    timestamp: '1 week ago',
  },
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('')
}

export default function CommunityPage() {
  return (
    <div className="px-5 pt-12 pb-10 flex flex-col gap-6 max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-ink">Community</h1>
        <span className="self-start text-xs font-medium text-stone bg-surface border border-border rounded-full px-3 py-1.5 leading-none">
          Preview — a look at what Community looks like with other instructors
        </span>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-3">
        {FEED.map((entry, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-start gap-4"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full border border-forest bg-forest/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-forest">{initials(entry.name)}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink leading-snug">
                <span className="font-semibold">{entry.name}</span>
                {' '}
                <span className="text-stone">{entry.milestone}.</span>
              </p>
              <p className="text-xs text-stone mt-1.5">{entry.studio} · {entry.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

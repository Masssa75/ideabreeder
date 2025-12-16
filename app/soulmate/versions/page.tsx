'use client'

/**
 * Version Selector - Compare all 5 UI designs
 */

const versions = [
  {
    id: 'v1',
    name: 'Light & Clean',
    description: 'Minimal white/cream background, soft shadows, airy feel',
    gradient: 'from-rose-50 to-white',
    textColor: 'text-gray-800',
    emoji: '💕',
    tags: ['Readable', 'Professional', 'Calm']
  },
  {
    id: 'v2',
    name: 'Dark Romantic',
    description: 'Deep purple/black with vibrant gradients, premium feel',
    gradient: 'from-purple-900 to-black',
    textColor: 'text-white',
    emoji: '✨',
    tags: ['Intimate', 'Premium', 'Nighttime']
  },
  {
    id: 'v3',
    name: 'Glassmorphism',
    description: 'Frosted glass effects on colorful gradient, modern trendy',
    gradient: 'from-violet-500 via-purple-500 to-pink-500',
    textColor: 'text-white',
    emoji: '💜',
    tags: ['Trendy', 'Ethereal', 'Modern']
  },
  {
    id: 'v4',
    name: 'Warm & Cozy',
    description: 'Peachy coral and warm earth tones, friendly inviting',
    gradient: 'from-orange-100 via-rose-50 to-amber-100',
    textColor: 'text-amber-900',
    emoji: '🧡',
    tags: ['Friendly', 'Approachable', 'Warm']
  },
  {
    id: 'v5',
    name: 'Bold Modern',
    description: 'High contrast black/white, strong typography, striking',
    gradient: 'from-black to-gray-900',
    textColor: 'text-white',
    emoji: '🖤',
    tags: ['Bold', 'Confident', 'Contemporary']
  }
]

export default function VersionSelector() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Soulmate UI Designs</h1>
        <p className="text-gray-400 text-center mb-10">
          5 different interface options based on UI/UX best practices
        </p>

        <div className="grid gap-4">
          {versions.map((v) => (
            <a
              key={v.id}
              href={`/soulmate/${v.id}`}
              className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-stretch">
                {/* Preview gradient */}
                <div className={`w-32 bg-gradient-to-br ${v.gradient} flex items-center justify-center shrink-0`}>
                  <span className="text-4xl">{v.emoji}</span>
                </div>

                {/* Info */}
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{v.name}</h2>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{v.id}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{v.description}</p>
                  <div className="flex gap-2">
                    {v.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center pr-5">
                  <span className="text-gray-600 group-hover:text-white transition-colors text-2xl">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-3">Research-Backed Design Decisions</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• <strong>Light backgrounds</strong> improve readability for prolonged use (V1, V4)</li>
            <li>• <strong>Dark mode</strong> uses #121212 instead of pure black to reduce eye strain (V2, V5)</li>
            <li>• <strong>Glassmorphism</strong> creates depth and modern feel (V3)</li>
            <li>• <strong>Warm tones</strong> evoke emotions of love and comfort (V4)</li>
            <li>• <strong>Input at bottom</strong> mirrors natural conversation flow</li>
            <li>• <strong>Message bubbles</strong> help distinguish sender from AI</li>
            <li>• <strong>Typing indicators</strong> show the AI is responding</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a href="/soulmate" className="text-gray-500 hover:text-white text-sm">← Back to main soulmate page</a>
        </div>
      </div>
    </div>
  )
}

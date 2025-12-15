'use client';

import { useState, useEffect, useCallback } from 'react';

interface Api {
  id: string;
  title: string;
  hook: string;
  description: string;
  bullets: string[];
  what_it_contains: string[];
  who_uses_this: string[];
  technical: {
    auth: string;
    rate_limit: string;
    formats: string[];
    pricing?: string;
  };
  free: boolean;
  url: string;
  category: string;
}

type Mode = 'discover' | 'browse';

// Parse **bold** markers into highlighted spans
function parseHighlights(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="text-yellow-400">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export default function DataGoldPage() {
  const [mode, setMode] = useState<Mode>('discover');
  const [apis, setApis] = useState<Api[]>([]);
  const [currentApi, setCurrentApi] = useState<Api | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Browse mode filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch random API for Discovery mode
  const fetchRandomApi = useCallback(async () => {
    setTransitioning(true);
    try {
      const res = await fetch('/api/apis?random=true');
      const data = await res.json();
      setTimeout(() => {
        setCurrentApi(data.api);
        setTransitioning(false);
      }, 200);
    } catch (error) {
      console.error('Error fetching random API:', error);
      setTransitioning(false);
    }
  }, []);

  // Fetch APIs for Browse mode
  const fetchApis = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/apis?${params}`);
      const data = await res.json();
      setApis(data.apis || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching APIs:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  // Initial load
  useEffect(() => {
    if (mode === 'discover') {
      fetchRandomApi();
    } else {
      fetchApis();
    }
  }, [mode, fetchRandomApi, fetchApis]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'discover' && (e.key === ' ' || e.key === 'ArrowRight')) {
        e.preventDefault();
        fetchRandomApi();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, fetchRandomApi]);

  return (
    <div className="min-h-screen bg-black text-white">
      {mode === 'discover' ? (
        // Discovery Mode - "Did You Know?" style
        <div className="min-h-screen flex flex-col items-center justify-center px-8">
          <div
            className={`max-w-4xl w-full text-center transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentApi ? (
              <>
                {/* Eyebrow */}
                <div className="mb-12">
                  <span className="text-gray-500 text-sm uppercase tracking-[0.3em]">
                    Did you know?
                  </span>
                </div>

                {/* Main Hook - Large Typography */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-16">
                  {parseHighlights(currentApi.hook)}
                </h1>

                {/* Source */}
                <div className="mb-16">
                  <span className="text-gray-600">Source: </span>
                  <a
                    href={currentApi.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 underline underline-offset-4 hover:text-white transition-colors"
                  >
                    {currentApi.title}
                  </a>
                  <span className="text-gray-600">
                    {' '}— {currentApi.free ? 'completely free API' : 'paid API'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={fetchRandomApi}
                    className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
                  >
                    Show me another →
                  </button>
                  <button
                    onClick={() => setMode('browse')}
                    className="px-8 py-4 text-gray-500 border border-gray-800 rounded-full hover:text-white hover:border-gray-600 transition-colors"
                  >
                    Save this
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                {loading ? 'Loading...' : 'No APIs found. Add some first!'}
              </div>
            )}
          </div>

          {/* Keyboard Hint */}
          <div className="fixed bottom-8 text-gray-700 text-sm">
            press <span className="text-gray-500">space</span> for next
          </div>

          {/* Browse link */}
          <div className="fixed top-6 right-6">
            <button
              onClick={() => setMode('browse')}
              className="text-gray-600 hover:text-white text-sm transition-colors"
            >
              Browse all →
            </button>
          </div>
        </div>
      ) : (
        // Browse Mode
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-gray-900">
            <div className="text-xl font-bold flex items-center gap-2">
              <span>💎</span> DataGold
            </div>
            <button
              onClick={() => setMode('discover')}
              className="text-gray-600 hover:text-white text-sm transition-colors"
            >
              ← Back to discovery
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <input
              type="text"
              placeholder="Search APIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[250px] px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-3 rounded-lg text-sm transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-3 rounded-lg text-sm transition-all capitalize ${
                    categoryFilter === cat
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="text-gray-600 text-sm mb-5">
            Showing <strong className="text-gray-400">{apis.length}</strong> data sources
          </div>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-16 text-gray-600">Loading...</div>
            ) : apis.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                No APIs found. Add some using the ingestion script!
              </div>
            ) : (
              apis.map((api) => (
                <div
                  key={api.id}
                  className="p-6 bg-gray-950 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer group"
                  onClick={() => window.open(api.url, '_blank')}
                >
                  <div className="flex justify-between items-start gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {api.title}
                        </span>
                        {api.free && (
                          <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-xs rounded">
                            Free
                          </span>
                        )}
                      </div>
                      <div className="text-xl text-white leading-relaxed">
                        {parseHighlights(api.hook)}
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700">
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

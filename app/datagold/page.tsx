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

  // Parse bullet to highlight first word/number
  const parseBullet = (bullet: string) => {
    const parts = bullet.match(/^([\d,]+[+]?|[A-Za-z]+)\s*(.*)/);
    if (parts) {
      return { highlight: parts[1], rest: parts[2] };
    }
    return { highlight: bullet.split(' ')[0], rest: bullet.split(' ').slice(1).join(' ') };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {mode === 'discover' ? (
        // Discovery Mode (v6)
        <div className="min-h-screen flex flex-col items-center justify-center p-10">
          <div
            className={`max-w-xl w-full transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentApi ? (
              <>
                {/* Eyebrow */}
                <div className="text-center mb-8">
                  <span className="text-gray-500 text-sm uppercase tracking-widest">
                    {currentApi.free ? 'Free API' : 'Paid API'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-10">
                  {currentApi.title}
                </h1>

                {/* Bullets */}
                <ul className="mb-12 space-y-0">
                  {currentApi.bullets.slice(0, 6).map((bullet, i) => {
                    const { highlight, rest } = parseBullet(bullet);
                    return (
                      <li
                        key={i}
                        className="text-xl text-gray-400 py-4 border-b border-gray-900 last:border-0 flex items-baseline gap-4"
                      >
                        <span className="text-yellow-400 text-sm">●</span>
                        <span>
                          <span className="text-white font-semibold">{highlight}</span>{' '}
                          {rest}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Source Link */}
                <div className="text-center mb-12">
                  <a
                    href={currentApi.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 border-b border-yellow-400 pb-0.5 hover:text-white hover:border-white transition-colors"
                  >
                    View API docs →
                  </a>
                  <span className="text-gray-700 text-sm ml-3">
                    {currentApi.free ? 'free' : 'paid'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={fetchRandomApi}
                    className="px-10 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setMode('browse')}
                    className="px-10 py-4 text-gray-500 hover:text-white transition-colors"
                  >
                    Browse All
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
          <div className="fixed bottom-8 text-gray-800 text-sm">
            press <b>space</b> for next
          </div>

          {/* Mode Toggle */}
          <div className="fixed top-6 right-6">
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setMode('discover')}
                className="px-4 py-2 rounded-md text-sm transition-colors bg-gray-800 text-white"
              >
                Discover
              </button>
              <button
                onClick={() => setMode('browse')}
                className="px-4 py-2 rounded-md text-sm transition-colors text-gray-500"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Logo */}
          <div className="fixed top-6 left-6 text-xl font-bold flex items-center gap-2">
            <span>💎</span> DataGold
          </div>
        </div>
      ) : (
        // Browse Mode (v7)
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-gray-900">
            <div className="text-xl font-bold flex items-center gap-2">
              <span>💎</span> DataGold
            </div>
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setMode('discover')}
                className="px-4 py-2 rounded-md text-sm transition-colors text-gray-500"
              >
                Discover
              </button>
              <button
                onClick={() => setMode('browse')}
                className="px-4 py-2 rounded-md text-sm transition-colors bg-gray-800 text-white"
              >
                Browse
              </button>
            </div>
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

            <div className="flex gap-2">
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
          <div className="space-y-0.5">
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
                  className="grid grid-cols-[1fr_1fr_auto] gap-10 p-5 bg-gray-950 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer items-center group"
                  onClick={() => window.open(api.url, '_blank')}
                >
                  {/* Main Info */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {api.title}
                    </div>
                    <div className="text-lg text-white leading-snug">
                      {api.hook}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600 uppercase tracking-wider">
                        {api.category}
                      </span>
                      {api.free && (
                        <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-xs rounded">
                          Free
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {api.bullets.slice(0, 4).map((bullet, i) => {
                      const { highlight, rest } = parseBullet(bullet);
                      return (
                        <span key={i} className="text-sm text-gray-500">
                          <span className="text-yellow-400 font-semibold">{highlight}</span>{' '}
                          {rest}
                        </span>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-4 py-2 bg-white text-black text-sm rounded-md hover:scale-105 transition-transform">
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

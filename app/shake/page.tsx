'use client'

import { useState, useEffect } from 'react'

interface Earthquake {
  id: string
  magnitude: number
  place: string
  time: number
  depth: number
  coordinates: [number, number, number]
  url: string
  tsunami: number
}

interface UserLocation {
  lat: number
  lng: number
  name: string
}

// Default to Phuket if geolocation fails
const DEFAULT_LOCATION: UserLocation = { lat: 7.8804, lng: 98.3923, name: 'Phuket' }

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return 'bg-red-600 text-white'
  if (mag >= 6) return 'bg-orange-500 text-white'
  if (mag >= 5) return 'bg-yellow-500 text-black'
  if (mag >= 4) return 'bg-yellow-300 text-black'
  return 'bg-green-400 text-black'
}

function getMagnitudeEmoji(mag: number): string {
  if (mag >= 7) return '🔴'
  if (mag >= 6) return '🟠'
  if (mag >= 5) return '🟡'
  if (mag >= 4) return '🟢'
  return '⚪'
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ShakeAlert() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | '4.5' | '2.5'>('all')
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'denied' | 'error'>('loading')

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Try to get location name via reverse geocoding (free API)
        let locationName = 'Your Location'
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your Location'
        } catch {
          // Keep default name if geocoding fails
        }

        setUserLocation({ lat: latitude, lng: longitude, name: locationName })
        setLocationStatus('success')
      },
      (error) => {
        console.log('Geolocation error:', error.message)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

  const fetchEarthquakes = async () => {
    try {
      // Fetch different feeds based on filter
      const feedUrl = filter === '4.5'
        ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'
        : filter === '2.5'
        ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
        : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'

      const res = await fetch(feedUrl)
      const data = await res.json()

      const quakes: Earthquake[] = data.features.map((f: any) => ({
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        depth: f.geometry.coordinates[2],
        coordinates: f.geometry.coordinates,
        url: f.properties.url,
        tsunami: f.properties.tsunami
      }))

      // Sort by time (newest first)
      quakes.sort((a, b) => b.time - a.time)

      setEarthquakes(quakes)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch earthquakes:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarthquakes()
    const interval = setInterval(fetchEarthquakes, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [filter])

  const totalMagnitude = earthquakes.reduce((sum, q) => sum + q.magnitude, 0)
  const avgMagnitude = earthquakes.length > 0 ? (totalMagnitude / earthquakes.length).toFixed(1) : '0'
  const maxQuake = earthquakes.length > 0 ? earthquakes.reduce((max, q) => q.magnitude > max.magnitude ? q : max) : null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 to-orange-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            🌋 Shake Alert
            <span className="text-lg font-normal opacity-75">Real-time Earthquakes</span>
          </h1>
          <p className="mt-2 opacity-75">
            Live data from USGS • Auto-refreshes every 30s
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {locationStatus === 'loading' && (
              <span className="text-yellow-300">📍 Detecting your location...</span>
            )}
            {locationStatus === 'success' && (
              <span className="text-green-300">📍 Showing distances from {userLocation.name}</span>
            )}
            {locationStatus === 'denied' && (
              <span className="text-orange-300">📍 Location denied - using Phuket as default</span>
            )}
            {locationStatus === 'error' && (
              <span className="text-orange-300">📍 Location unavailable - using Phuket as default</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-3xl font-bold text-yellow-400">{earthquakes.length}</div>
              <div className="text-xs text-gray-400 uppercase">Quakes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">{avgMagnitude}</div>
              <div className="text-xs text-gray-400 uppercase">Avg Mag</div>
            </div>
            {maxQuake && (
              <div>
                <div className="text-3xl font-bold text-red-400">M{maxQuake.magnitude.toFixed(1)}</div>
                <div className="text-xs text-gray-400 uppercase">Strongest</div>
              </div>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}
            >
              All (1hr)
            </button>
            <button
              onClick={() => setFilter('2.5')}
              className={`px-3 py-1 rounded text-sm ${filter === '2.5' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}
            >
              M2.5+ (24hr)
            </button>
            <button
              onClick={() => setFilter('4.5')}
              className={`px-3 py-1 rounded text-sm ${filter === '4.5' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}
            >
              M4.5+ (24hr)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl animate-bounce">🌍</div>
            <p className="mt-4 text-gray-400">Loading earthquake data...</p>
          </div>
        ) : earthquakes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl">😌</div>
            <p className="mt-4 text-gray-400">No earthquakes in this time period. Earth is calm!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earthquakes.map((quake) => {
              const distance = getDistance(
                userLocation.lat, userLocation.lng,
                quake.coordinates[1], quake.coordinates[0]
              )

              return (
                <a
                  key={quake.id}
                  href={quake.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all hover:scale-[1.01] border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex items-start gap-4">
                    {/* Magnitude badge */}
                    <div className={`${getMagnitudeColor(quake.magnitude)} w-16 h-16 rounded-lg flex flex-col items-center justify-center font-bold shrink-0`}>
                      <div className="text-2xl">{quake.magnitude.toFixed(1)}</div>
                      <div className="text-xs opacity-75">MAG</div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">
                        {getMagnitudeEmoji(quake.magnitude)} {quake.place || 'Unknown location'}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-400">
                        <span>⏱️ {timeAgo(quake.time)}</span>
                        <span>📍 {quake.depth.toFixed(1)}km deep</span>
                        <span>🗺️ {distance.toFixed(0)}km from {userLocation.name}</span>
                        {quake.tsunami === 1 && (
                          <span className="text-red-400 font-bold">🌊 TSUNAMI WARNING</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right text-sm text-gray-500 shrink-0">
                      {new Date(quake.time).toLocaleTimeString()}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          {lastUpdate && (
            <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
          )}
          <p className="mt-1">
            Data from <a href="https://earthquake.usgs.gov" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">USGS Earthquake Hazards Program</a>
          </p>
          <p className="mt-4">
            <a href="/datagold" className="text-gray-400 hover:text-white">← Back to DataGold</a>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({
  className: 'lead-pin',
  html: `
    <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C8.16 1 1 8.16 1 17c0 11.6 16 28 16 28s16-16.4 16-28C33 8.16 25.84 1 17 1z"
            fill="#10B981" stroke="#0b3b2e" stroke-width="1.5"/>
      <circle cx="17" cy="17" r="6" fill="#ffffff"/>
    </svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 45],
  popupAnchor: [0, -40],
})

async function browserGeocode(location) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json()
  if (!data.length) return null
  return { lat: Number(data[0].lat), lon: Number(data[0].lon), display_name: data[0].display_name }
}

export default function LeadMap({ geo, location }) {
  const elRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    let cancelled = false
    if (geo?.geocoded && geo.lat != null) {
      setCoords({ lat: Number(geo.lat), lon: Number(geo.lon), display_name: geo.display_name })
      setStatus('ready')
    } else if (location) {
      setStatus('loading')
      browserGeocode(location)
        .then((c) => { if (cancelled) return; if (c) { setCoords(c); setStatus('ready') } else setStatus('nofix') })
        .catch(() => { if (!cancelled) setStatus('nofix') })
    } else {
      setStatus('nofix')
    }
    return () => { cancelled = true }
  }, [geo, location])

  useEffect(() => {
    if (!coords || !elRef.current) return
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([coords.lat, coords.lon], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    L.marker([coords.lat, coords.lon], { icon: pinIcon })
      .addTo(map)
      .bindPopup(coords.display_name || location || 'Preferred location')
      .openPopup()
    const t = setTimeout(() => map.invalidateSize(), 150)
    return () => { clearTimeout(t); map.remove() }
  }, [coords])

  if (status === 'loading') {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">Locating “{location}” on the map…</div>
  }
  if (!coords) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
        Location not mapped{location ? ` (“${location}” not found)` : ''}.
      </div>
    )
  }
  return (
    <div>
      <div ref={elRef} className="h-56 w-full overflow-hidden rounded-lg border border-slate-200" />
      {coords.display_name && <div className="mt-1.5 text-xs text-slate-500">📍 {coords.display_name}</div>}
    </div>
  )
}
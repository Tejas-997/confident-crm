import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Interactive map of the lead's preferred location (geocoded server-side).
// circleMarker avoids Leaflet's default marker-image bundling issues.
export default function LeadMap({ geo }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!geo?.geocoded || !elRef.current) return
    const { lat, lon } = geo
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lon], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    L.circleMarker([lat, lon], {
      radius: 9, color: '#172036', weight: 2, fillColor: '#10B981', fillOpacity: 0.9,
    }).addTo(map)
    mapRef.current = map
    const t = setTimeout(() => map.invalidateSize(), 120)
    return () => { clearTimeout(t); map.remove(); mapRef.current = null }
  }, [geo])

  if (!geo?.geocoded) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
        Location not mapped{geo?.query ? ` (“${geo.query}” not found)` : ''}.
      </div>
    )
  }
  return <div ref={elRef} className="h-56 w-full overflow-hidden rounded-lg border border-slate-200" />
}

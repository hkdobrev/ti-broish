import { useEffect, useState } from 'react'
import { BulgariaMap, type MapPoint } from './BulgariaMap'
import { geocodePlace } from '../signup/geo'
import { highlightCodes, placeOutline, type HomePlace } from '../signup/model'
import { sectionNumber } from '../signup/sections'
import { useOutlines } from '../signup/use-outlines'

function townPlain(name: string | undefined) {
  return (name ?? '').replace(/^(гр\.|с\.|к\.|ман\.)\s*/u, '')
}

function sectionQuery(place: HomePlace | null) {
  if (!place) return null
  const address = place.sectionPlace?.trim() ?? ''
  const town = townPlain(place.townName)
  if (place.regionCode === '32') {
    const query = [address || town, place.countryName].filter(Boolean).join(', ')
    return query || null
  }
  if (address && town) return `${address}, ${town}, България`
  if (address) return `${address}, България`
  if (town) return `${town}, България`
  return null
}

export function AssignedSectionMap({ place, section }: { place: HomePlace | null; section: string }) {
  const outlines = useOutlines(placeOutline(place))
  const [point, setPoint] = useState<MapPoint | null>(null)
  const query = sectionQuery(place)
  const abroad = place?.regionCode === '32'
  const address = place?.sectionPlace?.trim() ?? ''

  useEffect(() => {
    if (!query) {
      setPoint(null)
      return
    }
    let cancelled = false
    void geocodePlace({ data: { query, abroad, priority: 'high' } }).then((hit) => {
      if (cancelled) return
      if (!hit || hit.category === 'boundary' || hit.type === 'administrative') {
        setPoint(null)
        return
      }
      setPoint({
        id: 'assigned-section',
        lat: hit.lat,
        lng: hit.lng,
        label: `Секция ${sectionNumber(section)}`,
        detail: address || section,
        sectionIds: [section],
        selected: true,
        tone: 'paper',
      })
    })
    return () => {
      cancelled = true
    }
  }, [address, abroad, query, section])

  return (
    <div className="grid gap-2">
      <BulgariaMap
        regionCodes={highlightCodes(place, null, [])}
        focus={point ? { lat: point.lat, lng: point.lng, zoom: abroad ? 12 : 15 } : outlines.focus}
        areas={outlines.areas}
        quietCity={Boolean(place?.cityRegionName) && !abroad}
        waitForArea={!point && Boolean(place?.cityRegionName)}
        points={point ? [point] : []}
      />
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        {address
          ? `Карта на секция ${sectionNumber(section)} · ${address}`
          : `Карта на назначената секция ${sectionNumber(section)}.`}
      </p>
    </div>
  )
}

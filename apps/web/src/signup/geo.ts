import { createServerFn } from '@tanstack/react-start'
import type { Geometry } from 'geojson'

const API = 'https://api.tibroish.bg'

export interface Municipality {
  code: string
  name: string
}

export interface ElectionRegion {
  code: string
  name: string
  isAbroad?: boolean
  municipalities?: Municipality[]
}

export interface CityRegion {
  code: string
  name: string
}

export interface Town {
  id: number
  name: string
  cityRegions: CityRegion[]
}

export interface PollingSection {
  id: string
  place: string
  votersCount?: number | null
  isMachine?: boolean | null
}

export interface Country {
  code: string
  name: string
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}/${path}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'bg-BG' },
  })
  if (!response.ok) throw new Error(`Грешка при зареждане (${response.status})`)
  return response.json() as Promise<T>
}

export const fetchRegions = createServerFn({ method: 'GET' }).handler(async () => {
  return getJson<ElectionRegion[]>('election_regions')
})

export const fetchCountries = createServerFn({ method: 'GET' }).handler(async () => {
  return getJson<Country[]>('countries')
})

export const fetchTowns = createServerFn({ method: 'POST' })
  .validator((input: { regionCodes: string[]; municipalityCode: string }) => input)
  .handler(async ({ data }) => {
    const lists = await Promise.all(
      data.regionCodes.map((code) =>
        getJson<Town[]>(
          `towns?country=000&election_region=${encodeURIComponent(code)}&municipality=${encodeURIComponent(data.municipalityCode)}`,
        ),
      ),
    )
    const merged = new Map<number, Town>()
    for (const list of lists) {
      for (const town of list) {
        const existing = merged.get(town.id)
        if (!existing) {
          merged.set(town.id, { ...town, cityRegions: [...(town.cityRegions ?? [])] })
          continue
        }
        for (const region of town.cityRegions ?? []) {
          if (!existing.cityRegions.some((item) => item.code === region.code)) existing.cityRegions.push(region)
        }
      }
    }
    return [...merged.values()]
  })

export const fetchSections = createServerFn({ method: 'POST' })
  .validator((input: { townId: number; cityRegionCode?: string }) => input)
  .handler(async ({ data }) => {
    const query = data.cityRegionCode
      ? `sections?town=${data.townId}&city_region=${encodeURIComponent(data.cityRegionCode)}`
      : `sections?town=${data.townId}`
    const rows = await getJson<Array<PollingSection & { voters_count?: number; is_machine?: boolean }>>(query)
    return rows.map((row) => ({
      id: String(row.id),
      place: row.place,
      votersCount: typeof row.votersCount === 'number' ? row.votersCount : typeof row.voters_count === 'number' ? row.voters_count : null,
      isMachine: typeof row.isMachine === 'boolean' ? row.isMachine : typeof row.is_machine === 'boolean' ? row.is_machine : null,
    }))
  })

export interface GeocodeHit {
  lat: number
  lng: number
  category: string
  type: string
  geojson: Geometry | null
}

const geocodeCache = new Map<string, GeocodeHit | null>()
let geocodeQueue: Promise<void> = Promise.resolve()

function searchNominatim(query: string, abroad: boolean, polygon: boolean) {
  const key = `${polygon ? 'p' : 'q'}:${abroad ? 'a' : 'bg'}:${query}`
  if (geocodeCache.has(key)) return Promise.resolve(geocodeCache.get(key) ?? null)
  const task = geocodeQueue.then(async () => {
    if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    if (!abroad) url.searchParams.set('countrycodes', 'bg')
    if (polygon) url.searchParams.set('polygon_geojson', '1')
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'bg',
        'User-Agent': 'ti-broish-staging/1.0 (team@tibroish.bg)',
      },
    })
    let hit: GeocodeHit | null = null
    if (response.ok) {
      const rows = (await response.json()) as Array<{ lat?: string; lon?: string; class?: string; type?: string; geojson?: Geometry }>
      const row = rows[0]
      if (row?.lat && row.lon) {
        const shape = row.geojson
        const geojson = shape && (shape.type === 'Polygon' || shape.type === 'MultiPolygon') ? shape : null
        hit = { lat: Number(row.lat), lng: Number(row.lon), category: row.class ?? '', type: row.type ?? '', geojson }
      }
    }
    geocodeCache.set(key, hit)
    await new Promise((resolve) => setTimeout(resolve, 1100))
    return hit
  })
  geocodeQueue = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

export const geocodePlace = createServerFn({ method: 'POST' })
  .validator((input: { query: string; abroad?: boolean; polygon?: boolean }) => input)
  .handler(async ({ data }) => searchNominatim(data.query, Boolean(data.abroad), Boolean(data.polygon)))

export const SOFIA_CODES = ['23', '24', '25']

export function displayRegions(regions: ElectionRegion[]): ElectionRegion[] {
  const sofia = regions.filter((region) => SOFIA_CODES.includes(region.code))
  const rest = regions.filter((region) => !SOFIA_CODES.includes(region.code))
  if (sofia.length < 2) return [...regions].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
  const seen = new Set<string>()
  const municipalities: Municipality[] = []
  for (const region of sofia) {
    for (const municipality of region.municipalities ?? []) {
      if (seen.has(municipality.code)) continue
      seen.add(municipality.code)
      municipalities.push(municipality)
    }
  }
  municipalities.sort((a, b) => a.name.localeCompare(b.name, 'bg'))
  const merged: ElectionRegion = { code: 'sofia-merged', name: 'София-град', municipalities }
  return [...rest, merged].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
}

export function apiRegionCodes(region: ElectionRegion | undefined) {
  if (!region) return []
  return region.code === 'sofia-merged' ? SOFIA_CODES : [region.code]
}

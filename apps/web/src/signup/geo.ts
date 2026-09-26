import { createServerFn } from '@tanstack/react-start'

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
    return getJson<PollingSection[]>(query)
  })

export const geocodePlace = createServerFn({ method: 'POST' })
  .validator((input: { query: string; abroad?: boolean }) => input)
  .handler(async ({ data }) => {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', data.query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    if (!data.abroad) url.searchParams.set('countrycodes', 'bg')
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'bg',
        'User-Agent': 'ti-broish-staging/1.0 (team@tibroish.bg)',
      },
    })
    if (!response.ok) return null
    const rows = (await response.json()) as Array<{ lat?: string; lon?: string }>
    const hit = rows[0]
    if (!hit?.lat || !hit.lon) return null
    return { lat: Number(hit.lat), lng: Number(hit.lon) }
  })

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

import { useEffect, useState } from 'react'
import {
  apiRegionCodes,
  displayRegions,
  fetchCountries,
  fetchRegions,
  fetchSections,
  fetchTowns,
  type Country,
  type ElectionRegion,
  type PollingSection,
  type Town,
} from '../signup/geo'
import type { HomePlace } from '../signup/model'

const inputClass =
  'min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-base text-[var(--ink)]'

export function PlacesPicker({
  value,
  onChange,
}: {
  value: HomePlace | null
  onChange: (place: HomePlace | null) => void
}) {
  const [regions, setRegions] = useState<ElectionRegion[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [towns, setTowns] = useState<Town[]>([])
  const [sections, setSections] = useState<PollingSection[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchRegions()
      .then((data) => setRegions(displayRegions(data)))
      .catch(() => setError('Не успяхме да заредим областите. Опитай пак.'))
      .finally(() => setLoading(false))
  }, [])

  const region = regions.find((item) => item.code === value?.regionCode)
  const abroad = value?.regionCode === '32'

  useEffect(() => {
    if (!abroad) return
    void fetchCountries()
      .then((data) => setCountries([...data].sort((a, b) => a.name.localeCompare(b.name, 'bg'))))
      .catch(() => setError('Не успяхме да заредим държавите.'))
  }, [abroad])

  useEffect(() => {
    if (!value?.municipalityCode || !region || abroad) {
      setTowns([])
      return
    }
    void fetchTowns({ data: { regionCodes: apiRegionCodes(region), municipalityCode: value.municipalityCode } })
      .then((data) => setTowns(data))
      .catch(() => setError('Не успяхме да заредим населените места.'))
  }, [value?.municipalityCode, value?.regionCode, abroad, region])

  useEffect(() => {
    if (!value?.townId || abroad) {
      setSections([])
      return
    }
    void fetchSections({ data: { townId: value.townId, cityRegionCode: value.cityRegionCode } })
      .then((data) => setSections(data))
      .catch(() => setSections([]))
  }, [value?.townId, value?.cityRegionCode, abroad])

  function setRegion(code: string) {
    const next = regions.find((item) => item.code === code)
    if (!next) {
      onChange(null)
      return
    }
    onChange({ regionCode: next.code, regionName: next.name })
  }

  const municipalities = [...(region?.municipalities ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
  const sortedTowns = [...towns].sort((a, b) => {
    const aCity = a.name.startsWith('гр.')
    const bCity = b.name.startsWith('гр.')
    if (aCity !== bCity) return aCity ? -1 : 1
    return a.name.localeCompare(b.name, 'bg')
  })
  const town = towns.find((item) => item.id === value?.townId)
  const districts = [...(town?.cityRegions ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'bg'))

  if (loading) return <p className="text-[var(--ink-soft)]">Зареждаме областите…</p>
  if (error) return <p className="text-red-700">{error}</p>

  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-semibold">
        Област
        <select className={inputClass} value={value?.regionCode ?? ''} onChange={(event) => setRegion(event.target.value)}>
          <option value="">Избери</option>
          {regions.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      {!abroad && value?.regionCode ? (
        <label className="grid gap-1.5 text-sm font-semibold">
          Община
          <select
            className={inputClass}
            value={value.municipalityCode ?? ''}
            onChange={(event) => {
              const municipality = municipalities.find((item) => item.code === event.target.value)
              onChange({
                regionCode: value.regionCode,
                regionName: value.regionName,
                municipalityCode: municipality?.code,
                municipalityName: municipality?.name,
              })
            }}
          >
            <option value="">Избери</option>
            {municipalities.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {abroad ? (
        <>
          <label className="grid gap-1.5 text-sm font-semibold">
            Държава
            <select
              className={inputClass}
              value={value?.countryCode ?? ''}
              onChange={(event) => {
                const country = countries.find((item) => item.code === event.target.value)
                onChange({
                  regionCode: '32',
                  regionName: 'Извън страната',
                  countryCode: country?.code,
                  countryName: country?.name,
                })
              }}
            >
              <option value="">Избери</option>
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Град
            <input
              className={inputClass}
              value={value?.townName ?? ''}
              onChange={(event) => onChange({ ...(value as HomePlace), townName: event.target.value })}
            />
          </label>
        </>
      ) : null}

      {!abroad && value?.municipalityCode ? (
        <label className="grid gap-1.5 text-sm font-semibold">
          Населено място
          <select
            className={inputClass}
            value={value.townId ?? ''}
            onChange={(event) => {
              const nextTown = towns.find((item) => String(item.id) === event.target.value)
              onChange({
                regionCode: value.regionCode,
                regionName: value.regionName,
                municipalityCode: value.municipalityCode,
                municipalityName: value.municipalityName,
                townId: nextTown?.id,
                townName: nextTown?.name,
              })
            }}
          >
            <option value="">Избери</option>
            {sortedTowns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {districts.length > 0 ? (
        <label className="grid gap-1.5 text-sm font-semibold">
          Район
          <select
            className={inputClass}
            value={value?.cityRegionCode ?? ''}
            onChange={(event) => {
              const district = districts.find((item) => item.code === event.target.value)
              onChange({
                ...(value as HomePlace),
                cityRegionCode: district?.code,
                cityRegionName: district?.name,
                sectionId: undefined,
                sectionPlace: undefined,
              })
            }}
          >
            <option value="">Избери</option>
            {districts.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!abroad && value?.townId ? (
        <label className="grid gap-1.5 text-sm font-semibold">
          Секция, ако имаш предпочитание
          <select
            className={inputClass}
            value={value.sectionId ?? ''}
            onChange={(event) => {
              const section = sections.find((item) => item.id === event.target.value)
              onChange({ ...(value as HomePlace), sectionId: section?.id, sectionPlace: section?.place })
            }}
          >
            <option value="">Без конкретна секция</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.place}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className="rounded-xl bg-[var(--sand)] px-3 py-2 text-sm leading-6 text-[var(--ink-soft)]">
        Можеш да гласуваш само там, където обичайно гласуваш. Разпределението не ти дава право да гласуваш в секцията, в която те изпратим.
      </p>
    </div>
  )
}

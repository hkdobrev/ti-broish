import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { FeatureCollection, GeoJsonObject } from 'geojson'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const NAMES: Record<string, string> = {
  BLG: 'Благоевград',
  BGS: 'Бургас',
  VAR: 'Варна',
  VTR: 'Велико Търново',
  VID: 'Видин',
  VRC: 'Враца',
  GAB: 'Габрово',
  DOB: 'Добрич',
  KRZ: 'Кърджали',
  KNL: 'Кюстендил',
  LOV: 'Ловеч',
  MON: 'Монтана',
  PAZ: 'Пазарджик',
  PER: 'Перник',
  PVN: 'Плевен',
  PDV: 'Пловдив',
  RAZ: 'Разград',
  RSE: 'Русе',
  SLS: 'Силистра',
  SLV: 'Сливен',
  SML: 'Смолян',
  SOF: 'София-град',
  SFO: 'София',
  SZR: 'Стара Загора',
  TGV: 'Търговище',
  HKV: 'Хасково',
  SHU: 'Шумен',
  JAM: 'Ямбол',
}

const REGION_CODES: Record<string, string[]> = {
  BLG: ['01'],
  BGS: ['02'],
  VAR: ['03'],
  VTR: ['04'],
  VID: ['05'],
  VRC: ['06'],
  GAB: ['07'],
  DOB: ['08'],
  KRZ: ['09'],
  KNL: ['10'],
  LOV: ['11'],
  MON: ['12'],
  PAZ: ['13'],
  PER: ['14'],
  PVN: ['15'],
  PDV: ['16', '17'],
  RAZ: ['18'],
  RSE: ['19'],
  SLS: ['20'],
  SLV: ['21'],
  SML: ['22'],
  SOF: ['23', '24', '25'],
  SFO: ['26'],
  SZR: ['27'],
  TGV: ['28'],
  HKV: ['29'],
  SHU: ['30'],
  JAM: ['31'],
}

type OblastProps = { nuts3?: string }

function selectedFeatures(data: FeatureCollection, regionCodes: string[]) {
  return {
    type: 'FeatureCollection' as const,
    features: data.features.filter((feature) => {
      const nuts = (feature.properties as OblastProps | null)?.nuts3
      const codes = nuts ? REGION_CODES[nuts] ?? [] : []
      return codes.some((code) => regionCodes.includes(code))
    }),
  }
}

function FitTo({ data, regionCodes }: { data: FeatureCollection; regionCodes: string[] }) {
  const map = useMap()
  const selection = regionCodes.join(',')
  useEffect(() => {
    const chosen = regionCodes.length > 0 ? selectedFeatures(data, regionCodes) : data
    const features = chosen.features.length > 0 ? chosen : data
    const bounds = L.geoJSON(features as GeoJsonObject).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 11 })
  }, [data, map, regionCodes, selection])
  return null
}

export function BulgariaMapClient({
  regionCodes,
  interactive,
  onToggle,
}: {
  regionCodes: string[]
  interactive?: boolean
  onToggle?: (regionCode: string) => void
}) {
  const [data, setData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    void fetch('/oblasts.geojson')
      .then((response) => response.json())
      .then((json) => setData(json as FeatureCollection))
      .catch(() => setData(null))
  }, [])

  return (
    <div className="overflow-hidden border border-[#ddd]">
      <MapContainer center={[42.73, 25.4]} zoom={7} scrollWheelZoom={false} style={{ height: 420, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data ? <FitTo data={data} regionCodes={regionCodes} /> : null}
        {data ? (
          <GeoJSON
            key={`${regionCodes.join(',')}:${interactive ? '1' : '0'}`}
            data={data}
            style={(feature) => {
              const nuts = (feature?.properties as OblastProps | undefined)?.nuts3
              const codes = nuts ? REGION_CODES[nuts] ?? [] : []
              const on = codes.some((code) => regionCodes.includes(code))
              return {
                color: '#0e8f82',
                weight: on ? 2 : 1,
                fillColor: on ? '#38decb' : '#ffffff',
                fillOpacity: on ? 0.55 : 0.12,
              }
            }}
            onEachFeature={(feature, layer) => {
              const nuts = (feature.properties as OblastProps | null)?.nuts3
              const codes = nuts ? REGION_CODES[nuts] ?? [] : []
              layer.bindTooltip(nuts ? NAMES[nuts] ?? nuts : '')
              const toggleCode = codes[0]
              if (interactive && toggleCode) layer.on('click', () => onToggle?.(toggleCode))
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}

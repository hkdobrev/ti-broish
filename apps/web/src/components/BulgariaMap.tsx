import { useEffect, useState, type ComponentType } from 'react'

type MapProps = {
  regionCodes: string[]
  interactive?: boolean
  onToggle?: (regionCode: string) => void
}

export function BulgariaMap(props: MapProps) {
  const [Impl, setImpl] = useState<ComponentType<MapProps> | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('./BulgariaMapClient').then((mod) => {
      if (!cancelled) setImpl(() => mod.BulgariaMapClient)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!Impl) return <div className="h-[420px] bg-[#eee]" aria-hidden />
  return <Impl {...props} />
}

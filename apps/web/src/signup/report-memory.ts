export interface RememberedReport {
  id: string
  secret: string
  kind: 'violation' | 'protocol' | 'call'
}

const KEY = 'ti-broish-reports-v1'

export function readReports(): RememberedReport[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]') as RememberedReport[]
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.secret) : []
  } catch {
    return []
  }
}

export function rememberReport(item: RememberedReport) {
  const all = readReports().filter((current) => current.id !== item.id)
  all.push(item)
  window.localStorage.setItem(KEY, JSON.stringify(all))
}

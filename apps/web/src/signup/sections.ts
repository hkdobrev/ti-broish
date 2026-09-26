export const PAPER_VOTERS_MAX = 300

export function sectionDesk(section: { votersCount?: number | null; isMachine?: boolean | null }): 'paper' | 'machine' | 'unknown' {
  if (section.isMachine === true) return 'machine'
  const count = section.votersCount
  if (typeof count === 'number' && Number.isFinite(count) && count >= PAPER_VOTERS_MAX) return 'machine'
  if (typeof count === 'number' && Number.isFinite(count) && count >= 0) return 'paper'
  return 'unknown'
}

export function spreadAround(center: { lat: number; lng: number }, index: number) {
  const angle = index * 2.399963
  const radius = 0.0032 * Math.sqrt(index + 1)
  return {
    lat: center.lat + Math.sin(angle) * radius,
    lng: center.lng + Math.cos(angle) * radius * 1.35,
  }
}

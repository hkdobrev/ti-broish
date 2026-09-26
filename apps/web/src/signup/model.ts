export type Role = 'section' | 'mobile' | 'video'

export type Radius = 'cityRegion' | 'settlement' | 'municipality' | 'region' | 'distant'

export type Experience = 'never' | 'counted' | 'sik' | 'sik-lead' | 'code'

export interface HomePlace {
  regionCode: string
  regionName: string
  municipalityCode?: string
  municipalityName?: string
  townId?: number
  townName?: string
  cityRegionCode?: string
  cityRegionName?: string
  sectionId?: string
  sectionPlace?: string
  countryCode?: string
  countryName?: string
}

export interface Companion {
  id: string
  mode: 'full' | 'invite'
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  role: Role | null
  mobileTeam: boolean
  rounds: { first: boolean; runoff: boolean }
  experience: Experience | null
  samePlace: boolean
  status: 'pending' | 'confirmed'
}

export interface Profile {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  emailConfirmed: boolean
  confirmCode: string
  role: Role | null
  mobileTeam: boolean
  rounds: { first: boolean; runoff: boolean }
  experience: Experience | null
  place: HomePlace | null
  radius: Radius | null
  distantRegionCodes: string[]
  carSeats: number
  wantsAction: boolean
  companions: Companion[]
  inviteCode: string
  joinedInvite: string | null
  referralCode: string
  referredBy: string | null
  referrerName: string | null
  consent: boolean
  submitted: boolean
  withdrawn: boolean
}

export const emptyProfile = (): Profile => ({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  emailConfirmed: false,
  confirmCode: '',
  role: null,
  mobileTeam: false,
  rounds: { first: true, runoff: true },
  experience: null,
  place: null,
  radius: null,
  distantRegionCodes: [],
  carSeats: 0,
  wantsAction: false,
  companions: [],
  inviteCode: '',
  joinedInvite: null,
  referralCode: '',
  referredBy: null,
  referrerName: null,
  consent: false,
  submitted: false,
  withdrawn: false,
})

export const EXPERIENCE: { id: Experience; title: string; text: string }[] = [
  { id: 'never', title: 'За първи път', text: 'Не си бил в изборна секция като доброволец или член на СИК.' },
  { id: 'counted', title: 'Броил си 1–2 пъти', text: 'Бил си доброволец, но само за броенето.' },
  { id: 'sik', title: 'Бил си член на СИК', text: 'Участвал си в секционна избирателна комисия.' },
  { id: 'sik-lead', title: 'Бил си в ръководството на СИК', text: 'Председател, заместник или секретар.' },
  { id: 'code', title: 'Знаеш Изборния кодекс', text: 'Можеш да се опреш на целия кодекс в секцията.' },
]

export const SECTION_STEPS = [
  'contact',
  'confirm',
  'role',
  'rounds',
  'experience',
  'place',
  'seats',
  'people',
  'review',
] as const

export const VIDEO_STEPS = ['contact', 'confirm', 'role', 'rounds', 'experience', 'review'] as const

export type StepId = (typeof SECTION_STEPS)[number]

export function stepsFor(role: Role | null): readonly StepId[] {
  return role === 'video' ? VIDEO_STEPS : SECTION_STEPS
}

export function mapZoom(place: HomePlace | null, radius: Radius | null) {
  if (!place) return null
  if (radius === 'region' || radius === 'distant') return null
  if (radius === 'cityRegion' && place.townName) return 14
  if (radius === 'settlement' && place.townName) return 13
  if (radius === 'municipality' && place.municipalityName) return 11
  if (place.townName) return 13
  if (place.municipalityName) return 11
  return null
}

export function mapQuery(place: HomePlace | null, radius: Radius | null) {
  if (!place) return null
  if (place.regionCode === '32') {
    const query = [place.townName, place.countryName].filter(Boolean).join(', ')
    return query || null
  }
  if (radius === 'region' || radius === 'distant') return null
  if ((radius === 'municipality' || !place.townName) && place.municipalityName) {
    return [`община ${place.municipalityName}`, place.regionName, 'България'].filter(Boolean).join(', ')
  }
  if (!place.townName) return null
  const town = place.townName.replace(/^(гр\.|с\.|к\.|ман\.)\s*/u, '')
  return [town, place.municipalityName, place.regionName, 'България'].filter(Boolean).join(', ')
}

export function highlightCodes(place: HomePlace | null, radius: Radius | null, distant: string[]) {
  if (!place || place.regionCode === '32') return []
  const home = place.regionCode === 'sofia-merged' ? ['23', '24', '25'] : [place.regionCode]
  if (radius !== 'distant') return home
  return [...home, ...distant.filter((code) => !home.includes(code))]
}

export function roleLabel(role: Role | null, mobileTeam = false) {
  if (role === 'mobile' || mobileTeam) return 'Мобилен рисков екип'
  if (role === 'video') return 'Видеонаблюдение от вкъщи'
  return 'Секция'
}

export function codeFor(email: string) {
  let n = 0
  for (const char of email.trim().toLowerCase()) n = (n * 33 + char.charCodeAt(0)) >>> 0
  return String(n % 1_000_000).padStart(6, '0')
}

export function validName(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 2 && /^[\u0400-\u04FF][\u0400-\u04FF\s'-]*$/.test(trimmed)
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 13
}

export function radiusOptions(place: HomePlace | null): { id: Radius; label: string }[] {
  if (!place) return []
  if (place.regionCode === '32') {
    return [
      { id: 'settlement', label: place.townName ? `Само в ${place.townName}` : 'Само в града' },
      { id: 'region', label: place.countryName ? `В ${place.countryName}` : 'В държавата' },
      { id: 'distant', label: 'И в други държави' },
    ]
  }
  const options: { id: Radius; label: string }[] = []
  if (place.cityRegionName) {
    options.push({ id: 'cityRegion', label: `Само в ${place.cityRegionName}` })
  }
  options.push({
    id: 'settlement',
    label: place.townName ? `В ${place.townName}` : 'В населеното място',
  })
  options.push({
    id: 'municipality',
    label: place.municipalityName ? `В община ${place.municipalityName}` : 'В общината',
  })
  options.push({
    id: 'region',
    label: place.regionName.includes('София') ? `В ${place.regionName}` : `В област ${place.regionName}`,
  })
  options.push({ id: 'distant', label: 'И в други области' })
  return options
}

export function placeReady(place: HomePlace | null) {
  if (!place) return false
  if (place.regionCode === '32') return Boolean(place.countryCode && place.townName?.trim())
  return Boolean(place.municipalityCode && place.townId)
}

export function placeLabel(place: HomePlace | null) {
  if (!place) return 'Още няма избрано място'
  const parts = [place.regionName, place.municipalityName, place.townName, place.cityRegionName, place.sectionPlace, place.countryName]
    .filter(Boolean)
  return parts.join(', ')
}

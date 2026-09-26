import { useEffect, useState } from 'react'
import { emptyProfile, type Profile } from './model'

const KEY = 'ti-broish-signup-prototype-v1'

const listeners = new Set<() => void>()

function read(): Profile {
  if (typeof window === 'undefined') return emptyProfile()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyProfile()
    return { ...emptyProfile(), ...JSON.parse(raw) }
  } catch {
    return emptyProfile()
  }
}

function write(next: Profile) {
  window.localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

export function updateProfile(patch: Partial<Profile> | ((profile: Profile) => Profile)) {
  const current = read()
  const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch }
  write(next)
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setProfile(read())
    setReady(true)
    const listener = () => setProfile(read())
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { profile, ready }
}

export function ensureInviteCode(profile: Profile) {
  if (profile.inviteCode) return profile.inviteCode
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  let code = ''
  for (const byte of bytes) code += alphabet[byte % alphabet.length]
  updateProfile({ inviteCode: code })
  return code
}

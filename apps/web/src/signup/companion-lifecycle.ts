import { createServerFn } from '@tanstack/react-start'
import { getRequestUrl, setCookie } from '@tanstack/react-start/server'
import { SESSION_COOKIE, signupDatabase } from './db-core'
import { deliverMail, importConfirmMail } from './mail'
import type { Companion, Profile } from './model'

function origin() {
  const url = getRequestUrl()
  return `${url.protocol}//${url.host}`
}

function secretToken() {
  return `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
}

/** Persist companion rows and email confirm links for newly pending people. */
export async function syncCompanions(
  db: NonNullable<Awaited<ReturnType<typeof signupDatabase>>>,
  signupId: string,
  companions: Companion[],
) {
  const previous = await db
    .prepare('SELECT id, email, email_confirmed, confirm_token FROM companions WHERE signup_id = ?')
    .bind(signupId)
    .all<{ id: string; email: string; email_confirmed: number | null; confirm_token: string | null }>()
  const prior = new Map((previous.results ?? []).map((row) => [row.id, row]))
  await db.prepare('DELETE FROM companions WHERE signup_id = ?').bind(signupId).run()
  const mailed: { email: string; link: string }[] = []
  const nextCompanions: Companion[] = []
  for (const person of companions) {
    const email = person.email.trim().toLowerCase()
    const old = prior.get(person.id)
    const sameEmail = old && old.email === email
    let confirmed = person.status === 'confirmed' || (sameEmail && old?.email_confirmed === 1)
    let token = sameEmail && old?.confirm_token ? old.confirm_token : null
    if (!confirmed && email) {
      token = token || secretToken()
    }
    if (confirmed) token = null
    await db
      .prepare(
        `INSERT INTO companions (
           id, signup_id, in_group, first_name, middle_name, last_name, email, phone, role, same_place, email_confirmed, confirm_token
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        person.id || crypto.randomUUID(),
        signupId,
        person.inGroup === false ? 0 : 1,
        person.firstName,
        person.middleName,
        person.lastName,
        email,
        person.phone,
        person.role,
        person.samePlace ? 1 : 0,
        confirmed ? 1 : 0,
        token,
      )
      .run()
    if (!confirmed && token && email && !(sameEmail && old?.confirm_token)) {
      const link = `${origin()}/potvardi?companion=${token}`
      const sent = await deliverMail(importConfirmMail(email, link))
      if (!sent) mailed.push({ email, link })
    }
    nextCompanions.push({
      ...person,
      email,
      status: confirmed ? 'confirmed' : 'pending',
    })
  }
  return { companions: nextCompanions, pendingLinks: mailed }
}

export async function companionsForSignup(
  db: NonNullable<Awaited<ReturnType<typeof signupDatabase>>>,
  signupId: string,
  profileCompanions: Companion[],
) {
  const rows = await db
    .prepare(
      `SELECT id, email, COALESCE(email_confirmed, 0) AS email_confirmed
       FROM companions WHERE signup_id = ?`,
    )
    .bind(signupId)
    .all<{ id: string; email: string; email_confirmed: number }>()
  const byId = new Map((rows.results ?? []).map((row) => [row.id, row]))
  return profileCompanions.map((person) => {
    const row = byId.get(person.id)
    if (!row) return person
    return { ...person, status: row.email_confirmed === 1 ? ('confirmed' as const) : ('pending' as const) }
  })
}

export const previewCompanion = createServerFn({ method: 'POST' })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const token = data.token.trim()
    const db = await signupDatabase()
    if (!db || token.length < 16) return { ok: false as const }
    const row = await db
      .prepare(
        `SELECT c.first_name AS first_name, c.email AS email, COALESCE(c.email_confirmed, 0) AS email_confirmed, s.session_token AS session_token
         FROM companions c JOIN signups s ON s.id = c.signup_id
         WHERE c.confirm_token = ?`,
      )
      .bind(token)
      .first<{ first_name: string; email: string; email_confirmed: number; session_token: string | null }>()
    if (!row) return { ok: false as const }
    return {
      ok: true as const,
      firstName: row.first_name,
      email: row.email,
      confirmed: row.email_confirmed === 1,
      kind: 'companion' as const,
    }
  })

export const confirmCompanion = createServerFn({ method: 'POST' })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const token = data.token.trim()
    const db = await signupDatabase()
    if (!db || token.length < 16) return { ok: false as const, message: 'Линкът не е валиден.' }
    const row = await db
      .prepare(
        `SELECT c.id AS id, c.signup_id AS signup_id, s.session_token AS session_token, s.payload AS payload
         FROM companions c JOIN signups s ON s.id = c.signup_id
         WHERE c.confirm_token = ?`,
      )
      .bind(token)
      .first<{ id: string; signup_id: string; session_token: string | null; payload: string }>()
    if (!row) return { ok: false as const, message: 'Линкът не е валиден или вече е използван.' }
    const now = new Date().toISOString()
    await db
      .prepare('UPDATE companions SET email_confirmed = 1, confirm_token = NULL WHERE id = ?')
      .bind(row.id)
      .run()
    try {
      const profile = JSON.parse(row.payload) as Profile
      profile.companions = (profile.companions ?? []).map((person) =>
        person.id === row.id ? { ...person, status: 'confirmed' as const } : person,
      )
      await db
        .prepare('UPDATE signups SET payload = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(profile), now, row.signup_id)
        .run()
    } catch {
      /* payload sync is best-effort */
    }
    if (row.session_token) {
      setCookie(SESSION_COOKIE, row.session_token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180 })
    }
    return { ok: true as const, message: 'Имейлът е потвърден. Благодаря!' }
  })

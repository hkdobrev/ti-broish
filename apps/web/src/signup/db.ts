import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { emptyProfile, type Profile } from './model'

const COOKIE = 'tb_session'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS signups (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  session_token TEXT UNIQUE,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  payload TEXT NOT NULL,
  email_confirmed INTEGER NOT NULL DEFAULT 0,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_signups_referral ON signups(referral_code);
CREATE INDEX IF NOT EXISTS idx_signups_session ON signups(session_token);
`

type Row = {
  id: string
  payload: string
  referral_code: string | null
  referred_by: string | null
}

async function database() {
  const db = (env as unknown as { DB?: SignupD1 }).DB
  if (!db) return null
  await db.exec(SCHEMA)
  return db
}

interface SignupD1 {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
      first<T>(): Promise<T | null>
    }
  }
  exec(sql: string): Promise<unknown>
}

function profileFrom(row: Row): Profile {
  const parsed = JSON.parse(row.payload) as Partial<Profile>
  return {
    ...emptyProfile(),
    ...parsed,
    referralCode: row.referral_code ?? parsed.referralCode ?? '',
    referredBy: row.referred_by ?? parsed.referredBy ?? null,
  }
}

async function referrerName(db: NonNullable<Awaited<ReturnType<typeof database>>>, code: string | null) {
  if (!code) return null
  const row = await db
    .prepare('SELECT payload FROM signups WHERE referral_code = ?')
    .bind(code)
    .first<{ payload: string }>()
  if (!row) return null
  const profile = JSON.parse(row.payload) as Partial<Profile>
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null
}

export const saveSignup = createServerFn({ method: 'POST' })
  .validator((profile: Profile) => profile)
  .handler(async ({ data }) => {
    const db = await database()
    if (!db || !data.email.trim()) return { ok: false as const }
    const now = new Date().toISOString()
    const email = data.email.trim().toLowerCase()
    const existing = await db.prepare('SELECT id, session_token FROM signups WHERE email = ?').bind(email).first<{ id: string; session_token: string | null }>()
    const id = existing?.id ?? crypto.randomUUID()
    const token = existing?.session_token ?? crypto.randomUUID()
    await db
      .prepare(
        `INSERT INTO signups (id, email, session_token, referral_code, referred_by, payload, email_confirmed, withdrawn, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           session_token = excluded.session_token,
           referral_code = excluded.referral_code,
           referred_by = COALESCE(signups.referred_by, excluded.referred_by),
           payload = excluded.payload,
           email_confirmed = excluded.email_confirmed,
           withdrawn = excluded.withdrawn,
           updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        email,
        token,
        data.referralCode || null,
        data.referredBy,
        JSON.stringify({ ...data, email }),
        data.emailConfirmed ? 1 : 0,
        data.withdrawn ? 1 : 0,
        now,
        now,
      )
      .run()
    setCookie(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180 })
    const countRow = data.referralCode
      ? await db.prepare('SELECT COUNT(*) AS n FROM signups WHERE referred_by = ?').bind(data.referralCode).first<{ n: number }>()
      : null
    return { ok: true as const, referrerName: await referrerName(db, data.referredBy), referralCount: countRow?.n ?? 0 }
  })

export const loadSignup = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await database()
  const token = getCookie(COOKIE)
  if (!db || !token) return null
  const row = await db
    .prepare('SELECT id, payload, referral_code, referred_by FROM signups WHERE session_token = ?')
    .bind(token)
    .first<Row>()
  if (!row) return null
  const profile = profileFrom(row)
  const countRow = profile.referralCode
    ? await db.prepare('SELECT COUNT(*) AS n FROM signups WHERE referred_by = ?').bind(profile.referralCode).first<{ n: number }>()
    : null
  return {
    profile,
    referrerName: await referrerName(db, profile.referredBy),
    referralCount: countRow?.n ?? 0,
  }
})

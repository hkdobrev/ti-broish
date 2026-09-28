import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestUrl, setCookie } from '@tanstack/react-start/server'
import { type RosterFields, type RosterView } from './admin-csv'
import { NOTES_SQL, notesFromRow } from './admin-notes'
import { PERSON_SQL_BASE } from './admin-person-sql'
import { SESSION_COOKIE, signupDatabase, type SignupD1 } from './db-core'
import { validEmail } from './model'
import { parseStaffRole, roleAllows, type StaffAction, type StaffRole } from './staff'

const VIEWS: RosterView[] = ['all', 'assigned', 'unassigned', 'draft', 'abroad', 'mir', 'calls']
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export type Database = SignupD1

export interface RawPerson {
  id: string
  email: string
  first_name: string
  middle_name: string
  last_name: string
  phone: string
  mir: string
  region: string
  town: string
  place: string
  role: string
  submitted: number
  withdrawn: number
  email_confirmed: number
  imported: number
  draft_section: string
  published_section: string
  egn?: string
  notes: string
  call_requested_at: string
  call_message: string
}

export type Denial = { ok: false; state: 'signed-out' | 'unconfirmed' | 'forbidden' | 'nodb'; email: string; message: string }

export async function gate(action: StaffAction): Promise<{ ok: true; db: Database; email: string; role: StaffRole } | Denial> {
  const db = await signupDatabase()
  if (!db) return { ok: false, state: 'nodb', email: '', message: 'Няма база за записванията.' }
  const token = getCookie(SESSION_COOKIE)
  if (!token) return { ok: false, state: 'signed-out', email: '', message: 'Влез с потвърдения си имейл.' }
  const session = await db.prepare('SELECT email, email_confirmed FROM signups WHERE session_token = ?').bind(token).first<{ email: string; email_confirmed: number }>()
  if (!session) return { ok: false, state: 'signed-out', email: '', message: 'Влез с потвърдения си имейл.' }
  const email = session.email.trim().toLowerCase()
  if (!session.email_confirmed) return { ok: false, state: 'unconfirmed', email, message: 'Потвърди имейла, за да влезеш в екипа.' }
  const member = await db.prepare('SELECT role FROM staff WHERE email = ?').bind(email).first<{ role: string }>()
  const role = parseStaffRole(member?.role)
  if (!role) return { ok: false, state: 'forbidden', email, message: 'Този имейл не е поканен в екипа.' }
  if (!roleAllows(role, action)) return { ok: false, state: 'forbidden', email, message: 'Тази роля няма това право.' }
  return { ok: true, db, email, role }
}

export async function listStaff(db: Database) {
  const rows = await db
    .prepare(`SELECT email, role, COALESCE(invited_by, '') AS invited_by FROM staff ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, email`)
    .all<{ email: string; role: string; invited_by: string }>()
  return (rows.results ?? []).flatMap((row) => {
    const role = parseStaffRole(row.role)
    return role ? [{ email: row.email, role, invitedBy: row.invited_by }] : []
  })
}

export async function adminCount(db: Database) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM staff WHERE role = 'admin'`).first<{ n: number }>()
  return row?.n ?? 0
}

export function viewOf(value: string): RosterView {
  return VIEWS.includes(value as RosterView) ? (value as RosterView) : 'all'
}

export function origin() {
  const url = getRequestUrl()
  return `${url.protocol}//${url.host}`
}

export function referralCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

export function secretToken() {
  return `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
}

export function fieldsOf(row: RawPerson): RosterFields {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    phone: row.phone,
    mir: row.mir,
    region: row.region,
    town: row.town,
    place: row.place,
    role: row.role,
    submitted: row.submitted === 1,
    withdrawn: row.withdrawn === 1,
    emailConfirmed: row.email_confirmed === 1,
    imported: row.imported === 1,
    draftSection: row.draft_section,
    publishedSection: row.published_section,
    egn: row.egn ?? '',
    ...notesFromRow(row),
  }
}

export const PERSON_SQL = PERSON_SQL_BASE + NOTES_SQL

export function bound(db: Database, sql: string, binds: unknown[]) {
  const statement = db.prepare(sql)
  return binds.length > 0 ? statement.bind(...binds) : statement
}

export async function selectPeople(db: Database, clause: string, binds: string[], limit: number, offset: number, withEgn: boolean) {
  const egn = withEgn ? ", COALESCE(egn, '') AS egn" : ''
  const result = await bound(
    db,
    `SELECT ${PERSON_SQL}${egn} FROM signups WHERE ${clause} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`,
    binds,
  ).all<RawPerson>()
  return result.results ?? []
}

export const claimStaffSession = createServerFn({ method: 'POST' })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const db = await signupDatabase()
    const email = data.email.trim().toLowerCase()
    if (!db) return { ok: false as const, message: 'Няма база за записванията.' }
    if (!validEmail(email)) return { ok: false as const, message: 'Имейлът не е валиден.' }
    const row = await db
      .prepare('SELECT session_token, email_confirmed FROM signups WHERE lower(email) = ?')
      .bind(email)
      .first<{ session_token: string | null; email_confirmed: number }>()
    if (!row?.email_confirmed || !row.session_token) return { ok: false as const, message: 'Няма потвърден профил с този имейл.' }
    const member = await db.prepare('SELECT role FROM staff WHERE email = ?').bind(email).first<{ role: string }>()
    if (!parseStaffRole(member?.role)) return { ok: false as const, message: 'Този имейл не е поканен в екипа.' }
    setCookie(SESSION_COOKIE, row.session_token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180 })
    return { ok: true as const }
  })

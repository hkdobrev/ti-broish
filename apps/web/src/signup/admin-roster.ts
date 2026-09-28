import { createServerFn } from '@tanstack/react-start'
import { campaignCsv, internalCsv, normalizeSection, rosterWhere, type RosterFields } from './admin-csv'
import { bound, fieldsOf, gate, listStaff, selectPeople, viewOf } from './admin-shared'
import { permissionsFor } from './staff'

export const adminRoster = createServerFn({ method: 'POST' })
  .validator((input: { view: string; mir: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('view')
    if (!access.ok) return access
    const db = access.db
    const filter = rosterWhere(viewOf(data.view), data.mir)
    if ('error' in filter) return { ok: false as const, state: 'forbidden' as const, email: access.email, message: filter.error }
    const total = await bound(db, `SELECT COUNT(*) AS n FROM signups WHERE ${filter.clause}`, filter.binds).first<{ n: number }>()
    const people = (await selectPeople(db, filter.clause, filter.binds, 300, 0, false)).map(fieldsOf)
    const takenMir = viewOf(data.view) === 'mir' ? filter.binds[0] ?? '' : ''
    const taken = await db
      .prepare(
        `SELECT section_code, COALESCE(mir_code, '') AS mir_code, COALESCE(place, '') AS place, organisation, COALESCE(note, '') AS note
         FROM taken_sections WHERE (? = '' OR mir_code = ?) ORDER BY created_at DESC LIMIT 200`,
      )
      .bind(takenMir, takenMir)
      .all<{ section_code: string; mir_code: string; place: string; organisation: string; note: string }>()
    return {
      ok: true as const,
      email: access.email,
      role: access.role,
      permissions: permissionsFor(access.role),
      staff: await listStaff(db),
      total: total?.n ?? people.length,
      people,
      taken: taken.results ?? [],
    }
  })

export const adminExport = createServerFn({ method: 'POST' })
  .validator((input: { view: string; mir: string; kind: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate(data.kind === 'campaign' ? 'exportCampaign' : 'exportInternal')
    if (!access.ok) return access
    const db = access.db
    const filter = rosterWhere(viewOf(data.view), data.mir)
    if ('error' in filter) return { ok: false as const, message: filter.error }
    const people: RosterFields[] = []
    for (let offset = 0; people.length < 5000; offset += 400) {
      const chunk = await selectPeople(db, filter.clause, filter.binds, 400, offset, data.kind !== 'campaign')
      people.push(...chunk.map(fieldsOf))
      if (chunk.length < 400) break
    }
    const campaign = data.kind === 'campaign'
    const exported = campaign ? people.map((person) => ({ ...person, egn: '', draftSection: '' })) : people
    const csv = campaign ? campaignCsv(exported) : internalCsv(exported)
    const stamp = new Date().toISOString().slice(0, 10)
    return { ok: true as const, csv, filename: campaign ? `ti-broish-brevo-${stamp}.csv` : `ti-broish-ekip-${stamp}.csv` }
  })

export const adminDraft = createServerFn({ method: 'POST' })
  .validator((input: { id: string; section: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('edit')
    if (!access.ok) return access
    const db = access.db
    const section = normalizeSection(data.section).slice(0, 32)
    await db.prepare(`UPDATE signups SET draft_section = NULLIF(?, ''), updated_at = ? WHERE id = ?`).bind(section, new Date().toISOString(), data.id).run()
    const taken = section
      ? await db.prepare('SELECT organisation FROM taken_sections WHERE section_code = ?').bind(section).first<{ organisation: string }>()
      : null
    return { ok: true as const, warning: taken ? `Секцията е заета от ${taken.organisation}.` : '' }
  })

export const adminPublish = createServerFn({ method: 'POST' })
  .validator((input: { view: string; mir: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('publish')
    if (!access.ok) return access
    const db = access.db
    const filter = rosterWhere(viewOf(data.view), data.mir)
    if ('error' in filter) return { ok: false as const, message: filter.error }
    const pending = `COALESCE(draft_section, '') != '' AND COALESCE(draft_section, '') != COALESCE(published_section, '')`
    const count = await bound(db, `SELECT COUNT(*) AS n FROM signups WHERE (${filter.clause}) AND ${pending}`, filter.binds).first<{ n: number }>()
    const now = new Date().toISOString()
    await bound(db, `UPDATE signups SET published_section = draft_section, published_at = ?, updated_at = ? WHERE (${filter.clause}) AND ${pending}`, [now, now, ...filter.binds]).run()
    return { ok: true as const, published: count?.n ?? 0 }
  })

import { createServerFn } from '@tanstack/react-start'
import { adminCount, gate, origin } from './admin-shared'
import { deliverMail, staffInviteMail } from './mail'
import { validEmail } from './model'
import { keepsAnAdmin, parseStaffRole, staffRoleLabel } from './staff'

export const adminInvite = createServerFn({ method: 'POST' })
  .validator((input: { email: string; role: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('invite')
    if (!access.ok) return access
    const email = data.email.trim().toLowerCase()
    const role = parseStaffRole(data.role)
    if (!validEmail(email) || !role) return { ok: false as const, message: 'Нужни са валиден имейл и роля.' }
    const current = await access.db.prepare('SELECT role FROM staff WHERE email = ?').bind(email).first<{ role: string }>()
    const currentRole = parseStaffRole(current?.role)
    if (currentRole && !keepsAnAdmin(await adminCount(access.db), currentRole, role)) {
      return { ok: false as const, message: 'Трябва да остане поне един админ.' }
    }
    const now = new Date().toISOString()
    await access.db
      .prepare(
        `INSERT INTO staff (email, role, invited_by, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET role = excluded.role, invited_by = excluded.invited_by`,
      )
      .bind(email, role, access.email, now)
      .run()
    const sent = await deliverMail(staffInviteMail(email, staffRoleLabel(role), `${origin()}/admin`))
    return { ok: true as const, sent, message: sent ? `Поканата е изпратена на ${email}.` : `${email} е в екипа. Писмото още не тръгва, кажи им да влязат с този имейл.` }
  })

export const adminStaffRole = createServerFn({ method: 'POST' })
  .validator((input: { email: string; role: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('invite')
    if (!access.ok) return access
    const email = data.email.trim().toLowerCase()
    const role = parseStaffRole(data.role)
    if (!role) return { ok: false as const, message: 'Непозната роля.' }
    const current = await access.db.prepare('SELECT role FROM staff WHERE email = ?').bind(email).first<{ role: string }>()
    const currentRole = parseStaffRole(current?.role)
    if (!currentRole) return { ok: false as const, message: 'Този имейл не е в екипа.' }
    if (!keepsAnAdmin(await adminCount(access.db), currentRole, role)) return { ok: false as const, message: 'Трябва да остане поне един админ.' }
    await access.db.prepare('UPDATE staff SET role = ?, invited_by = ? WHERE email = ?').bind(role, access.email, email).run()
    return { ok: true as const, message: `${email} вече е ${staffRoleLabel(role)}.` }
  })

export const adminStaffRemove = createServerFn({ method: 'POST' })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const access = await gate('invite')
    if (!access.ok) return access
    const email = data.email.trim().toLowerCase()
    const current = await access.db.prepare('SELECT role FROM staff WHERE email = ?').bind(email).first<{ role: string }>()
    const currentRole = parseStaffRole(current?.role)
    if (!currentRole) return { ok: false as const, message: 'Този имейл не е в екипа.' }
    if (!keepsAnAdmin(await adminCount(access.db), currentRole, null)) return { ok: false as const, message: 'Трябва да остане поне един админ.' }
    await access.db.prepare('DELETE FROM staff WHERE email = ?').bind(email).run()
    return { ok: true as const, message: `${email} вече не е в екипа.` }
  })

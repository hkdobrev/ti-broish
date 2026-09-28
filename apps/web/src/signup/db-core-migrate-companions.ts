import type { SignupD1 } from './db-core'

/** Additive companion confirm columns (safe on existing D1). */
export async function migrateCompanionColumns(db: SignupD1) {
  for (const sql of [
    'ALTER TABLE companions ADD COLUMN email_confirmed INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE companions ADD COLUMN confirm_token TEXT',
  ]) {
    try {
      await db.prepare(sql).run()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/duplicate column/i.test(message)) throw error
    }
  }
}

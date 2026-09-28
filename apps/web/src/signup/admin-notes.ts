/** Roster columns for volunteer notes and call requests (stored in payload / notes). */
export const NOTES_SQL = `,
  COALESCE(NULLIF(notes, ''), COALESCE(json_extract(payload, '$.notes'), '')) AS notes,
  COALESCE(json_extract(payload, '$.callRequestedAt'), '') AS call_requested_at,
  COALESCE(json_extract(payload, '$.callMessage'), '') AS call_message`

export interface NotesFields {
  notes: string
  callRequestedAt: string
  callMessage: string
}

export function notesFromRow(row: { notes?: string; call_requested_at?: string; call_message?: string }): NotesFields {
  return {
    notes: row.notes ?? '',
    callRequestedAt: row.call_requested_at ?? '',
    callMessage: row.call_message ?? '',
  }
}

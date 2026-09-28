import { env } from 'cloudflare:workers'

const API = 'https://api.brevo.com/v3'

export type BrevoConfig = {
  apiKey: string
  listId: number | null
  templateId: number | null
  senderEmail: string
  senderName: string
}

export function readBrevoConfig(): BrevoConfig | { missing: string } {
  const bag = env as unknown as {
    BREVO_API_KEY?: string
    BREVO_LIST_ID?: string
    BREVO_TEMPLATE_ID?: string
    BREVO_SENDER_EMAIL?: string
    BREVO_SENDER_NAME?: string
  }
  const apiKey = (bag.BREVO_API_KEY ?? '').trim()
  if (!apiKey) return { missing: 'BREVO_API_KEY' }
  return {
    apiKey,
    listId: parsePositiveInt(bag.BREVO_LIST_ID),
    templateId: parsePositiveInt(bag.BREVO_TEMPLATE_ID),
    senderEmail: (bag.BREVO_SENDER_EMAIL ?? 'noreply@tibroish.bg').trim(),
    senderName: (bag.BREVO_SENDER_NAME ?? 'Ти Броиш').trim(),
  }
}

export async function importContactsToList(
  config: BrevoConfig,
  contacts: Array<{ email: string; attributes?: Record<string, string> }>,
  listId: number,
) {
  return brevoFetch(config.apiKey, '/contacts/import', {
    method: 'POST',
    body: JSON.stringify({
      jsonBody: contacts.map((contact) => ({
        email: contact.email,
        attributes: contact.attributes ?? {},
      })),
      listIds: [listId],
      updateExistingContacts: true,
      emptyContactsAttributes: false,
    }),
  })
}

export async function createEmailCampaign(
  config: BrevoConfig,
  input: {
    name: string
    subject: string
    listId: number
    htmlContent?: string
    templateId?: number
  },
) {
  const body: Record<string, unknown> = {
    name: input.name,
    subject: input.subject,
    sender: { name: config.senderName, email: config.senderEmail },
    recipients: { listIds: [input.listId] },
  }
  if (input.templateId) body.templateId = input.templateId
  else body.htmlContent = input.htmlContent ?? defaultCampaignHtml()
  const created = await brevoFetch(config.apiKey, '/emailCampaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (typeof created === 'object' && created && 'id' in created && typeof created.id === 'number') return { id: created.id }
  throw new Error('Brevo не върна номер на кампанията.')
}

export async function sendEmailCampaignNow(config: BrevoConfig, campaignId: number) {
  return brevoFetch(config.apiKey, `/emailCampaigns/${campaignId}/sendNow`, {
    method: 'POST',
  })
}

async function brevoFetch(apiKey: string, path: string, init: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'message' in json
        ? String((json as { message: unknown }).message)
        : `Brevo HTTP ${response.status}`
    throw new Error(message)
  }
  return json
}

function parsePositiveInt(value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  return n > 0 ? n : null
}

function defaultCampaignHtml() {
  return '<p>Здравей,</p><p>Това е чернова на кампания от админ панела на Ти Броиш. Замени съдържанието или ползвай BREVO_TEMPLATE_ID.</p>'
}

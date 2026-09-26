import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/r/$code')({ component: ReferralRedirect })

function ReferralRedirect() {
  const { code } = Route.useParams()
  useEffect(() => {
    window.location.replace(`/signup?ref=${encodeURIComponent(code)}`)
  }, [code])
  return <p>Отваряме записването…</p>
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PageIntro } from '../components/SiteChrome'
import { validEmail } from '../signup/model'
import { useProfile } from '../signup/store'

export const Route = createFileRoute('/vhod')({ component: LoginPage })

function LoginPage() {
  const { profile, ready } = useProfile()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const matches = ready && profile.emailConfirmed && email.trim().toLowerCase() === profile.email.trim().toLowerCase()

  return (
    <div className="max-w-xl">
      <PageIntro title="Влез в профила си" lede="Влез с потвърдения си имейл. Сесията е в cookie (tb_session); записът е в базата, не само в този браузър." />
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (validEmail(email)) setSent(true)
        }}
      >
        <label className="grid gap-1.5 text-sm font-semibold">
          Имейл
          <input className="min-h-11 rounded-xl border border-[var(--line)] px-3" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button type="submit" className="brand-button">
          Изпрати линк
        </button>
      </form>
      {sent && matches ? (
        <p className="mt-4">
          Ако вече си потвърдил този имейл на това устройство, <Link to="/profil">отвори профила</Link>.
        </p>
      ) : null}
      {sent && !matches ? (
        <p className="mt-4">
          Няма активна сесия за този имейл тук. <Link to="/signup" search={{ step: 'contact' }}>Запиши се или потвърди имейла</Link>
        </p>
      ) : null}
    </div>
  )
}

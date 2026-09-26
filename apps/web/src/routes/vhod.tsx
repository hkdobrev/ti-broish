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
      <PageIntro title="Влез в профила си" lede="В прототипа профилът живее в този браузър. В понеделник линкът от имейла ще те вписва и от друг телефон." />
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
          Писмото е симулирано. <Link to="/profil">Отвори профила</Link>
        </p>
      ) : null}
      {sent && !matches ? (
        <p className="mt-4">
          Няма потвърден профил с този имейл на този браузър. <Link to="/signup" search={{ step: 'contact' }}>Запиши се</Link>
        </p>
      ) : null}
    </div>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { PageIntro } from '../components/SiteChrome'
import { ShareSignup } from '../components/ShareSignup'
import { StaffNote } from '../components/StaffNote'
import { loadSignup, saveSignup } from '../signup/db'
import { nextAssignment, placeLabel, roleLabel, signupGap, type Profile } from '../signup/model'
import { rememberReport } from '../signup/report-memory'
import { submitCall } from '../signup/reports'
import { ensureReferralCode, updateProfile, useProfile } from '../signup/store'

export const Route = createFileRoute('/profil')({ component: ProfilePage })

function AnonymousCall() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const field = 'min-h-11 w-full rounded-xl border border-[#ddd] bg-white px-3'
  if (done) return <p>Записахме, че искаш обаждане. Екипът ще ти звънне на {phone}.</p>
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setError('')
        void submitCall({ data: { name, phone, email: '', message } }).then((result) => {
          if (!result.ok) {
            setError(result.message)
            return
          }
          rememberReport({ id: result.id, secret: result.secret, kind: 'call' })
          setDone(true)
        })
      }}
    >
      <p className="leading-7">Ако искаш обаждане, без да се записваш, остави телефон.</p>
      <input className={field} autoComplete="name" placeholder="Име" value={name} onChange={(event) => setName(event.target.value)} required />
      <input className={field} type="tel" autoComplete="tel" placeholder="Телефон" value={phone} onChange={(event) => setPhone(event.target.value)} required />
      <textarea className={`${field} min-h-24 py-2`} placeholder="По какъв въпрос" value={message} onChange={(event) => setMessage(event.target.value)} />
      {error ? <p className="text-red-700">{error}</p> : null}
      <button className="brand-button" type="submit">
        Поискай обаждане
      </button>
    </form>
  )
}

function ProfilePage() {
  const { profile, ready } = useProfile()
  const [inviteLink, setInviteLink] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [synced, setSynced] = useState(false)
  const skipSave = useRef(true)
  useEffect(() => {
    if (!profile.emailConfirmed) return
    const code = ensureReferralCode(profile)
    setInviteLink(`${window.location.origin}/signup?ref=${code}`)
  }, [profile])
  useEffect(() => {
    let cancelled = false
    void loadSignup().then((remote) => {
      if (cancelled) return
      if (remote) {
        updateProfile({ ...remote.profile, referrerName: remote.referrerName })
        setReferralCount(remote.referralCount)
      }
      setSynced(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (!synced) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (!profile.email.includes('@')) return
    const handle = window.setTimeout(() => {
      void saveSignup({ data: profile })
    }, 600)
    return () => window.clearTimeout(handle)
  }, [synced, profile])

  if (!ready) return <p>Зареждаме профила…</p>
  if (!profile.email) {
    return (
      <div className="grid gap-4">
        <PageIntro title="Още нямаш профил" lede="Запиши се. Сигнал и протокол можеш да изпратиш и без профил." />
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Запиши се
        </Link>
        <p className="text-sm leading-7">
          <Link to="/signal">Подай сигнал</Link>
          {' · '}
          <Link to="/protokol">Изпрати протокол</Link>
        </p>
        <AnonymousCall />
      </div>
    )
  }

  const view = profileView(profile)
  const wave = nextAssignment(profile)
  const gap = signupGap(profile)

  return (
    <div className="grid gap-8">
      <PageIntro title={`${profile.firstName}, това е профилът ти`} />
      {view === 'incomplete' ? (
        <section className="grid gap-4">
          <h2 className="text-2xl font-black text-[#444]">{profile.withdrawn ? 'Записването е оттеглено' : 'Записването не е готово'}</h2>
          <p className="text-lg leading-7">{profile.withdrawn ? 'Мястото се освобождава. Можеш да го върнеш.' : gap}</p>
          {profile.withdrawn ? (
            <button type="button" className="brand-button" onClick={() => updateProfile({ withdrawn: false, submitted: true })}>
              Върни записването
            </button>
          ) : (
            <Link to="/signup" search={{ step: resumeStep(profile) }} className="brand-button">
              Продължи записването
            </Link>
          )}
        </section>
      ) : null}
      {view === 'waiting' ? (
        <section className="grid gap-3">
          <h2 className="text-2xl font-black text-[#444]">Записан си</h2>
          <p className="text-lg leading-7">
            Следващо разпределение: {wave?.label}. Тогава тук ще видиш секцията и ще получиш имейл.
          </p>
          <p className="leading-7">{roleLabel(profile.role, profile.mobileTeam)}. {placeLabel(profile.place)}.</p>
        </section>
      ) : null}
      {view === 'assigned' ? (
        <section className="grid gap-3">
          <h2 className="text-2xl font-black text-[#444]">Имаш секция</h2>
          <p className="text-lg leading-7">
            {placeLabel(profile.place)}
            {profile.place?.sectionPlace ? `, ${profile.place.sectionPlace}` : ', примерна секция 042'}. {profile.rounds.first ? '25 октомври' : '1 ноември'}.
          </p>
          <p className="text-sm leading-6">Това е демо, докато алгоритъмът за разпределение не е готов.</p>
          <Link to="/znachka" className="brand-button">
            Отпечатай значката
          </Link>
        </section>
      ) : null}

      <section className="grid gap-3 border-t border-[var(--line)] pt-6">
        <h2 className="text-xl font-black text-[#444]">Какво получаваш</h2>
        <p className="leading-7">Значка за печат. Можеш да я отпечаташ още сега.</p>
        {view === 'assigned' ? null : (
          <Link to="/znachka" className="font-bold">
            Отвори значката
          </Link>
        )}
        <p className="leading-7">Пълномощното е дигитално. Идва след разпределението, в изборната седмица.</p>
      </section>

      <DemoState value={profile.demoState} onChange={(demoState) => updateProfile({ demoState })} />

      <section className="grid gap-4 border-t border-[var(--line)] pt-6 text-base">
        <h2 className="text-xl font-black text-[#444]">Още</h2>
        {inviteLink ? <ShareSignup link={inviteLink} count={referralCount} /> : null}
        {profile.companions.length > 0 ? (
          <ul className="grid gap-2">
            {profile.companions.map((person) => (
              <li key={person.id}>
                {person.firstName} {person.lastName} · чака техния имейл
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          {profile.firstName} {profile.middleName} {profile.lastName}
          <br />
          {profile.email}
          <br />
          {profile.phone}
          {profile.role === 'mobile' ? (
            <>
              <br />
              {profile.hasCar ? `Кола, ${profile.carSeats} места` : 'Без кола'}
              {' · '}
              {profile.hasDrone ? 'има дрон' : 'без дрон'}
            </>
          ) : null}
        </p>
        <StaffNote />
        <p>
          <Link to="/signal">Подай сигнал</Link>
          {' · '}
          <Link to="/protokol">Изпрати протокол</Link>
          {' · '}
          <Link to="/izprateni">Изпратените</Link>
        </p>
        <Link to="/signup" search={{ step: 'contact' }} className="font-bold">
          Промени данните
        </Link>
        {!profile.withdrawn ? (
          <button type="button" className="text-left font-bold text-[#666]" onClick={() => updateProfile({ withdrawn: true, submitted: true })}>
            Оттегли записването
          </button>
        ) : null}
        <p className="text-sm leading-6">
          Това е доброволна дейност без заплащане. Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев.
        </p>
      </section>
    </div>
  )
}

function profileView(profile: Profile): 'incomplete' | 'waiting' | 'assigned' {
  if (profile.demoState === 'incomplete' || profile.demoState === 'waiting' || profile.demoState === 'assigned') return profile.demoState
  if (profile.withdrawn || signupGap(profile)) return 'incomplete'
  return 'waiting'
}

function resumeStep(profile: Profile) {
  if (!profile.firstName || !profile.email || !profile.phone) return 'contact' as const
  if (!profile.emailConfirmed) return 'confirm' as const
  if (!profile.role || profile.role === 'video') return 'role' as const
  if (!profile.experience) return 'experience' as const
  if (!profile.place || !profile.radius) return 'place' as const
  return 'review' as const
}

function DemoState({ value, onChange }: { value: Profile['demoState']; onChange: (value: Profile['demoState']) => void }) {
  const options = [
    ['auto', 'Както е'],
    ['incomplete', 'Недовършено'],
    ['waiting', 'Без секция'],
    ['assigned', 'Със секция'],
  ] as const
  return (
    <fieldset className="grid gap-2 border-t border-dashed border-[#ddd] pt-4">
      <legend className="text-sm font-bold text-[#666]">Демо на състоянието</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={value === id ? 'min-h-10 rounded-full bg-[#333] px-3 text-sm font-bold text-white' : 'min-h-10 rounded-full border border-[#ddd] bg-white px-3 text-sm font-bold'}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

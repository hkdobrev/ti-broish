import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { AssignedSectionMap } from '../components/AssignedSectionMap'
import { PageIntro } from '../components/SiteChrome'
import { ShareSignup } from '../components/ShareSignup'
import { StaffNote } from '../components/StaffNote'
import { loadSignup, saveSignup } from '../signup/db'
import { isProtocolDay } from '../signup/election'
import { assignmentLocked, nextAssignment, placeLabel, profileView, roleLabel, signupGap, type Profile } from '../signup/model'
import { locationEditable, mirOf } from '../signup/rules'
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
        <PageIntro title="Още нямаш профил" lede="Запиши се. Сигнал можеш да изпратиш и без профил." />
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Запиши се
        </Link>
        <p className="text-sm leading-7">
          <Link to="/signal">Подай сигнал</Link>
        </p>
        <AnonymousCall />
      </div>
    )
  }

  const view = profileView(profile)
  const wave = nextAssignment()
  const assigned = assignmentLocked(profile)
  const canEditPlace = locationEditable(assigned)

  return (
    <div className="grid gap-6">
      <PageIntro title="Твоят профил" lede="Тук са данните ти, групата и назначената секция." />
      {view === 'gap' ? (
        <section className="grid gap-4">
          <p className="text-lg leading-7">{signupGap(profile)}</p>
          <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
            Довърши записването
          </Link>
        </section>
      ) : null}
      {view === 'waiting' ? (
        <section className="grid gap-3">
          <p className="text-sm font-bold text-[#666]">Следващо за теб</p>
          <h2 className="text-3xl font-black text-[#444]">{wave?.label}</h2>
          <p className="text-lg leading-7">На тази дата виждаш секцията тук и получаваш имейл. Дотогава няма назначена секция.</p>
          {!profile.egn ? <p className="leading-7">Без ЕГН няма да влезеш в разпределението.</p> : null}
          <p className="leading-7">{roleLabel(profile.role, profile.mobileTeam)}. {placeLabel(profile.place)}.</p>
        </section>
      ) : null}
      {view === 'assigned' ? (
        <section className="grid gap-3">
          <p className="text-sm font-bold text-[#666]">Назначена секция</p>
          <h2 className="text-3xl font-black text-[#444]">{profile.assignedSection}</h2>
          {profile.place?.sectionPlace ? <p className="leading-7">{profile.place.sectionPlace}</p> : null}
          <p className="text-lg leading-7">
            {profile.rounds.first ? '25 октомври' : '1 ноември'}. Секцията е публикувана от екипа.
          </p>
          {profile.assignedSection ? <AssignedSectionMap place={profile.place} section={profile.assignedSection} /> : null}
          <Link to="/znachka" className="brand-button">
            Отпечатай значката
          </Link>
        </section>
      ) : null}

      <section className="grid gap-3 border-t border-[var(--line)] pt-6">
        <h2 className="text-xl font-black text-[#444]">Бележка към екипа</h2>
        <StaffNote />
        {view === 'assigned' ? null : (
          <Link to="/znachka" className="font-bold">
            Значка за печат, още сега
          </Link>
        )}
      </section>

      <section className="grid gap-4 border-t border-[var(--line)] pt-6 text-base">
        <h2 className="text-xl font-black text-[#444]">Покани</h2>
        {inviteLink ? <ShareSignup link={inviteLink} count={referralCount} /> : null}
        {profile.companions.length > 0 ? (
          <ul className="grid gap-2">
            {profile.companions.map((person) => (
              <li key={person.id}>
                {person.firstName} {person.lastName} ·{' '}
                {person.status === 'confirmed' ? 'потвърден имейл' : 'чака потвърждение'}
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
        {canEditPlace ? (
          <Link to="/signup" search={{ step: 'place' }} className="font-bold">
            Промени мястото{assigned && mirOf(profile.place) ? ` в МИР ${mirOf(profile.place)}` : ''}
          </Link>
        ) : null}
        {isProtocolDay() ? (
          <p className="leading-7">Днес е ден за протокол — ползвай инструкциите в профила.</p>
        ) : null}
      </section>
    </div>
  )
}

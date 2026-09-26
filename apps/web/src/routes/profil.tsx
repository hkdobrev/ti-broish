import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PageIntro } from '../components/SiteChrome'
import { EXPERIENCE, placeLabel, radiusOptions, roleLabel } from '../signup/model'
import { loadSignup } from '../signup/db'
import { ensureReferralCode, updateProfile, useProfile } from '../signup/store'

export const Route = createFileRoute('/profil')({ component: ProfilePage })

function ProfilePage() {
  const { profile, ready } = useProfile()
  const [inviteLink, setInviteLink] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  useEffect(() => {
    if (!profile.emailConfirmed) return
    const code = ensureReferralCode(profile)
    setInviteLink(`${window.location.origin}/signup?ref=${code}`)
  }, [profile])
  useEffect(() => {
    void loadSignup().then((remote) => {
      if (!remote) return
      updateProfile({ ...remote.profile, referrerName: remote.referrerName })
      setReferralCount(remote.referralCount)
    })
  }, [])

  if (!ready) return <p>Зареждаме профила…</p>
  if (!profile.email) {
    return (
      <div>
        <PageIntro title="Още нямаш профил" lede="Запиши се и потвърди имейла. После профилът остава отворен на този браузър." />
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Запиши се
        </Link>
      </div>
    )
  }

  const experience = EXPERIENCE.find((item) => item.id === profile.experience)
  const radius = radiusOptions(profile.place).find((item) => item.id === profile.radius)

  return (
    <div className="grid gap-4">
      <PageIntro title={`${profile.firstName}, това е профилът ти`} lede="Профилът е отворен на този браузър. От телефона си влизаш със същия линк, когато имейлите тръгнат." />
      {profile.withdrawn ? (
        <p className="rounded-2xl bg-[#fff4f4] px-4 py-3">Записването е оттеглено. Мястото се освобождава. Можеш да се запишеш пак.</p>
      ) : null}
      <ol className="grid gap-2">
        {[
          ['Имейлът е потвърден', profile.emailConfirmed],
          ['Записването е готово', profile.submitted && !profile.withdrawn],
          ['Разпределението предстои', profile.submitted && !profile.withdrawn],
        ].map(([label, done]) => (
          <li key={String(label)} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
            <span className="mr-2 font-bold">{done ? 'Да' : 'Още не'}</span>
            {label}
          </li>
        ))}
      </ol>
      <p>Ще ти пишем, когато има секция, дата и адрес. Дотогава няма разпределение.</p>
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 leading-7">
        <p>{profile.firstName} {profile.middleName} {profile.lastName}</p>
        <p>{profile.email}</p>
        <p>{profile.phone}</p>
        <p>{roleLabel(profile.role, profile.mobileTeam)}</p>
        <p>{profile.rounds.first ? '25 октомври' : ''} {profile.rounds.runoff ? '1 ноември, балотаж' : ''}</p>
        <p>{experience?.title}</p>
        {profile.role !== 'video' ? (
          <>
            <p>{placeLabel(profile.place)}</p>
            <p>{radius?.label}</p>
            <p>Свободни места в колата: {profile.carSeats}</p>
          </>
        ) : null}
      </section>
      <p className="text-sm leading-6">
        Ако имаш по-малко опит и свободни места, или опит без кола, можем по-късно да те съчетаем с човек, който допълва профила ти. Това още не е конкретен човек.
      </p>
      {inviteLink ? (
        <div className="grid gap-3">
          <p>Твоят линк за покана. Който го отвори, се записва през теб.</p>
          <p className="break-all">{inviteLink}</p>
          <button type="button" className="brand-button" onClick={() => void navigator.clipboard.writeText(inviteLink)}>
            Копирай линка
          </button>
          <a className="brand-button" href={`viber://forward?text=${encodeURIComponent(`Запиши се за Ти Броиш ${inviteLink}`)}`}>
            Сподели във Viber
          </a>
          <a className="brand-button" href={`https://wa.me/?text=${encodeURIComponent(`Запиши се за Ти Броиш ${inviteLink}`)}`}>
            Сподели в WhatsApp
          </a>
          {referralCount > 0 ? <p>През твоя линк са минали {referralCount} души.</p> : null}
        </div>
      ) : null}
      {profile.companions.length > 0 ? (
        <ul className="grid gap-2">
          {profile.companions.map((person) => (
            <li key={person.id} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
              {person.firstName || person.email} · {person.status === 'confirmed' ? 'потвърден' : 'чака потвърждение'}
              {person.status === 'pending' ? (
                <button
                  type="button"
                  className="ml-3 text-sm font-bold text-[#2ab9a8]"
                  onClick={() =>
                    updateProfile({
                      companions: profile.companions.map((item) => (item.id === person.id ? { ...item, status: 'confirmed' } : item)),
                    })
                  }
                >
                  Симулирай потвърждение
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Промени данните
        </Link>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-3 font-bold"
          onClick={() => updateProfile({ withdrawn: !profile.withdrawn, submitted: profile.withdrawn ? profile.submitted : true })}
        >
          {profile.withdrawn ? 'Върни записването' : 'Оттегли записването'}
        </button>
      </div>
      <p className="text-sm leading-6">
        Това е доброволна дейност без заплащане. Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев.
      </p>
    </div>
  )
}

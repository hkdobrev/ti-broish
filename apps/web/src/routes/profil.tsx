import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PageIntro } from '../components/SiteChrome'
import { EXPERIENCE, placeLabel, radiusOptions, roleLabel } from '../signup/model'
import { ensureInviteCode, updateProfile, useProfile } from '../signup/store'

export const Route = createFileRoute('/profil')({ component: ProfilePage })

function ProfilePage() {
  const { profile, ready } = useProfile()
  if (!ready) return <p>Зареждаме профила…</p>
  if (!profile.email) {
    return (
      <div>
        <PageIntro title="Още нямаш профил" lede="Запиши се и потвърди имейла. После профилът те държи вписан на този браузър." />
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Запиши се
        </Link>
      </div>
    )
  }

  const experience = EXPERIENCE.find((item) => item.id === profile.experience)
  const radius = radiusOptions(profile.place).find((item) => item.id === profile.radius)
  const [inviteLink, setInviteLink] = useState('')
  useEffect(() => {
    if (!profile.emailConfirmed) return
    setInviteLink(`${window.location.origin}/pokana/${ensureInviteCode(profile)}`)
  }, [profile])

  return (
    <div className="max-w-3xl space-y-6">
      <PageIntro title={`${profile.firstName}, това е профилът ти`} lede="Вписан си на този браузър. От телефона си влизаш със същия линк, когато имейлите тръгнат." />
      {profile.withdrawn ? (
        <p className="rounded-2xl bg-[#fff4f4] px-4 py-3">Записът е оттеглен. Мястото се освобождава. Можеш да се запишеш пак.</p>
      ) : null}
      <ol className="grid gap-2">
        {[
          ['Имейлът е потвърден', profile.emailConfirmed],
          ['Профилът е записан', profile.submitted && !profile.withdrawn],
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
        <p>{profile.rounds.first ? 'Първи тур' : ''} {profile.rounds.runoff ? 'Балотаж' : ''}</p>
        <p>{experience?.title}</p>
        {profile.role !== 'video' ? (
          <>
            <p>{placeLabel(profile.place)}</p>
            <p>{radius?.label}</p>
            <p>Свободни места в колата: {profile.carSeats}</p>
            <p>{profile.wantsAction ? 'Иска рискови места с повече екшън.' : 'Без предпочитание за рискови места.'}</p>
          </>
        ) : null}
      </section>
      <p className="text-sm leading-6">
        Ако имаш по-малко опит и свободни места, или опит без кола, можем по-късно да те съчетаем с човек, който допълва профила ти. Това още не е конкретен човек.
      </p>
      {inviteLink ? (
        <p className="break-all text-sm leading-6">
          Линк за хора, с които се познавате: {inviteLink}
          {profile.joinedInvite ? ` Влязъл си с покана ${profile.joinedInvite}.` : ''}
        </p>
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
          {profile.withdrawn ? 'Върни записа' : 'Оттегли записа'}
        </button>
      </div>
      <p className="text-sm leading-6">
        Това е доброволна дейност без заплащане. Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев.
      </p>
    </div>
  )
}

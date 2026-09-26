import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BulgariaMap } from '../components/BulgariaMap'
import { PlacesPicker } from '../components/PlacesPicker'
import { geocodePlace } from '../signup/geo'
import { OBLASTS } from '../signup/oblasts'
import {
  EXPERIENCE,
  codeFor,
  highlightCodes,
  mapQuery,
  mapZoom,
  placeLabel,
  placeReady,
  radiusOptions,
  roleLabel,
  stepsFor,
  validEmail,
  validName,
  validPhone,
  type Companion,
  type Experience,
  type Role,
  type StepId,
} from '../signup/model'
import { ensureInviteCode, updateProfile, useProfile } from '../signup/store'

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>): { step: string } => ({
    step: typeof search.step === 'string' ? search.step : 'contact',
  }),
  component: SignupPage,
})

const button = 'brand-button disabled:opacity-40'
const ghost = 'flex min-h-14 w-full items-center justify-center rounded-[20px] border border-[#ddd] bg-white px-5 text-xl font-bold text-[#333]'
const field = 'min-h-11 w-full rounded-xl border border-[#ddd] bg-white px-3'

function SignupPage() {
  const { step } = Route.useSearch()
  const navigate = useNavigate()
  const { profile, ready } = useProfile()
  const [error, setError] = useState('')
  const [companion, setCompanion] = useState<Companion>(blankCompanion())
  const steps = stepsFor(profile.role)
  const requested = step === 'radius' ? 'place' : step
  const current = (steps as readonly string[]).includes(requested) ? (requested as StepId) : 'contact'
  const index = Math.max(0, steps.indexOf(current as (typeof steps)[number]))

  function go(next: StepId) {
    setError('')
    void navigate({ to: '/signup', search: { step: next } })
  }

  function nextStep() {
    const following = steps[index + 1]
    if (following) go(following)
  }

  const titles: Record<StepId, string> = {
    contact: 'Как да се свържем с теб',
    confirm: 'Потвърди имейла си',
    role: 'Как ще пазиш вота',
    rounds: 'Кога можеш да участваш',
    experience: 'Колко си подготвен',
    place: 'Къде е твоето място',
    seats: 'Свободни места в колата',
    people: 'Други хора',
    review: 'Преглед, преди да се запишеш',
  }

  if (!ready) return <p>Зареждаме данните…</p>

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black text-[#444]">{titles[current]}</h1>
      {current === 'contact' ? <Contact error={error} onError={setError} onNext={() => go(profile.emailConfirmed ? 'role' : 'confirm')} /> : null}
      {current === 'confirm' ? <Confirm error={error} onError={setError} onNext={() => go('role')} /> : null}
      {current === 'role' ? <RoleStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'rounds' ? <Rounds error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'experience' ? <ExperienceStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'place' ? <PlaceStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'seats' ? <Seats onNext={nextStep} /> : null}
      {current === 'people' ? <People companion={companion} setCompanion={setCompanion} onNext={nextStep} /> : null}
      {current === 'review' ? <Review error={error} onError={setError} /> : null}
      {index > 0 ? (
        <button type="button" className={`${ghost} mt-6`} onClick={() => go(steps[index - 1] ?? 'contact')}>
          Назад
        </button>
      ) : null}
    </div>
  )
}

function Contact({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!validName(profile.firstName) || !validName(profile.middleName) || !validName(profile.lastName)) {
          onError('Трите имена са на кирилица.')
          return
        }
        if (!validEmail(profile.email) || !validPhone(profile.phone)) {
          onError('Нужни са валидни имейл и телефон.')
          return
        }
        updateProfile({ confirmCode: codeFor(profile.email) })
        onNext()
      }}
    >
      <LegalNotice />
      <NameFields />
      <label className="grid gap-1 text-sm font-semibold">
        Имейл
        <input className={field} inputMode="email" autoComplete="email" value={profile.email} onChange={(event) => updateProfile({ email: event.target.value, emailConfirmed: false })} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Телефон
        <input className={field} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxx" value={profile.phone} onChange={(event) => updateProfile({ phone: event.target.value })} />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Изпрати код за потвърждение
      </button>
    </form>
  )
}

function NameFields() {
  const { profile } = useProfile()
  const fields = [
    ['firstName', 'Име', 'given-name'],
    ['middleName', 'Презиме', 'additional-name'],
    ['lastName', 'Фамилия', 'family-name'],
  ] as const
  return (
    <>
      {fields.map(([key, label, autoComplete]) => (
        <label key={key} className="grid gap-1 text-sm font-semibold">
          {label}
          <input className={field} autoComplete={autoComplete} value={profile[key]} onChange={(event) => updateProfile({ [key]: event.target.value })} />
        </label>
      ))}
    </>
  )
}

function Confirm({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  const [code, setCode] = useState('')
  const expected = profile.confirmCode || codeFor(profile.email)
  return (
    <div className="grid gap-4">
      <article className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <p className="text-sm text-[var(--ink-soft)]">От: Ти Броиш · До: {profile.email}</p>
        <h2 className="mt-2 text-xl font-extrabold">Потвърди имейла, преди да продължиш</h2>
        <p className="mt-2 leading-7">Кодът за този прототип е {expected}. В понеделник ще идва в истинско писмо, за да спрем ботовете и да няма усещане, че формулярът сам по себе си е край.</p>
        <LegalNotice />
        <button
          type="button"
          className={`${button} mt-3`}
          onClick={() => {
            updateProfile({ emailConfirmed: true, confirmCode: expected })
            onNext()
          }}
        >
          Отвори линка от писмото
        </button>
      </article>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim() !== expected) {
            onError('Кодът не съвпада.')
            return
          }
          updateProfile({ emailConfirmed: true })
          onNext()
        }}
      >
        <input className={field} inputMode="numeric" placeholder="Шестцифрен код" value={code} onChange={(event) => setCode(event.target.value)} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className={ghost} type="submit">
          Въведи кода
        </button>
      </form>
    </div>
  )
}

function RoleStep({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (profile.role !== 'section' && profile.role !== 'mobile') {
          onError('Избери секция или мобилен рисков екип.')
          return
        }
        onNext()
      }}
    >
      <Choice
        selected={profile.role === 'section'}
        title="В секция"
        text="Това е за предпочитане. Хартиените секции са с предимство. Машинна секция се ползва само ако за населеното място вече има твърде много записани. Ти не избираш кое от двете."
        onClick={() => updateProfile({ role: 'section', mobileTeam: false })}
      />
      <Choice
        selected={profile.role === 'mobile'}
        title="Мобилен рисков екип"
        text="Рисковите места са този екип. Не си вързан за една секция и пак избираш къде можеш да бъдеш."
        onClick={() => updateProfile({ role: 'mobile', mobileTeam: true })}
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function Choice({ selected, title, text, onClick }: { selected: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-[20px] border px-4 py-4 text-left ${selected ? 'border-[#38decb] bg-[#e7fbf8]' : 'border-[#ddd] bg-white'}`}>
      <span className="block text-lg font-extrabold">{title}</span>
      <span className="mt-1 block text-sm leading-6 text-[var(--ink-soft)]">{text}</span>
    </button>
  )
}

function Rounds({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!profile.rounds.first && !profile.rounds.runoff) {
          onError('Избери поне един от двата дни.')
          return
        }
        onNext()
      }}
    >
      <p>По-добре е да си и на двата дни: 25 октомври и балотажа на 1 ноември.</p>
      <label className="flex gap-3 rounded-2xl bg-white px-4 py-3">
        <input type="checkbox" checked={profile.rounds.first} onChange={(event) => updateProfile({ rounds: { ...profile.rounds, first: event.target.checked } })} />
        25 октомври
      </label>
      <label className="flex gap-3 rounded-2xl bg-white px-4 py-3">
        <input type="checkbox" checked={profile.rounds.runoff} onChange={(event) => updateProfile({ rounds: { ...profile.rounds, runoff: event.target.checked } })} />
        1 ноември, балотаж
      </label>
      {!profile.rounds.first || !profile.rounds.runoff ? <p className="text-sm">Ако можеш, остави и двата дни. Така секцията е покрита и ако има балотаж.</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function ExperienceStep({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!profile.experience) {
          onError('Избери едно ниво.')
          return
        }
        onNext()
      }}
    >
      {EXPERIENCE.map((item) => (
        <Choice key={item.id} selected={profile.experience === item.id} title={item.title} text={item.text} onClick={() => updateProfile({ experience: item.id as Experience })} />
      ))}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function PlaceStep({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null)
  const options = radiusOptions(profile.place)
  const highlighted = highlightCodes(profile.place, profile.radius, profile.distantRegionCodes)
  const query = mapQuery(profile.place, profile.radius)
  const zoom = mapZoom(profile.place, profile.radius)

  useEffect(() => {
    if (!query || zoom == null) {
      setFocus(null)
      return
    }
    let cancelled = false
    void geocodePlace({ data: { query, abroad: profile.place?.regionCode === '32' } }).then((hit) => {
      if (!cancelled) setFocus(hit ? { lat: hit.lat, lng: hit.lng, zoom } : null)
    })
    return () => {
      cancelled = true
    }
  }, [query, zoom, profile.place?.regionCode])

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!placeReady(profile.place)) {
          onError('Избери място до населено място или град в чужбина.')
          return
        }
        if (!profile.radius) {
          onError('Избери докъде можеш да стигнеш.')
          return
        }
        if (profile.radius === 'distant' && profile.place?.regionCode !== '32' && profile.distantRegionCodes.length === 0) {
          onError('Добави поне една друга област от картата.')
          return
        }
        onNext()
      }}
    >
      <BulgariaMap
        regionCodes={highlighted}
        focus={focus}
        interactive={profile.radius === 'distant' && profile.place?.regionCode !== '32'}
        onToggle={(code) => {
          const home = profile.place?.regionCode
          if (code === home || (home === 'sofia-merged' && code === '23')) return
          const exists = profile.distantRegionCodes.includes(code)
          updateProfile({
            distantRegionCodes: exists ? profile.distantRegionCodes.filter((item) => item !== code) : [...profile.distantRegionCodes, code],
          })
        }}
      />
      <PlacesPicker
        value={profile.place}
        onChange={(place) => {
          const regionChanged = place?.regionCode !== profile.place?.regionCode
          updateProfile({
            place,
            radius: regionChanged ? null : profile.radius,
            distantRegionCodes: regionChanged ? [] : profile.distantRegionCodes,
          })
        }}
      />
      {options.length > 0 ? (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">Докъде можеш да стигнеш</legend>
          {options.map((option) => (
            <label key={option.id} className="flex gap-3 rounded-2xl bg-white px-4 py-3">
              <input type="radio" name="radius" checked={profile.radius === option.id} onChange={() => updateProfile({ radius: option.id })} />
              {option.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {profile.radius === 'distant' && profile.place?.regionCode !== '32' ? (
        <p className="text-sm">
          Други области:{' '}
          {profile.distantRegionCodes.map((code) => OBLASTS.find((item) => item.regionCodes.includes(code))?.name ?? code).join(', ') || 'натисни ги на картата'}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function Seats({ onNext }: { onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <p>Колко души можеш да вземеш, освен себе си. 0 значи, че не возиш никого.</p>
      <div className="flex items-center gap-3">
        <button type="button" className={ghost} onClick={() => updateProfile({ carSeats: Math.max(0, profile.carSeats - 1) })}>
          −
        </button>
        <span className="text-3xl font-extrabold">{profile.carSeats}</span>
        <button type="button" className={ghost} onClick={() => updateProfile({ carSeats: Math.min(6, profile.carSeats + 1) })}>
          +
        </button>
      </div>
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function People({
  companion,
  setCompanion,
  onNext,
}: {
  companion: Companion
  setCompanion: (value: Companion) => void
  onNext: () => void
}) {
  const { profile } = useProfile()
  const [link, setLink] = useState('')
  useEffect(() => {
    setLink(`${window.location.origin}/pokana/${ensureInviteCode(profile)}`)
  }, [profile])

  function add(mode: Companion['mode']) {
    if (mode === 'invite') {
      if (!validEmail(companion.email)) return
      updateProfile({ companions: [...profile.companions, { ...blankCompanion(), mode, email: companion.email.trim(), id: crypto.randomUUID() }] })
      setCompanion(blankCompanion())
      return
    }
    if (!validName(companion.firstName) || !validName(companion.middleName) || !validName(companion.lastName) || !validEmail(companion.email) || !validPhone(companion.phone)) return
    if (!companion.samePlace && (!companion.role || !companion.experience)) return
    const filled: Companion = companion.samePlace
      ? {
          ...companion,
          mode,
          role: profile.role,
          mobileTeam: profile.mobileTeam,
          rounds: profile.rounds,
          experience: profile.experience,
        }
      : { ...companion, mode }
    updateProfile({ companions: [...profile.companions, { ...filled, id: crypto.randomUUID() }] })
    setCompanion(blankCompanion())
  }

  return (
    <div className="grid gap-4">
      <p>Попълни човека, или му прати линк. Той потвърждава своя имейл.</p>
      <article className="grid gap-3">
        <p className="break-all text-sm">{link || 'Линкът се появява в браузъра.'}</p>
        <button type="button" className={`${ghost} mt-3`} onClick={() => link && void navigator.clipboard.writeText(link)}>
          Копирай линка
        </button>
        <label className="mt-3 grid gap-1 text-sm font-semibold">
          Или само имейл
          <input className={field} value={companion.mode === 'invite' ? companion.email : ''} onChange={(event) => setCompanion({ ...blankCompanion(), mode: 'invite', email: event.target.value })} />
        </label>
        <button type="button" className={`${ghost} mt-3`} onClick={() => add('invite')}>
          Добави имейла
        </button>
      </article>
      <article className="grid gap-3">
        <div className="grid gap-2">
          <input className={field} placeholder="Име" value={companion.firstName} onChange={(event) => setCompanion({ ...companion, mode: 'full', firstName: event.target.value })} />
          <input className={field} placeholder="Презиме" value={companion.middleName} onChange={(event) => setCompanion({ ...companion, middleName: event.target.value })} />
          <input className={field} placeholder="Фамилия" value={companion.lastName} onChange={(event) => setCompanion({ ...companion, lastName: event.target.value })} />
          <input className={field} placeholder="Имейл" value={companion.mode === 'full' ? companion.email : ''} onChange={(event) => setCompanion({ ...companion, mode: 'full', email: event.target.value })} />
          <input className={field} placeholder="Телефон" value={companion.phone} onChange={(event) => setCompanion({ ...companion, phone: event.target.value })} />
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={companion.samePlace} onChange={(event) => setCompanion({ ...companion, samePlace: event.target.checked })} />
            Същите място, дни, роля и опит като мен
          </label>
          {!companion.samePlace ? (
            <div className="grid gap-2 rounded-xl bg-[#f7f7f7] p-3">
              <p className="text-sm">Те пак потвърждават своя имейл. Тук избираш вместо тях.</p>
              <label className="grid gap-1 text-sm font-semibold">
                Роля
                <select
                  className={field}
                  value={companion.role === 'mobile' ? 'mobile' : companion.role === 'section' ? 'section' : ''}
                  onChange={(event) => {
                    const role = (event.target.value || null) as Role | null
                    setCompanion({ ...companion, role, mobileTeam: role === 'mobile' })
                  }}
                >
                  <option value="">Избери</option>
                  <option value="section">Секция</option>
                  <option value="mobile">Мобилен рисков екип</option>
                </select>
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" checked={companion.rounds.first} onChange={(event) => setCompanion({ ...companion, rounds: { ...companion.rounds, first: event.target.checked } })} />
                25 октомври
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" checked={companion.rounds.runoff} onChange={(event) => setCompanion({ ...companion, rounds: { ...companion.rounds, runoff: event.target.checked } })} />
                1 ноември
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Опит
                <select className={field} value={companion.experience ?? ''} onChange={(event) => setCompanion({ ...companion, experience: (event.target.value || null) as Experience | null })}>
                  <option value="">Избери</option>
                  {EXPERIENCE.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
        <button type="button" className={`${ghost} mt-3`} onClick={() => add('full')}>
          Добави човека
        </button>
      </article>
      <ul className="grid gap-2 text-sm">
        {profile.companions.map((person) => (
          <li key={person.id}>
            {person.mode === 'full' ? `${person.firstName} ${person.lastName}` : person.email} · чака потвърждение
          </li>
        ))}
      </ul>
      <button type="button" className={button} onClick={onNext}>
        Напред
      </button>
    </div>
  )
}

function Review({ error, onError }: { error: string; onError: (value: string) => void }) {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const experience = EXPERIENCE.find((item) => item.id === profile.experience)
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!profile.consent) {
          onError('Нужно е потвърждението в края.')
          return
        }
        updateProfile({ submitted: true, withdrawn: false })
        void navigate({ to: '/profil' })
      }}
    >
      <ul className="grid gap-2 rounded-2xl bg-white p-4 leading-7">
        <li>
          {profile.firstName} {profile.middleName} {profile.lastName}
        </li>
        <li>
          {profile.email} · {profile.phone}
        </li>
        <li>{roleLabel(profile.role, profile.mobileTeam)}</li>
        <li>
          {profile.rounds.first ? '25 октомври' : ''} {profile.rounds.runoff ? '1 ноември' : ''}
        </li>
        <li>{experience?.title}</li>
        {profile.role !== 'video' ? (
          <>
            <li>{placeLabel(profile.place)}</li>
            <li>{radiusOptions(profile.place).find((item) => item.id === profile.radius)?.label}</li>
            <li>{profile.carSeats} свободни места</li>
          </>
        ) : null}
        <li>
          {profile.companions.length === 0
            ? 'Без други хора'
            : profile.companions.map((person) => (person.mode === 'full' ? `${person.firstName} ${person.lastName}` : person.email)).join(', ')}
        </li>
      </ul>
      <p className="leading-7">Хартиените секции са с предимство. Машинна секция се използва само ако за населеното място вече има твърде много записани.</p>
      <label className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 leading-7">
        <input type="checkbox" className="mt-1" checked={profile.consent} onChange={(event) => updateProfile({ consent: event.target.checked })} />
        <span>
          Разбирам, че това е доброволна дейност без заплащане и че ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев. Запознат съм с{' '}
          <Link to="/privacy-notice">декларацията за поверителност</Link>.
        </span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Запиши ме
      </button>
    </form>
  )
}

function LegalNotice() {
  return (
    <p className="rounded-xl bg-[#eee] px-3 py-3 text-sm leading-6 text-[#333]">
      Това е доброволна дейност без заплащане. Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев.
    </p>
  )
}

function blankCompanion(): Companion {
  return {
    id: '',
    mode: 'full',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    role: null as Role | null,
    mobileTeam: false,
    rounds: { first: true, runoff: true },
    experience: null,
    samePlace: true,
    status: 'pending',
  }
}

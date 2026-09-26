import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { PlacesPicker } from '../components/PlacesPicker'
import { RadiusMap } from '../components/RadiusMap'
import { OBLASTS } from '../signup/oblasts'
import {
  EXPERIENCE,
  codeFor,
  placeLabel,
  placeReady,
  radiusOptions,
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
const ghost = 'min-h-11 rounded-full border border-[var(--line)] bg-white px-5 font-bold'
const field = 'min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3'

function SignupPage() {
  const { step } = Route.useSearch()
  const navigate = useNavigate()
  const { profile, ready } = useProfile()
  const [error, setError] = useState('')
  const [companion, setCompanion] = useState<Companion>(blankCompanion())
  const steps = stepsFor(profile.role)
  const current = (steps as readonly string[]).includes(step) ? (step as StepId) : 'contact'
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
    rounds: 'За кои турове се записваш',
    experience: 'Колко си подготвен',
    place: 'Къде е твоето място',
    radius: 'Докъде можеш да стигнеш',
    seats: 'Свободни места в колата',
    action: 'Рискови места',
    people: 'Други хора',
    review: 'Преглед преди записа',
  }

  if (!ready) return <p>Зареждаме записа…</p>

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center text-sm font-bold text-[#888]">
        Стъпка {index + 1} от {steps.length}
      </p>
      <div className="mt-2 mb-6 h-2 overflow-hidden bg-[#eee]">
        <div className="h-full bg-[#38decb]" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <h1 className="mb-4 text-center text-3xl font-black text-[#444]">{titles[current]}</h1>
      {current === 'contact' ? <Contact error={error} onError={setError} onNext={() => go(profile.emailConfirmed ? 'role' : 'confirm')} /> : null}
      {current === 'confirm' ? <Confirm error={error} onError={setError} onNext={() => go('role')} /> : null}
      {current === 'role' ? <RoleStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'rounds' ? <Rounds error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'experience' ? <ExperienceStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'place' ? <PlaceStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'radius' ? <RadiusStep error={error} onError={setError} onNext={nextStep} /> : null}
      {current === 'seats' ? <Seats onNext={nextStep} /> : null}
      {current === 'action' ? <Action onNext={nextStep} /> : null}
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
      <NameFields />
      <label className="grid gap-1 text-sm font-semibold">
        Имейл
        <input className={field} inputMode="email" value={profile.email} onChange={(event) => updateProfile({ email: event.target.value, emailConfirmed: false })} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Телефон
        <input className={field} inputMode="tel" placeholder="08xxxxxxxx" value={profile.phone} onChange={(event) => updateProfile({ phone: event.target.value })} />
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
    ['firstName', 'Име'],
    ['middleName', 'Презиме'],
    ['lastName', 'Фамилия'],
  ] as const
  return (
    <>
      {fields.map(([key, label]) => (
        <label key={key} className="grid gap-1 text-sm font-semibold">
          {label}
          <input className={field} value={profile[key]} onChange={(event) => updateProfile({ [key]: event.target.value })} />
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
        if (!profile.role) {
          onError('Избери път.')
          return
        }
        onNext()
      }}
    >
      <Choice
        selected={profile.role === 'section'}
        title="В секция"
        text="Това е за предпочитане. Хартиените секции са с предимство. Машинна секция се ползва само ако за населеното място вече има твърде много записани. Ти не избираш кое от двете."
        onClick={() => updateProfile({ role: 'section' })}
      />
      {profile.role === 'section' ? (
        <label className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
          <input type="checkbox" className="mt-1" checked={profile.mobileTeam} onChange={(event) => updateProfile({ mobileTeam: event.target.checked })} />
          <span>Искам и мобилен рисков екип. Мястото си остава. Екипът покрива рискови места и не е вързан за една секция.</span>
        </label>
      ) : null}
      <Choice
        selected={profile.role === 'video'}
        title="Видеонаблюдение от вкъщи"
        text="По-кратък път, без карта, кола и мобилен екип."
        onClick={() => updateProfile({ role: 'video', mobileTeam: false })}
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
          onError('Избери поне един тур.')
          return
        }
        onNext()
      }}
    >
      <p>И двата тура са за предпочитане: 25 октомври и 1 ноември.</p>
      <label className="flex gap-3 rounded-2xl bg-white px-4 py-3">
        <input type="checkbox" checked={profile.rounds.first} onChange={(event) => updateProfile({ rounds: { ...profile.rounds, first: event.target.checked } })} />
        Първи тур, 25 октомври
      </label>
      <label className="flex gap-3 rounded-2xl bg-white px-4 py-3">
        <input type="checkbox" checked={profile.rounds.runoff} onChange={(event) => updateProfile({ rounds: { ...profile.rounds, runoff: event.target.checked } })} />
        Балотаж, 1 ноември
      </label>
      {!profile.rounds.first || !profile.rounds.runoff ? <p className="text-sm">Ако можеш, остави и двата. Така покриваме секцията и ако има балотаж.</p> : null}
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
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!placeReady(profile.place)) {
          onError('Избери място до населено място или град в чужбина.')
          return
        }
        onNext()
      }}
    >
      <p>Едно основно място, колкото може по-точно: област, община, населено място и секция, ако имаш.</p>
      <PlacesPicker value={profile.place} onChange={(place) => updateProfile({ place, radius: null, distantRegionCodes: [] })} />
      <p className="text-sm leading-6">Списъците идват от api.tibroish.bg и са от последните избори, докато излезе списъкът за президентския вот.</p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={button} type="submit">
        Напред
      </button>
    </form>
  )
}

function RadiusStep({ error, onError, onNext }: { error: string; onError: (value: string) => void; onNext: () => void }) {
  const { profile } = useProfile()
  const options = radiusOptions(profile.place)
  const highlighted = useMemo(() => {
    const home = profile.place?.regionCode
    if (!home || home === '32' || home === 'sofia-merged') {
      return home === 'sofia-merged' ? ['23', ...(profile.radius === 'distant' ? profile.distantRegionCodes : [])] : profile.distantRegionCodes
    }
    return [home, ...(profile.radius === 'distant' ? profile.distantRegionCodes : [])]
  }, [profile.place, profile.radius, profile.distantRegionCodes])

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!profile.radius) {
          onError('Избери докъде стигаш.')
          return
        }
        if (profile.radius === 'distant' && profile.place?.regionCode !== '32' && profile.distantRegionCodes.length === 0) {
          onError('Добави поне една друга област от картата.')
          return
        }
        onNext()
      }}
    >
      <RadiusMap
        regionCodes={highlighted}
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
      {profile.place?.regionCode === '32' ? <p className="text-sm">Чужбина не се очертава на тази карта.</p> : null}
      <div className="grid gap-2">
        {options.map((option) => (
          <label key={option.id} className="flex gap-3 rounded-2xl bg-white px-4 py-3">
            <input type="radio" name="radius" checked={profile.radius === option.id} onChange={() => updateProfile({ radius: option.id })} />
            {option.label}
          </label>
        ))}
      </div>
      {profile.radius === 'distant' && profile.place?.regionCode !== '32' ? (
        <p className="text-sm">
          Избрани други области:{' '}
          {profile.distantRegionCodes.map((code) => OBLASTS.find((item) => item.regionCodes.includes(code))?.name ?? code).join(', ') || 'няма'}
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

function Action({ onNext }: { onNext: () => void }) {
  const { profile } = useProfile()
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <label className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
        <input type="checkbox" className="mt-1" checked={profile.wantsAction} onChange={(event) => updateProfile({ wantsAction: event.target.checked })} />
        <span>Искам рискови места с повече екшън. Това е отделно от мобилния екип.</span>
      </label>
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
    if (mode === 'invite' && !validEmail(companion.email) && !companion.email) return
    if (mode === 'full' && (!validName(companion.firstName) || !validEmail(companion.email))) return
    updateProfile({ companions: [...profile.companions, { ...companion, mode, id: crypto.randomUUID() }] })
    setCompanion(blankCompanion())
  }

  return (
    <div className="grid gap-4">
      <p>Можеш да попълниш човека изцяло, все едно записваш семейството, или да пратиш линк и той сам да си попълни.</p>
      <article className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-extrabold">Линк</h2>
        <p className="mt-2 break-all text-sm">{link || 'Линкът се появява в браузъра.'}</p>
        <label className="mt-3 grid gap-1 text-sm font-semibold">
          Или само имейл
          <input className={field} value={companion.mode === 'invite' ? companion.email : ''} onChange={(event) => setCompanion({ ...blankCompanion(), mode: 'invite', email: event.target.value })} />
        </label>
        <button type="button" className={`${ghost} mt-3`} onClick={() => add('invite')}>
          Добави имейла
        </button>
      </article>
      <article className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-extrabold">Попълни данните вместо тях</h2>
        <div className="mt-3 grid gap-2">
          <input className={field} placeholder="Име" value={companion.firstName} onChange={(event) => setCompanion({ ...companion, mode: 'full', firstName: event.target.value })} />
          <input className={field} placeholder="Презиме" value={companion.middleName} onChange={(event) => setCompanion({ ...companion, middleName: event.target.value })} />
          <input className={field} placeholder="Фамилия" value={companion.lastName} onChange={(event) => setCompanion({ ...companion, lastName: event.target.value })} />
          <input className={field} placeholder="Имейл" value={companion.mode === 'full' ? companion.email : ''} onChange={(event) => setCompanion({ ...companion, mode: 'full', email: event.target.value })} />
          <input className={field} placeholder="Телефон" value={companion.phone} onChange={(event) => setCompanion({ ...companion, phone: event.target.value })} />
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={companion.samePlace} onChange={(event) => setCompanion({ ...companion, samePlace: event.target.checked })} />
            Същите място, тур и роля като мен
          </label>
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
        <li>{profile.role === 'video' ? 'Видеонаблюдение от вкъщи' : `Секция${profile.mobileTeam ? ' и мобилен рисков екип' : ''}`}</li>
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
        <li>{profile.companions.length} други хора</li>
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

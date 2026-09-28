import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'
import { useProfile } from '../signup/store'

export const Route = createFileRoute('/znachka')({ component: BadgePage })

function BadgePage() {
  const { profile, ready } = useProfile()
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const section = profile.assignedSection
  const personalized = Boolean(name && section)
  return (
    <div className="grid gap-6">
      <div className="no-print">
        <PageIntro
          title="Значка за печат"
          lede={
            personalized
              ? 'На значката са името и секцията. Пълномощното е отделно и идва дигитално след разпределението.'
              : 'На значката пише „Представител на инициативен комитет“. Когато имаш назначена секция, тук ще видим и името, и номера.'
          }
        />
        <button type="button" className="brand-button" onClick={() => window.print()}>
          Отпечатай
        </button>
        <a className="mt-3 inline-block font-bold" href="/oznachenie-predstavitel.pdf" download>
          Свали образеца
        </a>
        <Link to="/profil" className="mt-3 block font-bold">
          Назад към профила
        </Link>
      </div>
      <article className="badge-sheet mx-auto flex w-full max-w-xs flex-col items-center justify-center gap-3 border border-[#777] bg-white px-4 py-10 text-center">
        <h2 className="text-xl font-bold leading-snug text-black">
          ПРЕДСТАВИТЕЛ НА
          <br />
          ИНИЦИАТИВЕН КОМИТЕТ
        </h2>
        {ready && personalized ? (
          <>
            <p className="text-base font-bold text-black">{name}</p>
            <p className="text-sm text-black">Секция {section}</p>
          </>
        ) : null}
      </article>
    </div>
  )
}

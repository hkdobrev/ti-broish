import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'
import { useProfile } from '../signup/store'

export const Route = createFileRoute('/znachka')({ component: BadgePage })

function BadgePage() {
  const { profile, ready } = useProfile()
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Пазител на вота'
  return (
    <div className="grid gap-6">
      <div className="no-print">
        <PageIntro title="Значка за печат" lede="Можеш да я отпечаташ още сега. Пълномощното е отделно и идва дигитално след разпределението." />
        <button type="button" className="brand-button" onClick={() => window.print()}>
          Отпечатай
        </button>
        <Link to="/profil" className="mt-3 inline-block font-bold">
          Назад към профила
        </Link>
      </div>
      <article className="badge-sheet mx-auto w-full max-w-sm border-4 border-[#38decb] bg-white p-6 text-center">
        <p className="text-sm font-bold tracking-wide text-[#0e8f82]">ТИ БРОИШ</p>
        <h2 className="mt-4 text-3xl font-black text-[#444]">Пазител на вота</h2>
        <p className="mt-6 text-2xl font-bold">{ready ? name : '…'}</p>
        <p className="mt-4 leading-7">
          {profile.rounds.first ? '25 октомври 2026' : ''}
          {profile.rounds.first && profile.rounds.runoff ? ' · ' : ''}
          {profile.rounds.runoff ? '1 ноември 2026' : ''}
        </p>
        <p className="mt-6 text-sm leading-6 text-[#666]">Доброволно участие. Това не е документ за гласуване.</p>
      </article>
    </div>
  )
}

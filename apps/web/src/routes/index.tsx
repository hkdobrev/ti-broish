import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="text-center">
      <PageIntro
        kicker="25 октомври 2026 · балотаж 1 ноември"
        title="Търсим пазители на вота за всяка секция."
        lede="Запиши се днес. Потвърди имейла си още в началото, после виж статуса в профила. Разпределението идва по-късно, с дата и място."
      />
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
          Запиши се
        </Link>
        <Link to="/about" className="brand-button">
          За кампанията
        </Link>
      </div>
      <section className="grid gap-6 text-left md:grid-cols-2">
        {[
          ['В секция', 'Това е за предпочитане. Хартиените секции са първи. Машинна секция се ползва само ако за населеното място вече има твърде много хора. Ти не избираш кое от двете.'],
          ['Мобилен рисков екип', 'Рисковите места са този екип. Не си вързан за една секция и пак казваш къде можеш да бъдеш.'],
        ].map(([title, text]) => (
          <article key={title}>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#333]">{text}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto mt-10 max-w-3xl space-y-3 text-left text-base leading-7">
        <h2 className="text-center text-2xl font-bold">След записа</h2>
        <p>Имейлът се потвърждава преди останалото, за да няма усещане, че краят на формуляра е край на записа.</p>
        <p>Можеш да гласуваш само там, където обичайно гласуваш. Разпределението не ти дава право да гласуваш в друга секция.</p>
        <p>Можеш да запишеш и други хора с техните данни, или да им пратиш линк. Групата няма име.</p>
        <p>
          Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев, №4 в бюлетината.
        </p>
        <p className="text-center font-bold">Това е доброволна дейност без заплащане.</p>
      </section>
    </div>
  )
}

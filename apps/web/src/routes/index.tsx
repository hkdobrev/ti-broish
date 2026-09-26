import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <>
      <PageIntro
        kicker="Президентски избори · 25 октомври 2026"
        title="Търсим пазители на вота за всяка секция."
        lede="От площада поискахме честни избори. Сега ги пазим в секциите. Записването е доброволно и без заплащане."
      />
      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/signup" className="rounded-full bg-[var(--blue)] px-5 py-3 text-white no-underline">
          Запиши се
        </Link>
        <Link to="/about" className="rounded-full border border-[var(--line)] bg-white px-5 py-3 no-underline">
          За кампанията
        </Link>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['В секция', 'Хартиените секции са с предимство. Машинна секция идва само ако за населеното място вече има твърде много хора.'],
          ['Мобилен рисков екип', 'Можеш да го избереш заедно със секция. Екипът покрива рискови места и не е вързан за една секция.'],
          ['Видеонаблюдение от вкъщи', 'По-кратък път, ако не можеш да отидеш на място.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 max-w-3xl space-y-3 text-base leading-7">
        <h2 className="text-2xl font-extrabold">Какво следва, след като се запишеш</h2>
        <p>Потвърждаваш имейла си още в началото. После попълваш профил и виждаш статуса си.</p>
        <p>Когато секциите са ясни, ще ти пишем къде и кога си разпределен. Дотогава в профила пише, че разпределението предстои.</p>
        <p>
          Ще бъдете представител на Инициативния комитет за президентската двойка Андрей Гюров и Георги Кандев, №4 в бюлетината. Първи тур е на 25 октомври, балотаж на 1 ноември.
        </p>
        <p className="font-bold">Това е доброволна дейност без заплащане.</p>
      </section>
    </>
  )
}

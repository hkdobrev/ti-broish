import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/instructions')({ component: InstructionsPage })

const files = [
  ['Наръчник на пазителя на вота', 'https://tibroish.bg/files/Narachnik-Ti-broish.pdf'],
  ['Обучителен материал, НС 27.10.2024', 'https://tibroish.bg/files/Ти%20Броиш%20Обучителен%20материал%20-%20НС%2027.10.2024.pdf'],
]

function InstructionsPage() {
  return (
    <article className="max-w-3xl space-y-4 text-base leading-7">
      <PageIntro
        kicker="Инструкции"
        title="Преди да влезеш в секцията"
        lede="Материалите за тези президентски избори още се подготвят. Дотогава важат правилата от досегашните кампании."
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>Изборният ден е от 7:00 до 20:00 ч.</li>
        <li>Влез най-късно час преди затваряне и остани до края на протокола.</li>
        <li>Не пречиш на СИК и не пропускаш нарушение.</li>
        <li>Без копие от протокола работата не е приключила.</li>
      </ul>
      <h2 className="pt-2 text-2xl font-extrabold">Материали</h2>
      <ul className="space-y-2">
        {files.map(([label, href]) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
      <p>
        Още не си записан? <Link to="/signup">Запиши се</Link>
      </p>
    </article>
  )
}

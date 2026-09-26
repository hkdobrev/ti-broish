import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <article className="max-w-3xl space-y-4 text-base leading-7">
      <PageIntro title="Какво е „Ти Броиш“?" />
      <p>
        „Ти Броиш“ е създадена през 2020 г. и се утвърди като национална гражданска платформа за опазване на честността на изборите в България. За този период записалите се застъпници и наблюдатели надхвърлят 50 хиляди души.
      </p>
      <p>
        На президентските избори на 25 октомври 2026 г. търсим пазители на вота за секциите в страната и в чужбина. Балотажът е на 1 ноември. По-добре е да можеш и на двата дни.
      </p>
      <p>
        Попълваш данните си и потвърждаваш имейла още в началото. В изборния ден влизаш най-късно час преди затварянето и оставаш до протокола.
      </p>
      <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
        Запиши се
      </Link>
      <p className="font-bold">Това е доброволна дейност без заплащане.</p>
    </article>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/izvan-bulgaria')({ component: AbroadPage })

function AbroadPage() {
  return (
    <article className="max-w-3xl space-y-4 text-base leading-7">
      <PageIntro
        title="Секции в чужбина"
        lede="Ако си извън България, в записването избери „Извън страната“, после държава и град."
      />
      <p>
        Заявленията за гласуване извън страната се подават отделно, по реда на ЦИК. Записването тук е за пазител на вота, не за вписване в избирателния списък.
      </p>
      <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
        Запиши се
      </Link>
    </article>
  )
}

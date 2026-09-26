import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '../components/SiteChrome'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="grid gap-6">
      <PageIntro
        title="Пазители на вота за всяка секция."
        lede="25 октомври и балотаж на 1 ноември. Запиши се, потвърди имейла и избери секция или мобилен рисков екип."
      />
      <Link to="/signup" search={{ step: 'contact' }} className="brand-button">
        Запиши се
      </Link>
      <div className="grid gap-4 text-lg leading-7">
        <p>
          <strong>В секция.</strong> Хартиените секции са първи. Машинна секция се ползва само ако за населеното място вече има твърде много хора.
        </p>
        <p>
          <strong>Мобилен рисков екип.</strong> Рисковите места са този екип. Не си вързан за една секция и пак казваш къде можеш да бъдеш.
        </p>
        <p>Ще бъдете представител на Инициативния комитет за Андрей Гюров и Георги Кандев. Това е доброволна дейност без заплащане.</p>
      </div>
    </div>
  )
}

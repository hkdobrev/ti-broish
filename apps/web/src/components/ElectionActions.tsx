import { Link } from '@tanstack/react-router'

export function ElectionActions() {
  return (
    <div className="grid gap-3">
      <Link to="/signal" className="brand-button">
        Подай сигнал
      </Link>
      <Link to="/protokol" className="brand-button">
        Изпрати протокол
      </Link>
      <Link to="/izprateni" className="brand-button">
        Изпратените от теб
      </Link>
    </div>
  )
}

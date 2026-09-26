import { Link } from '@tanstack/react-router'
import { useState } from 'react'

const links = [
  { to: '/signup', label: 'Запиши се' },
  { to: '/about', label: 'Кампанията' },
  { to: '/news', label: 'Актуално' },
  { to: '/izvan-bulgaria', label: 'Извън страната' },
  { to: '/instructions', label: 'Инструкции' },
  { to: '/profil', label: 'Профил' },
] as const

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[#0c7d70] bg-[#12b5a4]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="shrink-0">
            <img src="/logo-white.png" alt="Ти Броиш" className="h-8 w-auto" />
          </Link>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-full px-3 py-2 text-sm font-bold text-white no-underline hover:bg-white/15">
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="ml-auto min-h-11 rounded-full px-3 font-bold text-white lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Меню
          </button>
        </div>
        {open ? (
          <nav className="grid border-t border-white/20 px-3 py-2 lg:hidden">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-xl px-3 py-3 font-bold text-white no-underline" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <div className="bg-[#14332f] px-4 py-2 text-center text-sm text-[#d7fff8]">
        Прототип за преглед. Имейлът не се изпраща, а записът стои само в този браузър.
      </div>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      <footer className="mt-8 border-t border-[var(--line)] bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-bold">Контакти</h2>
            <a className="mt-2 block text-[var(--blue)]" href="mailto:team@tibroish.bg">
              team@tibroish.bg
            </a>
          </div>
          <div>
            <h2 className="text-sm font-bold">Карта на сайта</h2>
            <div className="mt-2 grid gap-1">
              <Link to="/signup">Запиши се</Link>
              <Link to="/instructions">Инструкции</Link>
              <Link to="/privacy-notice">Декларация за поверителност</Link>
              <a href="https://tibroish.bg/results/parliament-2026-04-19/violation/new">Подай сигнал</a>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold">Facebook</h2>
            <a className="mt-2 block" href="https://www.facebook.com/tibroish/">
              Ти Броиш
            </a>
          </div>
        </div>
        <p className="pb-6 text-center text-sm text-[var(--ink-soft)]">Ти Броиш © {new Date().getFullYear()}</p>
      </footer>
    </>
  )
}

export function PageIntro({ kicker, title, lede }: { kicker?: string; title: string; lede?: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      {kicker ? <p className="mb-2 text-sm font-bold tracking-wide text-[var(--blue)] uppercase">{kicker}</p> : null}
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">{title}</h1>
      {lede ? <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">{lede}</p> : null}
    </header>
  )
}

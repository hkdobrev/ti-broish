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
      <header className="sticky top-0 z-20 h-[60px] bg-[#0c5c56]">
        <div className="mx-auto flex h-full max-w-[1000px] items-center px-2.5">
          <Link to="/" className="shrink-0">
            <img src="/logo-white.png" alt="Ти Броиш" className="h-10 w-auto" />
          </Link>
          <nav className="ml-auto hidden items-center lg:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-2.5 py-2.5 text-sm font-bold text-white no-underline hover:text-[#bff6ef] aria-[current=page]:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="ml-auto min-h-11 bg-transparent px-3 text-[35px] leading-none font-bold text-white lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            ☰
          </button>
        </div>
        {open ? (
          <nav className="absolute inset-x-0 top-[60px] grid bg-[#0c5c56] px-5 py-2 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="py-2.5 text-lg font-bold text-white no-underline hover:text-[#bff6ef]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <p className="bg-white px-4 py-2 text-center text-sm text-[#333]">
        Прототип за преглед. Имейлът не се изпраща, а данните остават само в този браузър.
      </p>
      <main className="mx-auto w-full max-w-[1000px] bg-white px-4 py-8 sm:px-[60px]">{children}</main>
      <div className="h-10 bg-[#38decb]" />
      <footer className="bg-[#eee] text-[#333]">
        <div className="mx-auto grid max-w-[900px] gap-6 px-5 py-8 sm:grid-cols-3 sm:py-[50px]">
          <div>
            <h2 className="text-base font-bold text-[#333]">Контакти</h2>
            <a className="mt-2 block font-bold text-[#333]" href="mailto:team@tibroish.bg">
              team@tibroish.bg
            </a>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#333]">Карта на сайта</h2>
            <div className="mt-2 grid">
              <Link to="/signup" search={{ step: 'contact' }} className="py-1 font-bold text-[#333] no-underline">
                Запиши се
              </Link>
              <Link to="/instructions" className="py-1 font-bold text-[#333] no-underline">
                Инструкции
              </Link>
              <Link to="/privacy-notice" className="py-1 font-bold text-[#333] no-underline">
                Декларация за поверителност
              </Link>
              <a className="py-1 font-bold text-[#333]" href="https://tibroish.bg/results/parliament-2026-04-19/violation/new">
                Подай сигнал
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#333]">Facebook</h2>
            <a className="mt-2 block font-bold text-[#333]" href="https://www.facebook.com/tibroish/">
              Ти Броиш
            </a>
          </div>
        </div>
        <p className="bg-[#666] py-5 text-center font-bold text-white">Ти Броиш © {new Date().getFullYear()}</p>
      </footer>
    </>
  )
}

export function PageIntro({ kicker, title, lede }: { kicker?: string; title: string; lede?: string }) {
  return (
    <header className="mb-6">
      {kicker ? <p className="mb-2 text-center text-sm font-bold text-[#888]">{kicker}</p> : null}
      <h1 className="text-center text-3xl font-black text-[#444] sm:text-5xl">{title}</h1>
      {lede ? <p className="mt-4 text-base leading-7 text-[#333]">{lede}</p> : null}
    </header>
  )
}

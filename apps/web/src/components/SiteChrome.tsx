import { Link } from '@tanstack/react-router'

const links = [
  { to: '/signup', label: 'Запиши се' },
  { to: '/about', label: 'Кампанията' },
  { to: '/news', label: 'Актуално' },
  { to: '/izvan-bulgaria', label: 'Извън страната' },
  { to: '/instructions', label: 'Инструкции' },
  { to: '/profil', label: 'Профил' },
] as const

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 bg-[#38decb]">
        <div className="mx-auto flex max-w-lg flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <Link to="/" className="shrink-0">
            <img src="/logo-white.png" alt="Ти Броиш" className="h-10 w-auto" />
          </Link>
          <nav className="flex flex-wrap items-center">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-2 py-2 text-base font-bold text-white no-underline hover:text-[#eee] aria-[current=page]:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg bg-white px-4 py-8">{children}</main>
      <div className="h-10 bg-[#38decb]" />
      <footer className="bg-[#eee] text-[#333]">
        <nav className="mx-auto flex max-w-lg flex-wrap gap-x-4 gap-y-2 px-4 py-6">
          <a className="font-bold text-[#333]" href="mailto:team@tibroish.bg">
            team@tibroish.bg
          </a>
          <Link to="/signup" search={{ step: 'contact' }} className="font-bold text-[#333] no-underline">
            Запиши се
          </Link>
          <Link to="/privacy-notice" className="font-bold text-[#333] no-underline">
            Поверителност
          </Link>
          <a className="font-bold text-[#333]" href="https://www.facebook.com/tibroish/">
            Facebook
          </a>
        </nav>
        <p className="bg-[#666] py-4 text-center font-bold text-white">Ти Броиш © {new Date().getFullYear()}</p>
      </footer>
    </>
  )
}

export function PageIntro({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-black text-[#444]">{title}</h1>
      {lede ? <p className="mt-3 text-lg leading-7 text-[#333]">{lede}</p> : null}
    </header>
  )
}

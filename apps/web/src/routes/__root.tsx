import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { SiteChrome } from '../components/SiteChrome'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex, nofollow' },
      { title: 'Ти Броиш' },
      { name: 'description', content: 'Запиши се като пазител на вота. Доброволно и без заплащане.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteChrome>{children}</SiteChrome>
        <Scripts />
      </body>
    </html>
  )
}

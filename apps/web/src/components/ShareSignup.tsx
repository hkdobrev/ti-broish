import { useState } from 'react'

const shareText = 'Аз се записах за пазител на вота. Запиши се и ти!'

export function ShareSignup({ link, count }: { link: string; count: number }) {
  const [copied, setCopied] = useState(false)
  const text = `${shareText} ${link}`
  return (
    <div className="grid gap-3">
      <p>Ако искаш, прати линка. Който го отвори, се записва през теб. Това не ви слага в една група.</p>
      <p className="break-all text-sm">{link}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-full border border-[#ddd] bg-white px-4 font-bold"
          onClick={() => {
            void navigator.clipboard.writeText(link).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            })
          }}
        >
          {copied ? 'Копирано' : 'Копирай'}
        </button>
        <a className="inline-flex min-h-11 items-center rounded-full bg-[#7360f2] px-4 font-bold text-white no-underline" href={`viber://forward?text=${encodeURIComponent(text)}`}>
          Viber
        </a>
        <a className="inline-flex min-h-11 items-center rounded-full bg-[#25d366] px-4 font-bold text-white no-underline" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>
          WhatsApp
        </a>
        <a className="inline-flex min-h-11 items-center rounded-full bg-[#1877f2] px-4 font-bold text-white no-underline" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer">
          Facebook
        </a>
      </div>
      {count > 0 ? <p className="text-sm">През твоя линк са минали {count} души.</p> : null}
    </div>
  )
}

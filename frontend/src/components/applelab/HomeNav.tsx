'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

import { LOCALES } from '@/i18n/config'
import { usePathname, useRouter } from '@/i18n/navigation'

const LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#how', label: 'How it works' },
  { href: '#tracker', label: 'Track repair' },
  { href: '#corporate', label: 'Corporate' },
  { href: '#blog', label: 'Blog' },
]

/**
 * Sticky translucent homepage nav. The hamburger opens a full-width drawer on
 * tablet/mobile, where the design hides the inline links.
 */
export default function HomeNav() {
  const [open, setOpen] = useState(false)
  const activeLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const otherLocale = LOCALES.find((l) => l !== activeLocale)
  const switchLocale = () => {
    if (otherLocale) router.replace(pathname, { locale: otherLocale })
  }

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-inner">
        <a href="#top" className="nav-brand" aria-label="Apple Lab home">
          <img src="/applelab/icon.svg" alt="" aria-hidden="true" />
          <span className="wordmark">Apple Lab</span>
        </a>
        <ul className="nav-links">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          {LOCALES.length > 1 ? (
            <button
              className="nav-lang"
              type="button"
              aria-label="Switch language"
              onClick={switchLocale}
            >
              বাংলা / EN
            </button>
          ) : null}
          <a href="#booking" className="btn btn-primary btn-sm">
            Book a Repair
          </a>
          <button
            className="nav-burger"
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg>
              <use href={open ? '#i-x' : '#i-burger'} />
            </svg>
          </button>
        </div>
      </div>

      <div className={`nav-drawer${open ? ' open' : ''}`} hidden={!open}>
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-drawer-actions">
          <a href="#booking" className="btn btn-primary" onClick={() => setOpen(false)}>
            Book a Repair
          </a>
          {LOCALES.length > 1 ? (
            <button className="nav-lang" type="button" onClick={switchLocale}>
              বাংলা / EN
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

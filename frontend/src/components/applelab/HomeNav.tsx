'use client'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import { usePathname, useRouter } from '@/i18n/navigation'

const LINKS = [
  { href: '#services', key: 'services' },
  { href: '#how', key: 'how' },
  { href: '#tracker', key: 'tracker' },
  { href: '#corporate', key: 'corporate' },
  { href: '#blog', key: 'blog' },
] as const

/**
 * Sticky translucent homepage nav (Apple Lab design). Labels come from
 * messages `applelab.nav`; the language switch uses the template locale
 * config and shows the OTHER locale's native name.
 */
export default function HomeNav() {
  const t = useTranslations('applelab.nav')
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

  const otherLocale = LOCALES.find((l) => l !== activeLocale) as AppLocale | undefined
  const switchLocale = () => {
    if (otherLocale) router.replace(pathname, { locale: otherLocale })
  }

  const languageButton = (extraClass = '') =>
    otherLocale ? (
      <button
        className={`nav-lang${extraClass}`}
        type="button"
        lang={otherLocale}
        aria-label={t('switchLanguage')}
        data-testid={`language-option-${otherLocale}`}
        onClick={switchLocale}
      >
        {LOCALE_LABELS[otherLocale]}
      </button>
    ) : null

  return (
    <nav className="nav" aria-label={t('primary')} data-testid="site-navbar">
      <div className="nav-inner">
        <a href="#top" className="nav-brand" aria-label={t('home')}>
          <img src="/applelab/icon.svg" alt="" aria-hidden="true" />
          <span className="wordmark">Apple Lab</span>
        </a>
        <ul className="nav-links">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link">
                {t(link.key)}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right" data-testid="navbar-desktop-actions">
          {languageButton()}
          <a href="#booking" className="btn btn-primary btn-sm" data-testid="navbar-cta">
            {t('book')}
          </a>
          <button
            className="nav-burger"
            type="button"
            aria-label={open ? t('menuClose') : t('menuOpen')}
            aria-expanded={open}
            data-testid="navbar-menu-button"
            onClick={() => setOpen((v) => !v)}
          >
            <svg>
              <use href={open ? '#i-x' : '#i-burger'} />
            </svg>
          </button>
        </div>
      </div>

      <div className={`nav-drawer${open ? ' open' : ''}`} hidden={!open} data-testid="navbar-drawer">
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {t(link.key)}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-drawer-actions">
          <a href="#booking" className="btn btn-primary" onClick={() => setOpen(false)}>
            {t('book')}
          </a>
          {languageButton(' drawer')}
        </div>
      </div>
    </nav>
  )
}

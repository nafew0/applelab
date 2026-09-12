import { getTranslations } from 'next-intl/server'

import { LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { getCatalogIndex } from '@/lib/catalog'
import { getSiteConfig } from '@/lib/content'

const SOCIALS = [
  { key: 'facebook', icon: 'i-fb', label: 'Facebook' },
  { key: 'instagram', icon: 'i-ig', label: 'Instagram' },
  { key: 'youtube', icon: 'i-yt', label: 'YouTube' },
  { key: 'linkedin', icon: 'i-in', label: 'LinkedIn' },
] as const

const QUICK_LINKS = [
  { key: 'book', href: '/f/demo' },
  { key: 'track', href: '/#tracker' },
  { key: 'quote', href: '/services' },
  { key: 'corporate', href: '/#corporate' },
] as const

/** Pages not built yet — plain anchors until they exist. */
const PENDING_LINKS = ['sell', 'faq', 'warranty'] as const

function telHref(display: string): string {
  const digits = display.replace(/\D/g, '')
  return `tel:+${digits.startsWith('0') ? `88${digits}` : digits}`
}

/**
 * Apple Lab site footer (design port). Shared by every page in the
 * (applelab) route group. Service links come from the live device catalog,
 * contact details from SiteConfig, labels from messages `applelab.footer`.
 */
export default async function HomeFooter({ locale }: { locale: string }) {
  const [t, config, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab' }),
    getSiteConfig(locale),
    getCatalogIndex(locale),
  ])
  const families = catalog?.families ?? []
  const fallbackServiceLinks = t.raw('footer.serviceLinks') as string[]
  const socials = config ? SOCIALS.filter((s) => Boolean(config.social[s.key])) : []
  const year = new Date().getFullYear()

  return (
    <footer className="footer" data-testid="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="brand">
            <img src="/applelab/icon-white.svg" alt="" />
            <span className="wordmark">{config?.site_name || 'Apple Lab'}</span>
          </div>
          {LOCALES.length > 1 ? (
            <div className="footer-lang" data-testid="footer-language">
              <span className="muted">{t('footer.language')}</span>
              {LOCALES.map((code, index) => (
                <span key={code} className="footer-lang-item">
                  {index > 0 ? <span className="sep">·</span> : null}
                  <Link
                    href="/"
                    locale={code}
                    lang={code}
                    className={code === locale ? 'active' : undefined}
                    aria-current={code === locale ? 'true' : undefined}
                  >
                    {LOCALE_LABELS[code as AppLocale]}
                  </Link>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <h4>{t('footer.services')}</h4>
            <ul>
              {families.length > 0
                ? families.map((family) => (
                    <li key={family.slug}>
                      <Link href={`/services/${family.slug}`}>{family.name}</Link>
                    </li>
                  ))
                : fallbackServiceLinks.map((label) => (
                    <li key={label}>
                      <Link href="/services">{label}</Link>
                    </li>
                  ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              {QUICK_LINKS.map((link) => (
                <li key={link.key}>
                  <Link href={link.href}>{t(`footer.quick.${link.key}`)}</Link>
                </li>
              ))}
              {PENDING_LINKS.map((key) => (
                <li key={key}>
                  <a href="#">{t(`footer.quick.${key}`)}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.contact')}</h4>
            <ul>
              {config?.phone_primary ? (
                <li><a href={telHref(config.phone_primary)}>{config.phone_primary}</a></li>
              ) : null}
              {config?.phone_secondary ? (
                <li><a href={telHref(config.phone_secondary)}>{config.phone_secondary}</a></li>
              ) : null}
              {config?.email ? (
                <li><a href={`mailto:${config.email}`}>{config.email}</a></li>
              ) : null}
              {config?.address ? (
                <li className="muted">{config.address.replace(/\n/g, ', ')}</li>
              ) : null}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.follow')}</h4>
            {socials.length > 0 ? (
              <div className="social-row">
                {socials.map((s) => (
                  <a key={s.key} href={config?.social[s.key]} target="_blank" rel="noreferrer" aria-label={s.label}>
                    <svg><use href={`#${s.icon}`} /></svg>
                  </a>
                ))}
              </div>
            ) : null}
            <ul className={socials.length > 0 ? 'mt-24' : undefined}>
              <li><a href="#">{t('footer.careers')}</a></li>
              <li><a href="#">{t('footer.press')}</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{t('footer.rights', { year })}</span>
          <div className="legal-links">
            <a href="#">{t('footer.privacy')}</a>
            <a href="#">{t('footer.terms')}</a>
            <a href="/sitemap.xml">{t('footer.sitemap')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

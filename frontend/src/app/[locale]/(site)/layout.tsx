import { getTranslations, setRequestLocale } from 'next-intl/server'

import SiteFooter from '@/components/site/SiteFooter'
import SiteNavbar from '@/components/site/SiteNavbar'
import { getServices, getSiteConfig } from '@/lib/content'

/**
 * Template site chrome (navbar + footer) for the generic public pages —
 * styleguide and funnels. The homepage sits outside this group because the
 * Apple Lab design ships its own nav and footer.
 */
export default async function SiteChromeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, tFooter, config, services] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'footer' }),
    getSiteConfig(locale),
    getServices(locale),
  ])

  const siteName = config?.site_name || 'Apple Lab'
  const navLinks = [
    { href: '/#services', label: t('services') },
    { href: '/#testimonials', label: t('testimonials') },
    { href: '/#faq', label: t('faq') },
    { href: '/#contact', label: t('contact') },
  ]

  return (
    <>
      <SiteNavbar siteName={siteName} links={navLinks} cta={{ href: '/#contact', label: t('cta') }} />
      {children}
      <SiteFooter
        config={config}
        quickLinks={navLinks.map((link) => ({ ...link }))}
        serviceLinks={services.slice(0, 6).map((service) => ({
          href: '/#services',
          label: service.name,
        }))}
        labels={{
          quickLinks: tFooter('quickLinks'),
          services: tFooter('services'),
          contact: tFooter('contact'),
          follow: tFooter('follow'),
          rights: tFooter('rights'),
        }}
      />
    </>
  )
}

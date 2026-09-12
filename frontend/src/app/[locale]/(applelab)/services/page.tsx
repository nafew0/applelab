import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import Breadcrumbs from '@/components/applelab/catalog/Breadcrumbs'
import { Link } from '@/i18n/navigation'
import { getCatalogIndex } from '@/lib/catalog'
import { breadcrumbJsonLd, catalogMetadata, JsonLd } from '@/lib/catalogSeo'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'applelab.catalog' })
  return catalogMetadata({
    locale,
    path: '/services',
    title: t('index.seoTitle'),
    description: t('index.seoDescription'),
  })
}

export default async function ServicesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab.catalog' }),
    getCatalogIndex(locale),
  ])
  const families = data?.families ?? []

  return (
    <main id="top">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { label: t('home'), path: '' },
          { label: t('services'), path: '/services' },
        ])}
      />
      <section className="section cat-hero" data-testid="services-index">
        <div className="container">
          <Breadcrumbs items={[{ href: '/', label: t('home') }, { label: t('services') }]} />
          <div className="section-head left reveal">
            <p className="eyebrow">{t('index.eyebrow')}</p>
            <h1 className="h-xl">{t('index.headline')}</h1>
            <p className="sub">{t('index.intro')}</p>
          </div>

          {families.length > 0 ? (
            <div className="cat-grid reveal stagger">
              {families.map((family) => (
                <Link key={family.slug} href={`/services/${family.slug}`} className="cat-card" data-testid="family-card">
                  <h3>{family.name}</h3>
                  {family.intro ? <p>{family.intro}</p> : null}
                  <span className="cat-count">{t('modelsCount', { count: family.model_count })} ›</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="sub">{t('empty')}</p>
          )}

          <div className="cta-band reveal">
            <div>
              <h3>{t('cta.title')}</h3>
              <p>{t('cta.body')}</p>
            </div>
            <Link href="/f/demo" className="btn btn-primary">{t('cta.button')}</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

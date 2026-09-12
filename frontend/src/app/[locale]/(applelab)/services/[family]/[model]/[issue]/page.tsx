import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import Breadcrumbs from '@/components/applelab/catalog/Breadcrumbs'
import CatalogImage from '@/components/applelab/catalog/CatalogImage'
import FaqList from '@/components/applelab/catalog/FaqList'
import { Link } from '@/i18n/navigation'
import { getOfferingPage } from '@/lib/catalog'
import { breadcrumbJsonLd, catalogMetadata, JsonLd, serviceJsonLd } from '@/lib/catalogSeo'
import { getSiteConfig } from '@/lib/content'

export const revalidate = 300

/** Empty list = no build-time pages; each path is rendered on first visit, then ISR-cached. */
export async function generateStaticParams() {
  return []
}

type Params = Promise<{ locale: string; family: string; model: string; issue: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, family, model, issue } = await params
  const data = await getOfferingPage(locale, family, model, issue)
  if (!data) return {}
  return catalogMetadata({
    locale,
    path: `/services/${family}/${model}/${issue}`,
    title: data.offering.seo.title,
    description: data.offering.seo.description,
    indexable: data.offering.indexable,
    canonicalPath: `/services/${family}/${model}`,
    image: data.model.image || data.offering.image,
  })
}

export default async function OfferingPage({ params }: { params: Params }) {
  const { locale, family, model, issue } = await params
  setRequestLocale(locale)
  const [t, data, config] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab.catalog' }),
    getOfferingPage(locale, family, model, issue),
    getSiteConfig(locale),
  ])
  if (!data) notFound()

  const path = `/services/${family}/${model}/${issue}`
  const crumbs = [
    { label: t('home'), path: '' },
    { label: t('services'), path: '/services' },
    { label: data.family.name, path: `/services/${family}` },
    { label: data.model.name, path: `/services/${family}/${model}` },
    { label: data.issue.name, path },
  ]
  const title = t('offering.headline', { model: data.model.name, issue: data.issue.name })

  return (
    <main id="top">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, crumbs),
          serviceJsonLd({
            locale, path, name: title, description: data.offering.seo.description, config,
            price: data.offering.price_from,
            image: data.model.image,
          }),
        ]}
      />
      <section className="section cat-hero" data-testid="offering-page">
        <div className="container">
          <Breadcrumbs
            items={[
              { href: '/', label: t('home') },
              { href: '/services', label: t('services') },
              { href: `/services/${family}`, label: data.family.name },
              { href: `/services/${family}/${model}`, label: data.model.name },
              { label: data.issue.name },
            ]}
          />
          <div className={`cat-hero-grid${data.model.image ? ' has-media' : ''}`}>
            <div className="section-head left reveal">
              <p className="eyebrow">{data.model.name}</p>
              <h1 className="h-xl" data-testid="offering-headline">{title}</h1>
              <p className="sub">{t('offering.intro', { issue: data.issue.name, model: data.model.name })}</p>
            </div>
            {data.model.image ? (
              <div className="cat-hero-stack">
                <CatalogImage src={data.model.image} alt={data.model.name} className="cat-hero-media" priority testId="model-image" />
                <CatalogImage src={data.offering.image} alt="" className="cat-hero-badge" testId="offering-icon" />
              </div>
            ) : null}
          </div>

          <div className="price-box reveal" data-testid="price-box">
            <div>
              <div className="label">{t('price')}</div>
              {data.offering.price_from ? (
                <div className="value brand">
                  {t('from')} {data.offering.price_from_display}
                </div>
              ) : (
                <div className="value small">{t('quoteOnly')}</div>
              )}
            </div>
            <div>
              <div className="label">{t('turnaround')}</div>
              <div className="value small">
                {data.offering.turnaround_hours ? t('hours', { count: data.offering.turnaround_hours }) : t('sameDay')}
              </div>
            </div>
            <div>
              <div className="label">{t('warrantyLabel')}</div>
              <div className="value small">{t('warranty', { count: data.offering.warranty_days })}</div>
            </div>
            <div>
              <div className="label">{t('diagnosis')}</div>
              <div className="value small">{t('diagnosisFree')}</div>
            </div>
          </div>
          {data.offering.price_options.length > 0 ? (
            <ul className="part-options reveal" data-testid="part-options">
              {data.offering.price_options.map((option, index) => (
                <li key={`${option.label}-${index}`}>
                  <span>{option.label}</span>
                  <strong>৳ {Number(option.price).toLocaleString('en-US')}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="btn-row left mt-32 reveal">
            <Link href="/f/demo" className="btn btn-primary" data-testid="offering-book">{t('offering.book')}</Link>
            <Link href={`/services/${family}/${model}`} className="btn btn-secondary">{t('offering.backToModel')}</Link>
          </div>
        </div>
      </section>

      <section className="section gray">
        <div className="container">
          <div className="prose reveal" data-testid="offering-content" dangerouslySetInnerHTML={{ __html: data.offering.content_html }} />
          <FaqList items={data.offering.faq} heading={t('faq')} />
        </div>
      </section>

      {data.siblings.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head left reveal">
              <p className="eyebrow">{data.model.name}</p>
              <h2 className="h-lg">{t('offering.otherRepairs')}</h2>
            </div>
            <div className="issue-chips reveal" data-testid="sibling-repairs">
              {data.siblings.map((sibling) => (
                <Link key={sibling.slug} href={`/services/${family}/${model}/${sibling.slug}`}>{sibling.name}</Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

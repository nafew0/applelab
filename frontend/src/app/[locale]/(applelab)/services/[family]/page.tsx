import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import Breadcrumbs from '@/components/applelab/catalog/Breadcrumbs'
import CatalogImage from '@/components/applelab/catalog/CatalogImage'
import FaqList from '@/components/applelab/catalog/FaqList'
import ModelBrowser from '@/components/applelab/catalog/ModelBrowser'
import { Link } from '@/i18n/navigation'
import { getFamilyPage } from '@/lib/catalog'
import { breadcrumbJsonLd, catalogMetadata, JsonLd, serviceJsonLd } from '@/lib/catalogSeo'
import { getSiteConfig } from '@/lib/content'

export const revalidate = 300

/** Empty list = no build-time pages; each path is rendered on first visit, then ISR-cached. */
export async function generateStaticParams() {
  return []
}

type Params = Promise<{ locale: string; family: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, family } = await params
  const data = await getFamilyPage(locale, family)
  if (!data) return {}
  return catalogMetadata({
    locale,
    path: `/services/${family}`,
    title: data.family.seo.title,
    description: data.family.seo.description,
    image: data.family.image,
  })
}

export default async function FamilyPage({ params }: { params: Params }) {
  const { locale, family } = await params
  setRequestLocale(locale)
  const [t, data, config] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab.catalog' }),
    getFamilyPage(locale, family),
    getSiteConfig(locale),
  ])
  if (!data) notFound()

  const crumbs = [
    { label: t('home'), path: '' },
    { label: t('services'), path: '/services' },
    { label: data.family.name, path: `/services/${family}` },
  ]

  return (
    <main id="top" className="cat-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, crumbs),
          serviceJsonLd({
            locale,
            path: `/services/${family}`,
            name: data.family.seo.title.split(' | ')[0],
            description: data.family.seo.description,
            config,
            image: data.family.image,
          }),
        ]}
      />
      <section className="section cat-hero" data-testid="family-page">
        <div className="container">
          <Breadcrumbs
            items={[{ href: '/', label: t('home') }, { href: '/services', label: t('services') }, { label: data.family.name }]}
          />
          <div className={`cat-hero-grid${data.family.image ? ' has-media' : ''}`}>
            <div className="section-head left reveal">
              <p className="eyebrow">{t('family.eyebrow')}</p>
              <h1 className="h-xl" data-testid="family-headline">{t('family.headline', { family: data.family.name })}</h1>
              {data.family.intro ? <p className="sub">{data.family.intro}</p> : null}
            </div>
            <CatalogImage src={data.family.image} alt={data.family.name} className="cat-hero-media family" priority testId="family-image" />
          </div>

          {data.issues.length > 0 ? (
            <div className="reveal">
              <p className="eyebrow">{t('family.commonRepairs')}</p>
              <div className="issue-chips" data-testid="family-issues">
                {data.issues.map((issue) => (
                  <span key={issue.slug}>{issue.name}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section gray" id="models">
        <div className="container">
          <div className="section-head left reveal">
            <p className="eyebrow">{t('family.chooseModel')}</p>
            <h2 className="h-lg">{t('family.allModels', { family: data.family.name, count: data.models.length })}</h2>
          </div>
          <ModelBrowser
            models={data.models}
            years={data.years}
            labels={{
              all: t('family.allYears'),
              filter: t('family.filterByYear'),
              showing: t.raw('family.showing') as string,
              empty: t('family.noModels'),
            }}
          />
          <p className="sub mt-32">
            {t('notListed')}{' '}
            <Link href="/f/demo" className="link">{t('notListedCta')}</Link>
          </p>
        </div>
      </section>

      {data.family.content_html || data.family.faq.length ? (
        <section className="section">
          <div className="container">
            {data.family.content_html ? (
              <div className="prose reveal" dangerouslySetInnerHTML={{ __html: data.family.content_html }} />
            ) : null}
            <FaqList items={data.family.faq} heading={t('faq')} />
            <div className="cta-band reveal">
              <div>
                <h3>{t('cta.title')}</h3>
                <p>{t('cta.body')}</p>
              </div>
              <Link href="/f/demo" className="btn btn-primary">{t('cta.button')}</Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

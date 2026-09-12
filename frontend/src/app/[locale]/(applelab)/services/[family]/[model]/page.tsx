import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import Breadcrumbs from '@/components/applelab/catalog/Breadcrumbs'
import FaqList from '@/components/applelab/catalog/FaqList'
import ModelCard from '@/components/applelab/catalog/ModelCard'
import OfferingCard from '@/components/applelab/catalog/OfferingCard'
import { Link } from '@/i18n/navigation'
import { getModelPage, modelFacts } from '@/lib/catalog'
import { breadcrumbJsonLd, catalogMetadata, JsonLd, serviceJsonLd } from '@/lib/catalogSeo'
import { getSiteConfig } from '@/lib/content'

export const revalidate = 300

/** Empty list = no build-time pages; each path is rendered on first visit, then ISR-cached. */
export async function generateStaticParams() {
  return []
}

type Params = Promise<{ locale: string; family: string; model: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, family, model } = await params
  const data = await getModelPage(locale, family, model)
  if (!data) return {}
  return catalogMetadata({
    locale,
    path: `/services/${family}/${model}`,
    title: data.model.seo.title,
    description: data.model.seo.description,
  })
}

export default async function ModelPage({ params }: { params: Params }) {
  const { locale, family, model } = await params
  setRequestLocale(locale)
  const [t, data, config] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab.catalog' }),
    getModelPage(locale, family, model),
    getSiteConfig(locale),
  ])
  if (!data) notFound()

  const facts = modelFacts(data.model)
  const path = `/services/${family}/${model}`
  const crumbs = [
    { label: t('home'), path: '' },
    { label: t('services'), path: '/services' },
    { label: data.family.name, path: `/services/${family}` },
    { label: data.model.name, path },
  ]
  const offeringLabels = {
    from: t('from'),
    quote: t('quoteOnly'),
    sameDay: t('sameDay'),
    hours: (n: number) => t('hours', { count: n }),
    warranty: (n: number) => t('warranty', { count: n }),
  }

  return (
    <main id="top">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, crumbs),
          serviceJsonLd({
            locale, path, name: data.model.seo.title.split(' | ')[0],
            description: data.model.seo.description, config,
          }),
        ]}
      />
      <section className="section cat-hero" data-testid="model-page">
        <div className="container">
          <Breadcrumbs
            items={[
              { href: '/', label: t('home') },
              { href: '/services', label: t('services') },
              { href: `/services/${family}`, label: data.family.name },
              { label: data.model.name },
            ]}
          />
          <div className="section-head left reveal">
            <p className="eyebrow">{data.family.name}</p>
            <h1 className="h-xl" data-testid="model-headline">{t('model.headline', { model: data.model.name })}</h1>
            <p className="sub">{t('model.intro', { model: data.model.name })}</p>
            {facts.length || data.model.line ? (
              <div className="facts" data-testid="model-facts">
                {facts.map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
                {data.model.size_label ? <span className="facts-line">{data.model.size_label}</span> : null}
                {data.model.line && data.model.line !== 'standard' ? <span className="facts-line">{data.model.line}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section gray" id="repairs">
        <div className="container">
          <div className="section-head left reveal">
            <p className="eyebrow">{t('model.repairsEyebrow')}</p>
            <h2 className="h-lg">{t('model.repairsHeadline', { count: data.offerings.length })}</h2>
            <p className="sub">{t('model.pricingNote')}</p>
          </div>
          {data.offerings.length > 0 ? (
            <div className="offer-grid reveal stagger" data-testid="model-offerings">
              {data.offerings.map((offering) => (
                <OfferingCard key={offering.issue.slug} offering={offering} family={family} model={model} labels={offeringLabels} />
              ))}
            </div>
          ) : (
            <p className="sub">{t('model.noRepairs')}</p>
          )}
          <div className="btn-row left mt-32 reveal">
            <Link href="/f/demo" className="btn btn-primary" data-testid="model-book">{t('model.book')}</Link>
            <Link href={`/services/${family}`} className="btn btn-secondary">{t('model.backToFamily', { family: data.family.name })}</Link>
          </div>
        </div>
      </section>

      {data.model.notes_html || data.model.content_html || data.model.faq.length ? (
        <section className="section">
          <div className="container">
            {data.model.notes_html ? (
              <div className="reveal">
                <h2 className="h-lg">{t('model.knownFaults', { model: data.model.name })}</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.model.notes_html }} />
              </div>
            ) : null}
            {data.model.content_html ? (
              <div className="prose reveal" dangerouslySetInnerHTML={{ __html: data.model.content_html }} />
            ) : null}
            <FaqList items={data.model.faq} heading={t('faq')} />
          </div>
        </section>
      ) : null}

      {data.related.length > 0 ? (
        <section className="section gray">
          <div className="container">
            <div className="section-head left reveal">
              <p className="eyebrow">{data.family.name}</p>
              <h2 className="h-lg">{t('model.related')}</h2>
            </div>
            <div className="model-grid reveal stagger" data-testid="related-models">
              {data.related.map((related) => (
                <ModelCard key={related.slug} model={related} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

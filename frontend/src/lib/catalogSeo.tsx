import type { Metadata } from 'next'

import { getBaseUrl, localeAlternates } from '@/lib/seo'
import type { SiteConfigData } from '@/lib/content'

/** Page metadata for a catalog page; noindex pages canonicalize to `canonicalPath`. */
export function catalogMetadata({
  locale,
  path,
  title,
  description,
  indexable = true,
  canonicalPath,
}: {
  locale: string
  path: string
  title: string
  description: string
  indexable?: boolean
  canonicalPath?: string
}): Metadata {
  const base = getBaseUrl()
  const alternates = localeAlternates(locale, path)
  if (!indexable && canonicalPath) {
    alternates!.canonical = `${base}/${locale}${canonicalPath}`
  }
  return {
    title,
    description,
    alternates,
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: 'website', url: `${base}/${locale}${path}` },
  }
}

export function breadcrumbJsonLd(locale: string, crumbs: { label: string; path: string }[]) {
  const base = getBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${base}/${locale}${c.path}`,
    })),
  }
}

export function serviceJsonLd({
  locale,
  path,
  name,
  description,
  config,
  price,
}: {
  locale: string
  path: string
  name: string
  description: string
  config: SiteConfigData | null
  price?: string | null
}) {
  const base = getBaseUrl()
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType: name,
    url: `${base}/${locale}${path}`,
    areaServed: [{ '@type': 'City', name: 'Dhaka' }, { '@type': 'Country', name: 'Bangladesh' }],
    provider: {
      '@type': 'LocalBusiness',
      name: config?.site_name || 'Apple Lab',
      telephone: config?.phone_primary || undefined,
      address: config?.address || undefined,
    },
  }
  if (price) {
    jsonLd.offers = {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price,
      availability: 'https://schema.org/InStock',
      url: `${base}/${locale}${path}`,
    }
  }
  return jsonLd
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

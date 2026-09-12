import type { MetadataRoute } from 'next'

import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config'
import { getCatalogSitemap } from '@/lib/catalog'
import { getBaseUrl } from '@/lib/seo'

/**
 * Public-site sitemap: static public paths + the device catalog (families,
 * models, and only the INDEXABLE model×issue pages), every locale variant.
 */
const STATIC_PATHS = ['', '/services']

function entry(base: string, path: string, lastModified: Date, priority: number): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${base}/${locale}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((code) => [code, `${base}/${code}${path}`])),
    },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const now = new Date()
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    entry(base, path, now, path === '' ? 1 : 0.9)
  )
  const catalog = await getCatalogSitemap()
  if (catalog) {
    for (const family of catalog.families) {
      entries.push(...entry(base, `/services/${family.slug}`, new Date(family.updated_at), 0.8))
    }
    for (const model of catalog.models) {
      entries.push(...entry(base, `/services/${model.family}/${model.slug}`, new Date(model.updated_at), 0.7))
    }
    for (const offering of catalog.offerings) {
      entries.push(
        ...entry(base, `/services/${offering.family}/${offering.model}/${offering.issue}`, new Date(offering.updated_at), 0.6)
      )
    }
  }
  return entries.sort((a, b) => (a.url.includes(`/${DEFAULT_LOCALE}`) ? -1 : a.url.localeCompare(b.url)))
}

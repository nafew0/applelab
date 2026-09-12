/**
 * Server-side fetchers for the device catalog page-data API.
 *
 * These endpoints are deliberately NOT proxied to the browser (next.config.ts
 * allowlist) and Django requires the server-only X-Catalog-Key on them:
 * Server Components call Django directly via BACKEND_URL. Every fetcher fails soft (null) so
 * builds succeed without a backend, and is tagged for on-demand ISR
 * revalidation triggered by the Django admin (app/revalidate/route.ts).
 */

export interface FamilyBrief {
  slug: string
  name: string
  kind: string
  icon: string
  hero_image: string
  model_count: number
  intro: string
}

export interface FaqItem {
  question: string
  answer_html: string
}

export interface SeoMeta {
  title: string
  description: string
}

export interface ModelBrief {
  slug: string
  family: string
  name: string
  line: string
  size_label: string
  chip: string
  generation: string
  release_year: number | null
  release_label: string
  model_numbers: string[]
  image: string
  is_featured: boolean
}

export interface IssueBrief {
  slug: string
  name: string
  category: string
  icon: string
}

export interface OfferingCard {
  issue: IssueBrief
  price_from: string | null
  price_from_display: string
  price_options: { label: string; price: string | number; warranty_days?: number }[]
  turnaround_hours: number | null
  warranty_days: number
  is_indexable: boolean
}

export interface CatalogIndexData {
  families: FamilyBrief[]
}

export interface FamilyPageData {
  family: FamilyBrief & { content_html: string; faq: FaqItem[]; seo: SeoMeta }
  models: ModelBrief[]
  issues: IssueBrief[]
  years: number[]
  lines: string[]
}

export interface ModelPageData {
  family: FamilyBrief
  model: ModelBrief & { notes_html: string; content_html: string; faq: FaqItem[]; seo: SeoMeta }
  offerings: OfferingCard[]
  related: ModelBrief[]
}

export interface OfferingPageData {
  family: FamilyBrief
  model: ModelBrief
  issue: IssueBrief
  offering: OfferingCard & {
    content_html: string
    content_is_template: boolean
    faq: FaqItem[]
    seo: SeoMeta
    indexable: boolean
  }
  siblings: IssueBrief[]
}

export interface CatalogSitemapData {
  families: { slug: string; updated_at: string }[]
  models: { family: string; slug: string; updated_at: string }[]
  offerings: { family: string; model: string; issue: string; updated_at: string }[]
}

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')
const REVALIDATE_SECONDS = 300

async function fetchCatalog<T>(path: string, lang: string, tags: string[]): Promise<T | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/catalog/pages/${path}?lang=${lang}`, {
      headers: { 'X-Catalog-Key': process.env.CATALOG_PAGES_SECRET ?? '' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['catalog', ...tags] },
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export const getCatalogIndex = (lang: string) =>
  fetchCatalog<CatalogIndexData>('index/', lang, [])

export const getFamilyPage = (lang: string, family: string) =>
  fetchCatalog<FamilyPageData>(`family/${family}/`, lang, [`family:${family}`])

export const getModelPage = (lang: string, family: string, model: string) =>
  fetchCatalog<ModelPageData>(`model/${family}/${model}/`, lang, [
    `family:${family}`,
    `model:${family}/${model}`,
  ])

export const getOfferingPage = (lang: string, family: string, model: string, issue: string) =>
  fetchCatalog<OfferingPageData>(`offering/${family}/${model}/${issue}/`, lang, [
    `family:${family}`,
    `model:${family}/${model}`,
  ])

export const getCatalogSitemap = () =>
  fetchCatalog<CatalogSitemapData>('sitemap/', 'en', [])

/** Human label for a model's facts line: "M3 · 2024 · A3113". */
export function modelFacts(model: ModelBrief): string[] {
  const facts: string[] = []
  if (model.chip) facts.push(model.chip)
  if (model.release_label) facts.push(model.release_label)
  else if (model.release_year) facts.push(String(model.release_year))
  if (model.model_numbers?.length) facts.push(model.model_numbers.join(' / '))
  return facts
}

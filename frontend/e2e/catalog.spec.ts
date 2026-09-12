import { test, expect, type Page } from '@playwright/test'
import { loginAsAdmin } from './helpers'
import { SITE } from './site.config'

/**
 * Device catalog: /services → family → model → model×issue, homepage links,
 * Bengali, SEO signals, and the admin → public-page update loop.
 * Needs `manage.py seed_catalog` (CI e2e job runs it after seed_applelab).
 */
const C = SITE.catalog

test.describe('Device catalog — public pages', () => {
  test('services index lists every family and links to it', async ({ page }) => {
    await page.goto('/en/services')
    await expect(page.getByTestId('services-index')).toBeVisible()
    await expect(page.getByTestId('family-card')).toHaveCount(C.familyCount)
    await page
      .getByTestId('family-card')
      .filter({ has: page.getByRole('heading', { name: C.family.name, exact: true }) })
      .click()
    await expect(page).toHaveURL(new RegExp(`/en/services/${C.family.slug}$`))
    await expect(page.getByTestId('family-headline')).toContainText(C.family.name)
  })

  test('family page groups models by year and links to a model', async ({ page }) => {
    await page.goto(`/en/services/${C.family.slug}`)
    await expect(page.getByTestId('year-nav')).toBeVisible()
    await expect(page.getByTestId('family-issues')).toBeVisible()
    expect(await page.getByTestId('model-card').count()).toBeGreaterThanOrEqual(C.family.minModels)
    await page
      .getByTestId('model-card')
      .filter({ has: page.getByRole('heading', { name: C.model.name, exact: true }) })
      .click()
    await expect(page).toHaveURL(new RegExp(`/en/services/${C.family.slug}/${C.model.slug}$`))
  })

  test('model page shows facts, repairs, breadcrumbs and JSON-LD', async ({ page }) => {
    await page.goto(`/en/services/${C.family.slug}/${C.model.slug}`)
    await expect(page.getByTestId('model-headline')).toContainText(C.model.name)
    await expect(page.getByTestId('model-facts')).toContainText(C.model.chip)
    await expect(page.getByTestId('breadcrumbs')).toContainText(C.family.name)
    expect(await page.getByTestId('offering-card').count()).toBeGreaterThan(3)
    await expect(page.getByTestId('related-models')).toBeVisible()
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(jsonLd.join('\n')).toContain('"BreadcrumbList"')
    expect(jsonLd.join('\n')).toContain('"Service"')
    // Competitor reference prices are internal-only and never reach the page.
    expect(await page.content()).not.toContain('reference_price')
  })

  test('repair leaf page renders content and is noindex until reviewed', async ({ page }) => {
    await page.goto(`/en/services/${C.family.slug}/${C.model.slug}/${C.issue.slug}`)
    await expect(page.getByTestId('offering-headline')).toContainText(C.issue.name)
    await expect(page.getByTestId('price-box')).toBeVisible()
    await expect(page.getByTestId('offering-content')).toContainText(C.model.name)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/en/services/${C.family.slug}/${C.model.slug}$`)
    )
    await page.getByTestId('breadcrumbs').getByRole('link', { name: C.model.name }).click()
    await expect(page).toHaveURL(new RegExp(`/en/services/${C.family.slug}/${C.model.slug}$`))
  })

  test('unknown model or issue returns 404', async ({ page }) => {
    const res = await page.goto(`/en/services/${C.family.slug}/not-a-real-model`)
    expect(res?.status()).toBe(404)
    const leaf = await page.goto(`/en/services/${C.family.slug}/${C.model.slug}/not-a-repair`)
    expect(leaf?.status()).toBe(404)
  })

  test('catalog pages render in Bengali', async ({ page }) => {
    await page.goto(`/bn/services/${C.family.slug}`)
    await expect(page.getByTestId('family-headline')).toContainText(C.family.nameBn)
    await expect(page.getByTestId('locale-frame')).toHaveAttribute('lang', 'bn')
  })

  test('homepage device cards, nav and footer link into the catalog', async ({ page }) => {
    await page.goto('/en')
    await page.getByTestId(`device-card-link-${C.family.slug}`).click()
    await expect(page).toHaveURL(new RegExp(`/en/services/${C.family.slug}$`))

    await page.goto('/en')
    await page.getByTestId('site-navbar').getByRole('link', { name: 'Services', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/services$/)

    await expect(page.getByTestId('site-footer').getByRole('link', { name: C.family.name, exact: true })).toHaveAttribute(
      'href',
      new RegExp(`/en/services/${C.family.slug}$`)
    )
  })

  test('sitemap lists catalog families and models', async ({ page }) => {
    const res = await page.goto('/sitemap.xml')
    const xml = (await res?.text()) ?? ''
    expect(xml).toContain(`/en/services/${C.family.slug}</loc>`)
    expect(xml).toContain(`/en/services/${C.family.slug}/${C.model.slug}</loc>`)
  })

  test('no bulk catalog endpoint is exposed to browsers', async ({ page }) => {
    const pages = await page.request.get('/api/catalog/pages/sitemap/')
    expect(pages.status()).toBe(404)
    const models = await page.request.get('/api/catalog/models/')
    expect(models.status()).toBe(400)
    // Straight at Django too (production nginx forwards /api/ there): no key, no data.
    const backend = process.env.BACKEND_URL ?? 'http://localhost:8000'
    const direct = await page.request.get(`${backend}/api/catalog/pages/sitemap/`)
    expect(direct.status()).toBe(404)
  })
})

async function openModelInAdmin(page: Page): Promise<string> {
  await loginAsAdmin(page)
  await page.goto(`/admin/catalog/families/${C.family.slug}`)
  await page.getByTestId('models-search').fill(C.model.searchTerm)
  await page.getByTestId('models-search').press('Enter')
  await page
    .locator('[data-testid^="model-row-"]')
    .filter({ has: page.getByText(C.model.slug, { exact: true }) })
    .click()
  await expect(page.getByTestId('model-heading')).toContainText(C.model.name)
  return page.url()
}

async function setOfferingPrice(page: Page, price: string) {
  const row = page.locator('[data-testid^="offering-row-"]').filter({ hasText: C.issue.adminName }).first()
  await row.locator('[data-testid^="offering-edit-"]').click()
  await page.getByTestId('offering-price-from').fill(price)
  await page.getByTestId('offering-save').click()
  await expect(page.getByTestId('offering-form')).toBeHidden()
}

test.describe('Device catalog — admin', () => {
  test('catalog screens load and the matrix starts clean', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/catalog')
    await expect(page.getByTestId(`family-row-${C.family.slug}`)).toBeVisible()
    await page.goto(`/admin/catalog/families/${C.family.slug}?tab=matrix`)
    await expect(page.getByTestId('catalog-matrix')).toBeVisible()
    await expect(page.getByTestId('matrix-save')).toBeDisabled()
  })

  test('owner price edit appears on the public repair page', async ({ page, browser }) => {
    const leaf = `/en/services/${C.family.slug}/${C.model.slug}/${C.issue.slug}`
    const adminModelUrl = await openModelInAdmin(page)
    await setOfferingPrice(page, C.testPrice)
    // An anonymous visitor, as the public sees it (separate cookies from the admin).
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    try {
      await expect
        .poll(
          async () => {
            await publicPage.goto(leaf)
            return (await publicPage.getByTestId('price-box').textContent()) ?? ''
          },
          { timeout: 15_000, intervals: [500, 1000, 2000] }
        )
        .toContain(C.testPriceDisplay)
    } finally {
      await visitor.close()
      await page.goto(adminModelUrl)
      await setOfferingPrice(page, '')
    }
  })
})

import { test, expect } from '@playwright/test'
import { SITE } from './site.config'

test.describe('Apple Lab homepage (design port on template standards)', () => {
  test('renders hero, nav and all sections in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByTestId('hero-headline')).toContainText(SITE.heroHeadline.en)
    await expect(page.getByTestId('site-navbar')).toBeVisible()
    await expect(page.getByTestId('navbar-cta')).toBeVisible()

    await expect(page.getByTestId('device-card')).toHaveCount(9)
    await expect(page.getByTestId('repair-tracker')).toBeVisible()
    await expect(page.getByTestId('testimonials-section')).toBeVisible()
    await expect(page.getByTestId('contact-section')).toBeVisible()
  })

  test('copy switches to Bengali via the nav language button', async ({ page }) => {
    await page.goto('/en')
    await page.getByTestId('navbar-desktop-actions').getByTestId('language-option-bn').click()
    await expect(page).toHaveURL(/\/bn$/)
    await expect(page.getByTestId('hero-headline')).toContainText(SITE.heroHeadline.bn)
    await expect(page.getByTestId('locale-frame')).toHaveAttribute('lang', 'bn')
  })

  test('contact details come from SiteConfig (NAP single source of truth)', async ({ page }) => {
    await page.goto('/en')
    const info = page.getByTestId('contact-info')
    await expect(info).toContainText(SITE.contact.phonePrimary)
    await expect(page.getByTestId('whatsapp-link')).toHaveAttribute(
      'href',
      new RegExp(`wa\\.me/${SITE.contact.whatsappDigits}`)
    )
    await expect(page.getByTestId('map-iframe')).toHaveCount(1)
  })

  test('footer shows brand, year and language links', async ({ page }) => {
    await page.goto('/en')
    const footer = page.getByTestId('site-footer')
    await expect(footer).toContainText(SITE.contact.brand)
    await expect(footer).toContainText(String(new Date().getFullYear()))
    await expect(page.getByTestId('footer-language')).toBeVisible()
  })

  test('sitemap and robots respond', async ({ page }) => {
    const sitemap = await page.goto('/sitemap.xml')
    expect(sitemap?.status()).toBe(200)
    expect(await sitemap?.text()).toContain('/en')
    const robots = await page.goto('/robots.txt')
    expect(robots?.status()).toBe(200)
    expect(await robots?.text()).toContain('Disallow: /admin')
  })
})

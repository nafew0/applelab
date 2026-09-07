import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import AttributionTracker from '@/components/site/AttributionTracker'
import LocaleFrame from '@/components/site/LocaleFrame'
import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/config'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Providers shared by every public page. Site chrome (navbar/footer) lives in
 * the (site) group instead, so the Apple Lab homepage can render its own
 * bespoke nav and footer without doubling up.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleFrame locale={locale as AppLocale}>
        <AttributionTracker />
        {children}
      </LocaleFrame>
    </NextIntlClientProvider>
  )
}

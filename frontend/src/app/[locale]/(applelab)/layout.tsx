import { setRequestLocale } from 'next-intl/server'

import ChatWidget from '@/components/applelab/ChatWidget'
import HomeEffects from '@/components/applelab/HomeEffects'
import HomeFooter from '@/components/applelab/HomeFooter'
import HomeNav from '@/components/applelab/HomeNav'
import IconSprite from '@/components/applelab/IconSprite'

import './applelab-home.css'
import './applelab-catalog.css'

/**
 * Apple Lab chrome (design port): nav, footer, icon sprite, scroll effects and
 * the chat widget for the homepage and the /services catalog pages.
 * Template chrome (SiteNavbar/SiteFooter) is kept for the (site) group.
 */
export default async function AppleLabLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <IconSprite />
      <HomeEffects />
      <HomeNav />
      {children}
      <HomeFooter locale={locale} />
      <ChatWidget />
    </>
  )
}

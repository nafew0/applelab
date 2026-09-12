import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import ChatWidget from '@/components/applelab/ChatWidget'
import HomeEffects from '@/components/applelab/HomeEffects'
import HomeNav from '@/components/applelab/HomeNav'
import IconSprite from '@/components/applelab/IconSprite'
import RepairTracker from '@/components/applelab/RepairTracker'
import ScrollFilm from '@/components/applelab/ScrollFilm'
import { LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { getSiteConfig, whatsappLink } from '@/lib/content'
import { buildSiteMetadata, localBusinessJsonLd } from '@/lib/seo'

import './applelab-home.css'

export const revalidate = 60

/** Page title/description come from SiteConfig.meta (seeded by seed_applelab). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const config = await getSiteConfig(locale)
  return buildSiteMetadata(config, locale, 'Apple Lab')
}

/* ---------------------------------------------------------------------------
 * Presentation data: images, icons, layout classes and anchors live in code;
 * every human-readable string lives in messages/<locale>.json under `applelab`.
 * ------------------------------------------------------------------------- */

const DEVICE_CARDS = [
  { key: 'macbook-pro', img: '/applelab/device-macbook-pro.jpg', className: 'promo-card sky wide' },
  { key: 'macbook-air', img: '/applelab/device-macbook-air.jpg', className: 'promo-card' },
  { key: 'iphone', img: '/applelab/device-iphone.jpg', className: 'promo-card sky' },
  { key: 'ipad', img: '/applelab/device-ipad.jpg', className: 'promo-card sky' },
  { key: 'imac', img: '/applelab/device-imac.jpg', className: 'promo-card' },
  { key: 'mac-mini', img: '/applelab/device-mac-mini.jpg', className: 'promo-card' },
  { key: 'apple-watch', img: '/applelab/device-apple-watch.jpg', className: 'promo-card sky' },
  { key: 'airpods', img: '/applelab/device-airpods.jpg', className: 'promo-card' },
  { key: 'accessories', img: '/applelab/device-accessories.jpg', className: 'promo-card' },
] as const

const FEATURE_ICONS = {
  certified: 'i-badge',
  genuine: 'i-sparkle',
  warranty: 'i-shield',
  noFee: 'i-receipt',
  sameDay: 'i-bolt',
  courier: 'i-truck',
} as const

const STEP_KEYS = ['1', '2', '3', '4'] as const

const BLOG_IMAGES = ['/applelab/hero-11.jpg', '/applelab/hero-08.jpg', '/applelab/hero-14.jpg'] as const

const QUICK_LINKS = [
  { key: 'book', href: '#booking' },
  { key: 'track', href: '#tracker' },
  { key: 'quote', href: '#quote' },
  { key: 'corporate', href: '#corporate' },
  { key: 'sell', href: '#' },
  { key: 'faq', href: '#' },
  { key: 'warranty', href: '#' },
] as const

const SOCIALS = [
  { key: 'facebook', icon: 'i-fb', label: 'Facebook' },
  { key: 'instagram', icon: 'i-ig', label: 'Instagram' },
  { key: 'youtube', icon: 'i-yt', label: 'YouTube' },
  { key: 'linkedin', icon: 'i-in', label: 'LinkedIn' },
] as const

interface RepairItem { cat: string; name: string; price: string }
interface TestimonialItem { quote: string; name: string; place: string; device: string }
interface PostItem { cat: string; title: string; excerpt: string; author: string; read: string; date: string; alt: string }

/** `tel:` href from a display number like "01603-710044" (BD → +880). */
function telHref(display: string): string {
  const digits = display.replace(/\D/g, '')
  return `tel:+${digits.startsWith('0') ? `88${digits}` : digits}`
}

/**
 * Apple Lab homepage — 1:1 port of Design/Apple Lab Homepage.html.
 * Copy: messages/*.json (`applelab`). Theme: src/theme/tokens.css.
 * NAP/hours/WhatsApp/map: SiteConfig (backend `seed_applelab`).
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, config] = await Promise.all([
    getTranslations({ locale, namespace: 'applelab' }),
    getSiteConfig(locale),
  ])

  const repairs = t.raw('repairs.items') as RepairItem[]
  const testimonials = t.raw('testimonials.items') as TestimonialItem[]
  const posts = t.raw('blog.items') as PostItem[]
  const serviceLinks = t.raw('footer.serviceLinks') as string[]

  const whatsapp = config ? whatsappLink(config.whatsapp_number) : null
  const directions = config?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address.replace(/\n/g, ', '))}`
    : null
  const socials = config
    ? SOCIALS.filter((s) => Boolean(config.social[s.key]))
    : []
  const year = new Date().getFullYear()

  return (
    <>
      {config ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(config, locale)) }}
        />
      ) : null}

      <IconSprite />
      <HomeEffects />
      <HomeNav />

      <main id="top">
        <ScrollFilm />

        {/* ================= HERO ================= */}
        <section className="hero">
          <div className="hero-bg-glow" />
          <div className="container-wide">
            <p className="hero-eyebrow reveal">
              {config?.tagline || t('hero.eyebrow')}
              <span className="dot" />
              {t('hero.since')}
            </p>
            <h1 className="h-hero reveal" data-testid="hero-headline">
              {t('hero.headline')}
              <br />
              <span className="gradient-text">{t('hero.headlineAccent')}</span>
            </h1>
            <p className="sub reveal">
              {t('hero.sub1')}
              <br />
              {t('hero.sub2')}
            </p>
            <div className="btn-row hero-cta reveal">
              <a href="#booking" className="btn btn-primary" data-testid="hero-cta-primary">
                {t('hero.book')}
              </a>
              <a href="#quote" className="btn btn-secondary">
                {t('hero.quote')}
              </a>
            </div>
            <div className="hero-walkin reveal">
              <a href="#contact" className="link">
                {t('hero.walkin')}
              </a>
            </div>
          </div>

          <div className="hero-showcase reveal">
            <img
              className="hero-showcase-media"
              src="/applelab/hero-showcase.jpg"
              alt={t('hero.showcaseAlt')}
              fetchPriority="high"
            />
          </div>

          <div className="trust-bar reveal stagger">
            <div className="trust-item">
              <div className="num">
                <span data-count="15" data-suffix="+">{t('trust.years')}</span>
              </div>
              <div className="lbl">{t('trust.yearsLabel')}</div>
            </div>
            <div className="trust-item">
              <div className="num">
                <span data-count="10000" data-suffix="+">{t('trust.devices')}</span>
              </div>
              <div className="lbl">{t('trust.devicesLabel')}</div>
            </div>
            <div className="trust-item">
              <div className="num">{t('trust.warranty')}</div>
              <div className="lbl">{t('trust.warrantyLabel')}</div>
            </div>
            <div className="trust-item">
              <div className="num">{t('trust.noFix')}</div>
              <div className="lbl">{t('trust.noFixLabel')}</div>
            </div>
          </div>
        </section>

        {/* ================= DEVICE GRID ================= */}
        <section className="section gray" id="services" data-testid="devices-section">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">{t('devices.eyebrow')}</p>
              <h2 className="h-xl">
                {t('devices.headline')}
                <br />
                <span className="gradient-text">{t('devices.headlineAccent')}</span>
              </h2>
              <p className="sub">{t('devices.sub')}</p>
            </div>

            <div className="promo-grid reveal stagger">
              {DEVICE_CARDS.map((card) => (
                <div className={card.className} key={card.key} data-testid="device-card">
                  <h3>{t(`devices.items.${card.key}.title`)}</h3>
                  <p className="promo-sub">{t(`devices.items.${card.key}.sub`)}</p>
                  <div className="promo-actions">
                    <a href="#booking" className="btn btn-primary btn-sm">
                      {t('devices.book')}
                    </a>
                    <a href="#quote" className="btn btn-secondary btn-sm">
                      {t('devices.pricing')}
                    </a>
                  </div>
                  <div className="promo-media">
                    <img src={card.img} alt={t(`devices.items.${card.key}.alt`)} loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= WHY APPLE LAB ================= */}
        <section className="section">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">{t('why.eyebrow')}</p>
              <h2 className="h-xl">
                {t('why.headline1')}
                <br />
                {t('why.headline2')}
              </h2>
            </div>
            <div className="feature-grid reveal stagger">
              {(Object.keys(FEATURE_ICONS) as Array<keyof typeof FEATURE_ICONS>).map((key) => (
                <article className="feature-card" key={key}>
                  <div className="icon-wrap">
                    <svg>
                      <use href={`#${FEATURE_ICONS[key]}`} />
                    </svg>
                  </div>
                  <h3>{t(`why.items.${key}.title`)}</h3>
                  <p>{t(`why.items.${key}.body`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS (DARK) ================= */}
        <section className="section dark" id="how">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">{t('steps.eyebrow')}</p>
              <h2 className="h-xl on-dark">
                {t('steps.headline1')}
                <br />
                {t('steps.headline2')}
              </h2>
              <p className="sub bright">{t('steps.sub')}</p>
            </div>

            <div className="steps reveal stagger">
              {STEP_KEYS.map((key, index) => (
                <div className="step" key={key}>
                  <div className="step-num">{String(index + 1).padStart(2, '0')}</div>
                  <h3>{t(`steps.items.${key}.title`)}</h3>
                  <p>{t(`steps.items.${key}.body`)}</p>
                </div>
              ))}
            </div>

            <div className="steps-cta reveal">
              <a href="#booking" className="btn btn-ghost-dark">
                {t('steps.cta')}{' '}
                <svg className="btn-icon">
                  <use href="#i-arrow" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ================= COMMON REPAIRS ================= */}
        <section className="section gray" id="quote">
          <div className="container">
            <div className="section-head reveal mb-48">
              <p className="eyebrow">{t('repairs.eyebrow')}</p>
              <h2 className="h-xl">
                {t('repairs.headline1')}
                <br />
                {t('repairs.headline2')}
              </h2>
              <p className="sub">{t('repairs.sub')}</p>
            </div>

            <div className="repair-strip reveal" role="list">
              {repairs.map((r) => (
                <div className="repair-pill" role="listitem" key={`${r.cat}-${r.name}`}>
                  <span className="repair-cat">{r.cat}</span>
                  <span className="repair-name">{r.name}</span>
                  <span className="repair-price">
                    {t('repairs.from')} <strong>{r.price}</strong>
                  </span>
                </div>
              ))}
            </div>

            <div className="btn-row reveal mt-32">
              <a href="#" className="btn btn-primary">
                {t('repairs.cta')}
              </a>
              <span className="repair-note">{t('repairs.note')}</span>
            </div>
          </div>
        </section>

        {/* ================= TRACKER ================= */}
        <section className="section" id="tracker">
          <div className="container-narrow">
            <div className="section-head reveal">
              <p className="eyebrow">{t('tracker.eyebrow')}</p>
              <h2 className="h-xl">
                {t('tracker.headline1')}
                <br />
                {t('tracker.headline2')}
              </h2>
              <p className="sub">{t('tracker.sub')}</p>
            </div>

            <RepairTracker />
          </div>
        </section>

        {/* ================= TESTIMONIALS (DARK) ================= */}
        <section className="section dark" data-testid="testimonials-section">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">{t('testimonials.eyebrow')}</p>
              <h2 className="h-xl on-dark">
                {t('testimonials.headline')}
                <br />
                <span className="gradient-text">{t('testimonials.headlineAccent')}</span>
              </h2>
              <p className="sub bright">{t('testimonials.sub')}</p>
            </div>

            <div className="testimonial-row reveal stagger">
              {testimonials.map((item) => (
                <article className="testimonial" key={item.name}>
                  <div className="stars" aria-label={t('testimonials.stars')}>
                    ★★★★★
                  </div>
                  <blockquote>{item.quote}</blockquote>
                  <div className="testimonial-meta">
                    <div className="name">
                      <strong>{item.name}</strong>
                      <span>{item.place}</span>
                    </div>
                    <span className="device-badge">{item.device}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="center reveal mt-48">
              <a href="#" className="link brand">
                {t('testimonials.reviewsLink')}
              </a>
            </div>
          </div>
        </section>

        {/* ================= CORPORATE ================= */}
        <section className="section gray" id="corporate">
          <div className="container">
            <div className="split">
              <div className="copy reveal">
                <p className="eyebrow">{t('corporate.eyebrow')}</p>
                <h2 className="h-lg">
                  {t('corporate.headline1')}
                  <br />
                  {t('corporate.headline2')}
                </h2>
                <p className="sub">{t('corporate.sub')}</p>
                <div className="btn-row left mt-32">
                  <a href="#" className="btn btn-primary">
                    {t('corporate.cta')}
                  </a>
                  <a href="#" className="btn btn-secondary">
                    {t('corporate.plans')}
                  </a>
                </div>
              </div>
              <div className="visual reveal">
                <img
                  className="split-media"
                  src="/applelab/hero-03.jpg"
                  alt={t('corporate.imageAlt')}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= BLOG ================= */}
        <section className="section" id="blog">
          <div className="container">
            <div className="section-head left row reveal">
              <div>
                <p className="eyebrow">{t('blog.eyebrow')}</p>
                <h2 className="h-lg mt-8">{t('blog.headline')}</h2>
              </div>
              <a href="#" className="link nowrap">
                {t('blog.seeAll')}
              </a>
            </div>

            <div className="blog-grid reveal stagger">
              {posts.map((post, index) => (
                <a href="#" className="blog-card" key={post.title}>
                  <img className="blog-media" src={BLOG_IMAGES[index] ?? BLOG_IMAGES[0]} alt={post.alt} loading="lazy" />
                  <div className="body">
                    <span className="cat">{post.cat}</span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <div className="meta">
                      <span>{post.author}</span>
                      <span className="dot" />
                      <span>{post.read}</span>
                      <span className="dot" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CONTACT / MAP ================= */}
        <section className="section gray" id="contact" data-testid="contact-section">
          <div className="container">
            <div className="split">
              <div className="copy reveal">
                <p className="eyebrow">{t('contact.eyebrow')}</p>
                <h2 className="h-lg">
                  {t('contact.headline1')}
                  <br />
                  {t('contact.headline2')}
                </h2>

                <div className="contact-info" data-testid="contact-info">
                  {config?.address ? (
                    <div className="contact-row">
                      <div className="icon-wrap"><svg><use href="#i-pin" /></svg></div>
                      <div>
                        <div className="info-label">{t('contact.address')}</div>
                        <div className="info-value pre-line">{config.address}</div>
                      </div>
                    </div>
                  ) : null}
                  {config?.phone_primary ? (
                    <div className="contact-row">
                      <div className="icon-wrap"><svg><use href="#i-phone" /></svg></div>
                      <div>
                        <div className="info-label">{t('contact.phone')}</div>
                        <div className="info-value">
                          <a href={telHref(config.phone_primary)}>{config.phone_primary}</a>
                          {config.phone_secondary ? (
                            <>
                              &nbsp;·&nbsp;
                              <a href={telHref(config.phone_secondary)}>{config.phone_secondary}</a>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {config?.email ? (
                    <div className="contact-row">
                      <div className="icon-wrap"><svg><use href="#i-mail" /></svg></div>
                      <div>
                        <div className="info-label">{t('contact.email')}</div>
                        <div className="info-value">
                          <a href={`mailto:${config.email}`}>{config.email}</a>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {config?.hours ? (
                    <div className="contact-row">
                      <div className="icon-wrap"><svg><use href="#i-clock" /></svg></div>
                      <div>
                        <div className="info-label">{t('contact.hours')}</div>
                        <div className="info-value pre-line">{config.hours}</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="btn-row left">
                  {whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-primary" data-testid="whatsapp-link">
                      {t('contact.whatsapp')}
                    </a>
                  ) : null}
                  {directions ? (
                    <a href={directions} target="_blank" rel="noreferrer" className="btn btn-secondary">
                      {t('contact.directions')}
                    </a>
                  ) : null}
                </div>
              </div>

              {config?.maps_embed_url ? (
                <div className="visual reveal">
                  <iframe
                    className="map-frame"
                    title={t('contact.mapTitle')}
                    src={config.maps_embed_url}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    data-testid="map-iframe"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="footer" data-testid="site-footer">
          <div className="container">
            <div className="footer-top">
              <div className="brand">
                <img src="/applelab/icon-white.svg" alt="" />
                <span className="wordmark">{config?.site_name || 'Apple Lab'}</span>
              </div>
              {LOCALES.length > 1 ? (
                <div className="footer-lang" data-testid="footer-language">
                  <span className="muted">{t('footer.language')}</span>
                  {LOCALES.map((code, index) => (
                    <span key={code} className="footer-lang-item">
                      {index > 0 ? <span className="sep">·</span> : null}
                      <Link
                        href="/"
                        locale={code}
                        lang={code}
                        className={code === locale ? 'active' : undefined}
                        aria-current={code === locale ? 'true' : undefined}
                      >
                        {LOCALE_LABELS[code as AppLocale]}
                      </Link>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="footer-grid">
              <div className="footer-col">
                <h4>{t('footer.services')}</h4>
                <ul>
                  {serviceLinks.map((label) => (
                    <li key={label}>
                      <a href="#services">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="footer-col">
                <h4>{t('footer.quickLinks')}</h4>
                <ul>
                  {QUICK_LINKS.map((link) => (
                    <li key={link.key}>
                      <a href={link.href}>{t(`footer.quick.${link.key}`)}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="footer-col">
                <h4>{t('footer.contact')}</h4>
                <ul>
                  {config?.phone_primary ? (
                    <li><a href={telHref(config.phone_primary)}>{config.phone_primary}</a></li>
                  ) : null}
                  {config?.phone_secondary ? (
                    <li><a href={telHref(config.phone_secondary)}>{config.phone_secondary}</a></li>
                  ) : null}
                  {config?.email ? (
                    <li><a href={`mailto:${config.email}`}>{config.email}</a></li>
                  ) : null}
                  {config?.address ? (
                    <li className="muted">{config.address.replace(/\n/g, ', ')}</li>
                  ) : null}
                </ul>
              </div>
              <div className="footer-col">
                <h4>{t('footer.follow')}</h4>
                {socials.length > 0 ? (
                  <div className="social-row">
                    {socials.map((s) => (
                      <a key={s.key} href={config?.social[s.key]} target="_blank" rel="noreferrer" aria-label={s.label}>
                        <svg><use href={`#${s.icon}`} /></svg>
                      </a>
                    ))}
                  </div>
                ) : null}
                <ul className={socials.length > 0 ? 'mt-24' : undefined}>
                  <li><a href="#">{t('footer.careers')}</a></li>
                  <li><a href="#">{t('footer.press')}</a></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <span>{t('footer.rights', { year })}</span>
              <div className="legal-links">
                <a href="#">{t('footer.privacy')}</a>
                <a href="#">{t('footer.terms')}</a>
                <a href="/sitemap.xml">{t('footer.sitemap')}</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <ChatWidget />
    </>
  )
}

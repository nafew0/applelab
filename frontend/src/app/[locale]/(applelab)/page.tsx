import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import RepairTracker from '@/components/applelab/RepairTracker'
import ScrollFilm from '@/components/applelab/ScrollFilm'
import { Link } from '@/i18n/navigation'
import { getSiteConfig, whatsappLink } from '@/lib/content'
import { buildSiteMetadata, localBusinessJsonLd } from '@/lib/seo'

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

/** `href` is the device-catalog page for that family (see /services). */
const DEVICE_CARDS = [
  { key: 'macbook-pro', href: '/services/macbook-pro', img: '/applelab/device-macbook-pro.jpg', className: 'promo-card sky wide' },
  { key: 'macbook-air', href: '/services/macbook-air', img: '/applelab/device-macbook-air.jpg', className: 'promo-card' },
  { key: 'iphone', href: '/services/iphone', img: '/applelab/device-iphone.jpg', className: 'promo-card sky' },
  { key: 'ipad', href: '/services/ipad', img: '/applelab/device-ipad.jpg', className: 'promo-card sky' },
  { key: 'imac', href: '/services/imac', img: '/applelab/device-imac.jpg', className: 'promo-card' },
  { key: 'mac-mini', href: '/services/mac-mini', img: '/applelab/device-mac-mini.jpg', className: 'promo-card' },
  { key: 'apple-watch', href: '/services/apple-watch', img: '/applelab/device-apple-watch.jpg', className: 'promo-card sky' },
  { key: 'airpods', href: '/services/airpods', img: '/applelab/device-airpods.jpg', className: 'promo-card' },
  { key: 'accessories', href: '/services', img: '/applelab/device-accessories.jpg', className: 'promo-card' },
] as const

const BOOK_HREF = '/f/demo'

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

  const whatsapp = config ? whatsappLink(config.whatsapp_number) : null
  const directions = config?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address.replace(/\n/g, ', '))}`
    : null

  return (
    <>
      {config ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(config, locale)) }}
        />
      ) : null}

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
              <Link href={BOOK_HREF} className="btn btn-primary" data-testid="hero-cta-primary">
                {t('hero.book')}
              </Link>
              <Link href="/services" className="btn btn-secondary">
                {t('hero.quote')}
              </Link>
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
                  <h3>
                    <Link href={card.href} className="promo-title-link" data-testid={`device-card-link-${card.key}`}>
                      {t(`devices.items.${card.key}.title`)}
                    </Link>
                  </h3>
                  <p className="promo-sub">{t(`devices.items.${card.key}.sub`)}</p>
                  <div className="promo-actions">
                    <Link href={BOOK_HREF} className="btn btn-primary btn-sm">
                      {t('devices.book')}
                    </Link>
                    <Link href={card.href} className="btn btn-secondary btn-sm">
                      {t('devices.pricing')}
                    </Link>
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
              <Link href={BOOK_HREF} className="btn btn-ghost-dark">
                {t('steps.cta')}{' '}
                <svg className="btn-icon">
                  <use href="#i-arrow" />
                </svg>
              </Link>
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
              <Link href="/services" className="btn btn-primary" data-testid="repairs-cta">
                {t('repairs.cta')}
              </Link>
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

      </main>
    </>
  )
}

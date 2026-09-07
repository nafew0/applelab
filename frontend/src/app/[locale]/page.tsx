import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import ChatWidget from '@/components/applelab/ChatWidget'
import HomeEffects from '@/components/applelab/HomeEffects'
import HomeNav from '@/components/applelab/HomeNav'
import IconSprite from '@/components/applelab/IconSprite'
import RepairTracker from '@/components/applelab/RepairTracker'
import ScrollFilm from '@/components/applelab/ScrollFilm'
import { getSiteConfig } from '@/lib/content'
import { buildSiteMetadata, localBusinessJsonLd } from '@/lib/seo'

import './applelab-home.css'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const config = await getSiteConfig(locale)
  // The homepage copy is fixed by the design, so its title/description are too.
  // Everything else (alternates, OG url) still comes from SiteConfig.
  const base = buildSiteMetadata(config, locale, 'Apple Lab')
  const title = "Apple Lab — Bangladesh's most trusted Apple repair lab"
  const description =
    'MacBook, iPhone, iPad, iMac and Apple Watch repair in Dhanmondi, Dhaka. Genuine parts, free diagnosis and a 90-day warranty on every repair.'
  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, title, description },
  }
}

const PROMO_CARDS = [
  {
    title: 'MacBook Pro',
    sub: 'Screen · Battery · Logic board · Liquid damage',
    img: '/applelab/device-macbook-pro.jpg',
    alt: 'MacBook Pro',
    className: 'promo-card sky wide',
  },
  {
    title: 'MacBook Air',
    sub: 'Screen · Battery · Keyboard',
    img: '/applelab/device-macbook-air.jpg',
    alt: 'MacBook Air',
    className: 'promo-card',
  },
  {
    title: 'iPhone',
    sub: 'Screen · Battery · Camera · Charging',
    img: '/applelab/device-iphone.jpg',
    alt: 'iPhone',
    className: 'promo-card sky',
  },
  {
    title: 'iPad',
    sub: 'Screen · Battery · Charging port',
    img: '/applelab/device-ipad.jpg',
    alt: 'iPad',
    className: 'promo-card sky',
  },
  {
    title: 'iMac',
    sub: 'Display · SSD · Power supply',
    img: '/applelab/device-imac.jpg',
    alt: 'iMac',
    className: 'promo-card',
  },
  {
    title: 'Mac Mini / Studio',
    sub: 'SSD · Logic board · Cooling',
    img: '/applelab/device-mac-mini.jpg',
    alt: 'Mac Mini',
    className: 'promo-card',
  },
  {
    title: 'Apple Watch',
    sub: 'Screen · Battery · Crown',
    img: '/applelab/device-apple-watch.jpg',
    alt: 'Apple Watch',
    className: 'promo-card sky',
  },
  {
    title: 'AirPods',
    sub: 'Speaker · Mic · Battery',
    img: '/applelab/device-airpods.jpg',
    alt: 'AirPods with charging case',
    className: 'promo-card',
  },
  {
    title: 'Accessories',
    sub: 'Chargers · Cables · Keyboards',
    img: '/applelab/device-accessories.jpg',
    alt: 'Magic Keyboard',
    className: 'promo-card',
  },
]

const FEATURES = [
  {
    icon: 'i-badge',
    title: 'Certified technicians',
    body: 'Engineers trained on Apple silicon, board-level repairs, and the tools the rest of Dhaka does not have.',
  },
  {
    icon: 'i-sparkle',
    title: 'Genuine parts only',
    body: 'OEM displays, batteries and logic-board components — sourced through the same supply chain Apple Authorized service providers use.',
  },
  {
    icon: 'i-shield',
    title: '90-day warranty',
    body: 'Every repair comes with a no-questions-asked 90-day guarantee. If the same fault returns, we fix it free.',
  },
  {
    icon: 'i-receipt',
    title: 'No fix, no fee',
    body: "Free diagnosis. If we can't fix your device, you owe nothing — not even a service charge.",
  },
  {
    icon: 'i-bolt',
    title: 'Same-day service',
    body: 'Most screen, battery and charging repairs are completed within hours — not days.',
  },
  {
    icon: 'i-truck',
    title: 'Nationwide courier',
    body: 'Outside Dhaka? Send your device by courier — we repair, test, and return it to your doorstep, insured.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Book online or walk in',
    body: 'Book a slot in seconds, or just walk into our Dhanmondi lab — six days a week, no appointment needed.',
  },
  {
    num: '02',
    title: 'Free diagnosis',
    body: 'Our engineers run a full diagnostic on every device. Always free, always thorough.',
  },
  {
    num: '03',
    title: 'Repair with genuine parts',
    body: 'You approve a fixed quote. We rebuild with original components and bench-test before sign-off.',
  },
  {
    num: '04',
    title: 'Pickup & 90-day warranty',
    body: 'Collect in-store or have it couriered — every repair comes with our 90-day warranty as standard.',
  },
]

const REPAIRS = [
  { cat: 'iPhone', name: 'Screen replacement', price: '৳ 7,500' },
  { cat: 'iPhone', name: 'Battery replacement', price: '৳ 3,200' },
  { cat: 'iPhone', name: 'Charging port', price: '৳ 2,800' },
  { cat: 'MacBook', name: 'Retina display', price: '৳ 28,500' },
  { cat: 'MacBook', name: 'Battery replacement', price: '৳ 9,500' },
  { cat: 'MacBook', name: 'Keyboard / topcase', price: '৳ 14,000' },
  { cat: 'MacBook', name: 'Liquid damage recovery', price: '৳ 6,500' },
  { cat: 'iPad', name: 'Glass replacement', price: '৳ 6,800' },
  { cat: 'iMac', name: 'SSD upgrade', price: '৳ 12,000' },
  { cat: 'Apple Watch', name: 'Screen + battery', price: '৳ 5,500' },
  { cat: 'AirPods', name: 'Battery / speaker', price: '৳ 2,400' },
]

const TESTIMONIALS = [
  {
    quote:
      '“My MacBook Pro had liquid damage I was sure was terminal. Apple Lab brought it back in three days — and charged me half what an authorized centre quoted. Honest people, real expertise.”',
    name: 'Tasnim R.',
    place: 'Banani, Dhaka',
    device: 'MacBook Pro 16"',
  },
  {
    quote:
      '“Cracked iPhone screen replaced in 40 minutes, indistinguishable from original. The Face ID still works perfectly — that’s the part nobody else gets right in this city.”',
    name: 'Rifat A.',
    place: 'Uttara, Dhaka',
    device: 'iPhone 14 Pro',
  },
  {
    quote:
      '“They couriered our iMac back to Chattogram, repaired and packed better than the original box. Status updates by SMS through the entire process. This is how Apple service should feel.”',
    name: 'Nusrat J.',
    place: 'Chattogram',
    device: 'iMac 24" M1',
  },
]

const POSTS = [
  {
    cat: 'Battery health',
    title: 'When should you actually replace your iPhone battery?',
    excerpt:
      'The 80% rule is real, but it’s not the only signal. Here’s how our engineers decide.',
    author: 'Tanvir, Lead Engineer',
    read: '4 min read',
    date: 'May 2026',
    img: '/applelab/hero-11.jpg',
    alt: 'Battery being lifted out of a MacBook',
  },
  {
    cat: 'MacBook',
    title: 'Liquid damage: what to do in the first 60 minutes',
    excerpt:
      'The mistake almost everyone makes — and what to do instead if you want a chance at recovery.',
    author: 'Rezwan, Sr. Engineer',
    read: '6 min read',
    date: 'Apr 2026',
    img: '/applelab/hero-08.jpg',
    alt: 'MacBook logic board exposed on the bench',
  },
  {
    cat: 'Buying guide',
    title: 'Is a used MacBook from Bashundhara worth it in 2026?',
    excerpt:
      'What to check before you pay, what to walk away from, and the three model years to avoid entirely.',
    author: 'Apple Lab Editorial',
    read: '8 min read',
    date: 'Apr 2026',
    img: '/applelab/hero-14.jpg',
    alt: 'MacBook components laid out in order',
  },
]

/**
 * Apple Lab homepage — a 1:1 port of the approved design (Design/Apple Lab
 * Homepage.html). Copy is intentionally static for this phase; the CMS wiring
 * follows once the content plan's price card and blog models land.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const config = await getSiteConfig(locale)

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
              Bangladesh&apos;s most trusted Apple repair lab
              <span className="dot" />
              Since 2010
            </p>
            <h1 className="h-hero reveal">
              Your Apple device,
              <br />
              <span className="gradient-text">perfectly repaired.</span>
            </h1>
            <p className="sub reveal">
              MacBook · iPhone · iPad · iMac · Apple Watch.
              <br />
              Genuine parts. 90-day warranty. Free diagnosis.
            </p>
            <div className="btn-row hero-cta reveal">
              <a href="#booking" className="btn btn-primary">
                Book a Repair
              </a>
              <a href="#quote" className="btn btn-secondary">
                Get an Instant Quote
              </a>
            </div>
            <div className="hero-walkin reveal">
              <a href="#contact" className="link">
                Or walk in at Dhanmondi, Dhaka
              </a>
            </div>
          </div>

          <div className="hero-showcase reveal">
            <img
              className="hero-showcase-media"
              src="/applelab/hero-showcase.jpg"
              alt="A MacBook Pro, iMac, Apple Watch and Magic Keyboard arranged on a white surface"
              fetchPriority="high"
            />
          </div>

          <div className="trust-bar reveal stagger">
            <div className="trust-item">
              <div className="num">
                <span data-count="15" data-suffix="+">
                  15+
                </span>
              </div>
              <div className="lbl">Years of expertise</div>
            </div>
            <div className="trust-item">
              <div className="num">
                <span data-count="10000" data-suffix="+">
                  10,000+
                </span>
              </div>
              <div className="lbl">Devices repaired</div>
            </div>
            <div className="trust-item">
              <div className="num">
                <span data-count="90" data-suffix="-day">
                  90-day
                </span>
              </div>
              <div className="lbl">Warranty on every repair</div>
            </div>
            <div className="trust-item">
              <div className="num">No fix.</div>
              <div className="lbl">No fee. Ever.</div>
            </div>
          </div>
        </section>

        {/* ================= DEVICE GRID ================= */}
        <section className="section gray" id="services">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Our services</p>
              <h2 className="h-xl">
                Every Apple device.
                <br />
                <span className="gradient-text">Every repair.</span>
              </h2>
              <p className="sub">
                From cracked screens to logic-board surgery — if Apple made it, we fix it. Walk-in
                or courier nationwide.
              </p>
            </div>

            <div className="promo-grid reveal stagger">
              {PROMO_CARDS.map((card) => (
                <div className={card.className} key={card.title}>
                  <h3>{card.title}</h3>
                  <p className="promo-sub">{card.sub}</p>
                  <div className="promo-actions">
                    <a href="#booking" className="btn btn-primary btn-sm">
                      Book a repair
                    </a>
                    <a href="#quote" className="btn btn-secondary btn-sm">
                      View pricing
                    </a>
                  </div>
                  <div className="promo-media">
                    <img src={card.img} alt={card.alt} loading="lazy" />
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
              <p className="eyebrow">Why Apple Lab</p>
              <h2 className="h-xl">
                Repairs you can trust.
                <br />
                Every time.
              </h2>
            </div>
            <div className="feature-grid reveal stagger">
              {FEATURES.map((f) => (
                <article className="feature-card" key={f.title}>
                  <div className="icon-wrap">
                    <svg>
                      <use href={`#${f.icon}`} />
                    </svg>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS (DARK) ================= */}
        <section className="section dark" id="how">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Simple process</p>
              <h2 className="h-xl" style={{ color: '#fff' }}>
                From broken to like-new
                <br />
                in four steps.
              </h2>
              <p className="sub bright">
                Engineered to be predictable. No surprises, no hidden costs, no time wasted.
              </p>
            </div>

            <div className="steps reveal stagger">
              {STEPS.map((s) => (
                <div className="step" key={s.num}>
                  <div className="step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>

            <div className="steps-cta reveal">
              <a href="#booking" className="btn btn-ghost-dark">
                Book your repair{' '}
                <svg style={{ width: 14, height: 14, stroke: '#fff', fill: 'none', strokeWidth: 2 }}>
                  <use href="#i-arrow" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ================= COMMON REPAIRS ================= */}
        <section className="section gray" id="quote">
          <div className="container">
            <div className="section-head reveal" style={{ marginBottom: 48 }}>
              <p className="eyebrow">Common repairs</p>
              <h2 className="h-xl">
                Know your price
                <br />
                before you visit.
              </h2>
              <p className="sub">
                Starting prices for our most-booked services. Your final quote is fixed after free
                diagnosis — no surprises.
              </p>
            </div>

            <div className="repair-strip reveal" role="list">
              {REPAIRS.map((r) => (
                <div className="repair-pill" role="listitem" key={`${r.cat}-${r.name}`}>
                  <span className="repair-cat">{r.cat}</span>
                  <span className="repair-name">{r.name}</span>
                  <span className="repair-price">
                    From <strong>{r.price}</strong>
                  </span>
                </div>
              ))}
            </div>

            <div className="btn-row reveal" style={{ marginTop: 32 }}>
              <a href="#" className="btn btn-primary">
                Get an instant quote
              </a>
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                Prices may vary after free diagnosis.
              </span>
            </div>
          </div>
        </section>

        {/* ================= TRACKER ================= */}
        <section className="section" id="tracker">
          <div className="container-narrow">
            <div className="section-head reveal">
              <p className="eyebrow">Track your repair</p>
              <h2 className="h-xl">
                Know exactly where
                <br />
                your device is.
              </h2>
              <p className="sub">
                Enter your ticket ID for real-time status updates — no phone calls, no waiting.
              </p>
            </div>

            <RepairTracker />
          </div>
        </section>

        {/* ================= TESTIMONIALS (DARK) ================= */}
        <section className="section dark">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Customer stories</p>
              <h2 className="h-xl" style={{ color: '#fff' }}>
                Thousands of happy
                <br />
                <span className="gradient-text">Apple users.</span>
              </h2>
              <p className="sub bright">Real reviews from customers across Bangladesh.</p>
            </div>

            <div className="testimonial-row reveal stagger">
              {TESTIMONIALS.map((t) => (
                <article className="testimonial" key={t.name}>
                  <div className="stars" aria-label="5 out of 5">
                    ★★★★★
                  </div>
                  <blockquote>{t.quote}</blockquote>
                  <div className="testimonial-meta">
                    <div className="name">
                      <strong>{t.name}</strong>
                      <span>{t.place}</span>
                    </div>
                    <span className="device-badge">{t.device}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="center reveal" style={{ marginTop: 48 }}>
              <a href="#" className="link" style={{ color: 'var(--brand-blue)' }}>
                See all 600+ Google reviews
              </a>
            </div>
          </div>
        </section>

        {/* ================= CORPORATE ================= */}
        <section className="section gray" id="corporate">
          <div className="container">
            <div className="split">
              <div className="copy reveal">
                <p className="eyebrow">For business</p>
                <h2 className="h-lg">
                  Apple fleet management,
                  <br />
                  built for Dhaka&apos;s teams.
                </h2>
                <p className="sub">
                  Priority repair, SLA contracts, bulk servicing, and monthly invoicing for
                  companies running on Apple. From three-person studios to 500-seat enterprises.
                </p>
                <div className="btn-row left" style={{ marginTop: 32 }}>
                  <a href="#" className="btn btn-primary">
                    Talk to corporate
                  </a>
                  <a href="#" className="btn btn-secondary">
                    See plans
                  </a>
                </div>
              </div>
              <div className="visual reveal">
                <img
                  className="split-media"
                  src="/applelab/hero-03.jpg"
                  alt="Apple Lab engineer servicing a MacBook at the workbench"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= BLOG ================= */}
        <section className="section" id="blog">
          <div className="container">
            <div
              className="section-head left reveal"
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                maxWidth: 'none',
                marginBottom: 48,
              }}
            >
              <div>
                <p className="eyebrow">Tips &amp; guides</p>
                <h2 className="h-lg" style={{ marginTop: 8 }}>
                  From our repair experts.
                </h2>
              </div>
              <a href="#" className="link" style={{ whiteSpace: 'nowrap' }}>
                See all articles
              </a>
            </div>

            <div className="blog-grid reveal stagger">
              {POSTS.map((p) => (
                <a href="#" className="blog-card" key={p.title}>
                  <img className="blog-media" src={p.img} alt={p.alt} loading="lazy" />
                  <div className="body">
                    <span className="cat">{p.cat}</span>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                    <div className="meta">
                      <span>{p.author}</span>
                      <span className="dot" />
                      <span>{p.read}</span>
                      <span className="dot" />
                      <span>{p.date}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CONTACT / MAP ================= */}
        <section className="section gray" id="contact">
          <div className="container">
            <div className="split">
              <div className="copy reveal">
                <p className="eyebrow">Visit our lab</p>
                <h2 className="h-lg">
                  Dhanmondi, Dhaka.
                  <br />
                  Open six days a week.
                </h2>

                <div className="contact-info">
                  <div className="contact-row">
                    <div className="icon-wrap">
                      <svg>
                        <use href="#i-pin" />
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Address</div>
                      <div className="info-value">
                        ADC Empire Plaza, 183 Satmasjid Road
                        <br />
                        Dhanmondi, Dhaka 1205
                      </div>
                    </div>
                  </div>
                  <div className="contact-row">
                    <div className="icon-wrap">
                      <svg>
                        <use href="#i-phone" />
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Phone</div>
                      <div className="info-value">
                        <a href="tel:+8801603710044">01603-710044</a>
                        &nbsp;·&nbsp;
                        <a href="tel:+8801737292828">01737-292828</a>
                      </div>
                    </div>
                  </div>
                  <div className="contact-row">
                    <div className="icon-wrap">
                      <svg>
                        <use href="#i-mail" />
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Email</div>
                      <div className="info-value">
                        <a href="mailto:hello@applelab.com.bd">hello@applelab.com.bd</a>
                      </div>
                    </div>
                  </div>
                  <div className="contact-row">
                    <div className="icon-wrap">
                      <svg>
                        <use href="#i-clock" />
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Hours</div>
                      <div className="info-value">
                        Saturday – Thursday · 10 AM – 9 PM
                        <br />
                        Closed on Fridays &amp; public holidays
                      </div>
                    </div>
                  </div>
                </div>

                <div className="btn-row left">
                  <a href="#" className="btn btn-primary">
                    WhatsApp us
                  </a>
                  <a href="#" className="btn btn-secondary">
                    Get directions
                  </a>
                </div>
              </div>

              <div className="visual reveal">
                <iframe
                  className="map-frame"
                  title="Apple Lab, Dhanmondi, Dhaka"
                  src="https://www.google.com/maps?q=ADC%20Empire%20Plaza%2C%20183%20Satmasjid%20Road%2C%20Dhanmondi%2C%20Dhaka%201205&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="footer">
          <div className="container">
            <div className="footer-top">
              <div className="brand">
                <img src="/applelab/icon-white.svg" alt="" />
                <span className="wordmark">Apple Lab</span>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#86868B' }}>Language:</span>
                <a href="#" style={{ fontSize: 13, color: '#fff' }}>
                  English
                </a>
                <span style={{ color: '#3A3A3C' }}>·</span>
                <a href="#" style={{ fontSize: 13, color: '#86868B' }}>
                  বাংলা
                </a>
              </div>
            </div>

            <div className="footer-grid">
              <div className="footer-col">
                <h4>Services</h4>
                <ul>
                  <li>
                    <a href="#">MacBook Pro repair</a>
                  </li>
                  <li>
                    <a href="#">MacBook Air repair</a>
                  </li>
                  <li>
                    <a href="#">iPhone repair</a>
                  </li>
                  <li>
                    <a href="#">iPad repair</a>
                  </li>
                  <li>
                    <a href="#">iMac repair</a>
                  </li>
                  <li>
                    <a href="#">Apple Watch repair</a>
                  </li>
                  <li>
                    <a href="#">AirPods repair</a>
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Quick links</h4>
                <ul>
                  <li>
                    <a href="#booking">Book a repair</a>
                  </li>
                  <li>
                    <a href="#tracker">Track repair</a>
                  </li>
                  <li>
                    <a href="#quote">Get a quote</a>
                  </li>
                  <li>
                    <a href="#corporate">Corporate services</a>
                  </li>
                  <li>
                    <a href="#">Sell your Mac</a>
                  </li>
                  <li>
                    <a href="#">FAQ</a>
                  </li>
                  <li>
                    <a href="#">Warranty policy</a>
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <ul>
                  <li>
                    <a href="tel:+8801603710044">01603-710044</a>
                  </li>
                  <li>
                    <a href="tel:+8801737292828">01737-292828</a>
                  </li>
                  <li>
                    <a href="mailto:hello@applelab.com.bd">hello@applelab.com.bd</a>
                  </li>
                  <li style={{ color: '#86868B' }}>
                    ADC Empire Plaza, 183 Satmasjid Rd, Dhanmondi, Dhaka 1205
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Follow</h4>
                <div className="social-row">
                  <a href="#" aria-label="Facebook">
                    <svg>
                      <use href="#i-fb" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Instagram">
                    <svg>
                      <use href="#i-ig" />
                    </svg>
                  </a>
                  <a href="#" aria-label="YouTube">
                    <svg>
                      <use href="#i-yt" />
                    </svg>
                  </a>
                  <a href="#" aria-label="LinkedIn">
                    <svg>
                      <use href="#i-in" />
                    </svg>
                  </a>
                </div>
                <ul style={{ marginTop: 24 }}>
                  <li>
                    <a href="#">Careers</a>
                  </li>
                  <li>
                    <a href="#">Press</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© 2026 Apple Lab Bangladesh. All rights reserved.</span>
              <div className="legal-links">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <ChatWidget />
    </>
  )
}

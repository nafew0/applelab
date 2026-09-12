'use client'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

const FRAME_SRCS = [
  '/applelab/device-macbook-pro.jpg', '/applelab/hero-05.jpg', '/applelab/hero-06.jpg',
  '/applelab/hero-07.jpg', '/applelab/hero-11.jpg', '/applelab/hero-12.jpg',
  '/applelab/hero-13.jpg', '/applelab/hero-04.jpg', '/applelab/hero-08.jpg',
  '/applelab/hero-14.jpg', '/applelab/hero-06.jpg', '/applelab/device-macbook-pro.jpg',
] as const

const CAPTIONS = [
  { n: '01', in: 0.07, out: 0.24 },
  { n: '02', in: 0.26, out: 0.4 },
  { n: '03', in: 0.43, out: 0.66 },
  { n: '04', in: 0.7, out: 0.86 },
] as const

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1)

/**
 * Scroll-scrubbed repair film: the page's scroll position drives the frame
 * cross-fade, captions, progress bar and the closing "Reborn" card. Falls back
 * to a single static frame when the visitor prefers reduced motion.
 */
export default function ScrollFilm() {
  const t = useTranslations('applelab.film')
  const frameAlts = t.raw('frames') as string[]
  const filmRef = useRef<HTMLElement>(null)
  const frameRefs = useRef<(HTMLImageElement | null)[]>([])
  const capRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRef = useRef<HTMLElement>(null)
  const glintRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const outroRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const film = filmRef.current
    if (!film) return

    const frames = frameRefs.current
    const caps = capRefs.current
    const bar = barRef.current
    const glint = glintRef.current
    const glow = glowRef.current
    const intro = introRef.current
    const outro = outroRef.current
    const hint = hintRef.current

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      film.classList.add('static')
      frames.forEach((f, i) => {
        if (!f) return
        f.style.opacity = i === frames.length - 1 ? '1' : '0'
        f.style.transform = 'none'
      })
      if (intro) intro.style.opacity = '0'
      if (outro) {
        outro.style.opacity = '1'
        outro.style.pointerEvents = 'auto'
      }
      if (hint) hint.style.opacity = '0'
      return
    }

    let target = 0
    let cur = 0
    let raf = 0

    const measure = () => {
      const total = film.offsetHeight - innerHeight
      target = clamp(-film.getBoundingClientRect().top / total, 0, 1)
    }

    const tick = () => {
      cur += (target - cur) * 0.14
      if (Math.abs(target - cur) < 0.0004) cur = target
      const f = cur * (frames.length - 1)

      frames.forEach((img, i) => {
        if (!img) return
        const vis = clamp(1 - Math.abs(i - f), 0, 1)
        img.style.opacity = String(vis)
        img.style.transform = `scale(${(1.07 - 0.07 * vis).toFixed(4)})`
      })

      if (bar) bar.style.transform = `scaleX(${cur.toFixed(4)})`

      caps.forEach((c, i) => {
        if (!c) return
        const meta = CAPTIONS[i]
        const vis =
          range(cur, meta.in - 0.03, meta.in) * (1 - range(cur, meta.out, meta.out + 0.03))
        c.style.opacity = String(vis)
        c.style.transform = `translateY(${((1 - vis) * 14).toFixed(1)}px)`
      })

      if (intro) {
        const v = 1 - range(cur, 0.015, 0.09)
        intro.style.opacity = String(v)
        intro.style.transform = `translateY(${((1 - v) * -22).toFixed(1)}px)`
        intro.style.pointerEvents = v > 0.5 ? 'auto' : 'none'
      }

      if (hint) hint.style.opacity = String(1 - range(cur, 0.01, 0.05))

      if (glint) {
        const g = range(cur, 0.42, 0.64)
        glint.style.opacity = g > 0.02 && g < 0.98 ? '0.9' : '0'
        glint.style.transform = `translateX(${(-120 + g * 520).toFixed(1)}%) skewX(-18deg)`
      }

      if (glow) glow.style.opacity = String(range(cur, 0.9, 0.99))

      if (outro) {
        const v = range(cur, 0.9, 0.985)
        outro.style.opacity = String(v)
        outro.style.transform = `translateY(${((1 - v) * 24).toFixed(1)}px)`
        outro.style.pointerEvents = v > 0.5 ? 'auto' : 'none'
      }

      raf = requestAnimationFrame(tick)
    }

    addEventListener('scroll', measure, { passive: true })
    addEventListener('resize', measure)
    measure()
    tick()

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', measure)
      removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section
      className="film"
      id="repair-film"
      ref={filmRef}
      aria-label="A MacBook repair, from broken to reborn"
    >
      <div className="film-sticky">
        <div className="film-stage">
          {FRAME_SRCS.map((src, i) => (

            <img
              key={`${src}-${i}`}
              className="film-frame"
              src={src}
              alt={frameAlts[i] ?? ''}
              decoding="async"
              ref={(el) => {
                frameRefs.current[i] = el
              }}
            />
          ))}
          <div className="film-glint" ref={glintRef} />
          <div className="film-glow" ref={glowRef} />
          <div className="film-intro" ref={introRef}>
            <p className="film-eyebrow">{t('eyebrow')}</p>
            <h2 className="film-h">
              {t('introLine1')}
              <br />
              {t('introLine2')} <span className="gradient-text">{t('introAccent')}</span>
            </h2>
          </div>
          {CAPTIONS.map((cap, i) => (
            <div
              key={cap.n}
              className="film-cap"
              ref={(el) => {
                capRefs.current[i] = el
              }}
            >
              <span className="n">{cap.n}</span>
              {t(`captions.${cap.n}`)}
            </div>
          ))}
          <div className="film-outro" ref={outroRef}>
            <h2 className="film-h">
              <span className="gradient-text">{t('outroAccent')}</span>
            </h2>
            <p>{t('outroBody')}</p>
            <a href="#booking" className="btn btn-primary">
              {t('cta')}
            </a>
          </div>
          <div className="film-bar">
            <i ref={barRef} />
          </div>
          <span className="film-credit">{t('credit')}</span>
        </div>
        <div className="film-hint" ref={hintRef}>
          {t('hint')}{' '}
          <svg>
            <use href="#i-arrow" />
          </svg>
        </div>
      </div>
    </section>
  )
}

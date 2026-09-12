'use client'
import { useEffect, useRef, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'

import manifest from './film-manifest.json'

type Entry = { src: string; section: string; weight: number; hold: number }

const ENTRIES = manifest.entries as Entry[]
const { width: IW, height: IH, safe: SAFE, background: BG } = manifest

// Edge feathering (CSS px). No top feather: the frame's top edge carries the
// floating display, and it meets the nav or a band of the same wall colour.
const FEATHER_X = 36
const FEATHER_BOTTOM = 16

const STARTS: number[] = []
const TOTAL = ENTRIES.reduce((sum, e) => {
  STARTS.push(sum)
  return sum + e.weight
}, 0)

/** [start, end] of a named section, as a fraction of the whole film. */
const SECTIONS = ENTRIES.reduce<Record<string, [number, number]>>((acc, e, i) => {
  const start = STARTS[i] / TOTAL
  const end = (STARTS[i] + e.weight) / TOTAL
  acc[e.section] = acc[e.section] ? [acc[e.section][0], end] : [start, end]
  return acc
}, {})
const at = (section: string, frac: number) => {
  const [a, b] = SECTIONS[section]
  return a + (b - a) * frac
}

const CAPTIONS = [
  { n: '01', from: at('apart', 0.45), to: SECTIONS.apart[1] },
  { n: '02', from: SECTIONS.exploded[0], to: SECTIONS.out[1] },
  { n: '03', from: SECTIONS.hands[0], to: SECTIONS.renewed[1] },
  { n: '04', from: SECTIONS.together[0], to: at('together', 0.8) },
] as const
const INTRO_OUT: [number, number] = [at('intro', 0.4), SECTIONS.intro[1]]
const GLINT: [number, number] = SECTIONS.hands
const OUTRO_IN: [number, number] = [at('together', 0.9), at('awake', 0.25)]
const FADE = 0.015

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1)

/**
 * Where the frame sits in a cw x ch box: as large as possible while the laptop
 * (SAFE) stays fully visible below the nav. Mirrored in CSS by `.film-poster`,
 * so the server-rendered poster and the canvas line up pixel for pixel.
 */
function layout(cw: number, ch: number, top: number) {
  const scale = Math.min(Math.max(cw / IW, ch / IH), cw / SAFE.w, (ch - top) / SAFE.h)
  const dw = IW * scale
  const dh = IH * scale
  const wantX = cw / 2 - (SAFE.x + SAFE.w / 2) * scale
  const wantY = top + (ch - top) / 2 - (SAFE.y + SAFE.h / 2) * scale
  const dx = dw >= cw ? clamp(wantX, cw - dw, 0) : (cw - dw) / 2
  const dy = dh >= ch ? clamp(wantY, ch - dh, 0) : wantY
  return { dx, dy, dw, dh }
}

/**
 * Scroll-scrubbed repair film. Scroll position drives a frame sequence (video
 * frames plus keyframe stills, see scripts/build_hero_film.py) drawn full-bleed
 * on a canvas, with captions and the closing "Reborn" card on top. Falls back
 * to the final frame when the visitor prefers reduced motion.
 */
export default function ScrollFilm() {
  const t = useTranslations('applelab.film')
  const filmRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const capRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRef = useRef<HTMLElement>(null)
  const glintRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const outroRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const film = filmRef.current
    const sticky = stickyRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!film || !sticky || !canvas || !ctx) return

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const navTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 48

    const images = ENTRIES.map(() => new Image())
    const loaded = ENTRIES.map(() => false)
    let dirty = true
    let drewOnce = false

    const load = (i: number) => {
      const img = images[i]
      img.decoding = 'async'
      img.onload = () => {
        loaded[i] = true
        dirty = true
      }
      img.src = ENTRIES[i].src
    }
    const nearestLoaded = (i: number) => {
      for (let j = i; j >= 0; j--) if (loaded[j]) return j
      for (let j = i + 1; j < ENTRIES.length; j++) if (loaded[j]) return j
      return -1
    }

    let cw = 0
    let ch = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cw = sticky.clientWidth
      ch = sticky.clientHeight
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dirty = true
    }

    /** Draw the film at position u (0..TOTAL): entry i, cross-fading into i+1 after its hold. */
    const draw = (u: number) => {
      let i = ENTRIES.length - 1
      while (i > 0 && STARTS[i] > u) i--
      const e = ENTRIES[i]
      const local = clamp((u - STARTS[i]) / e.weight, 0, 1)
      const mix = i < ENTRIES.length - 1 && e.hold < 1 ? range(local, e.hold, 1) : 0

      const a = nearestLoaded(i)
      if (a < 0) return
      const b = mix > 0 && loaded[i + 1] ? i + 1 : -1
      const { dx, dy, dw, dh } = layout(cw, ch, navTop)

      ctx.clearRect(0, 0, cw, ch)
      ctx.imageSmoothingQuality = 'high'
      ctx.globalAlpha = 1
      ctx.drawImage(images[a], dx, dy, dw, dh)
      if (b >= 0) {
        ctx.globalAlpha = mix
        ctx.drawImage(images[b], dx, dy, dw, dh)
        ctx.globalAlpha = 1
      }

      // Feather the frame's edges into the band colour behind the canvas.
      ctx.globalCompositeOperation = 'destination-in'
      const gx = ctx.createLinearGradient(dx, 0, dx + dw, 0)
      const fx = Math.min(FEATHER_X / dw, 0.5)
      gx.addColorStop(0, 'rgba(0,0,0,0)')
      gx.addColorStop(fx, 'rgba(0,0,0,1)')
      gx.addColorStop(1 - fx, 'rgba(0,0,0,1)')
      gx.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gx
      ctx.fillRect(0, 0, cw, ch)
      const gy = ctx.createLinearGradient(0, dy, 0, dy + dh)
      gy.addColorStop(0, 'rgba(0,0,0,1)')
      gy.addColorStop(1 - Math.min(FEATHER_BOTTOM / dh, 0.5), 'rgba(0,0,0,1)')
      gy.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gy
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalCompositeOperation = 'source-over'

      if (!drewOnce && a === i) {
        drewOnce = true
        if (posterRef.current) posterRef.current.style.visibility = 'hidden'
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(sticky)
    resize()

    if (reduced) {
      film.classList.add('static')
      const last = ENTRIES.length - 1
      load(last)
      images[last].addEventListener('load', () => draw(TOTAL))
      const intro = introRef.current
      const outro = outroRef.current
      if (intro) intro.style.opacity = '0'
      if (outro) {
        outro.style.opacity = '1'
        outro.style.pointerEvents = 'auto'
      }
      if (hintRef.current) hintRef.current.style.opacity = '0'
      return () => ro.disconnect()
    }

    // Poster first; the rest once the page has settled, in playback order.
    load(0)
    const loadRest = () => ENTRIES.forEach((_, i) => i > 0 && load(i))
    if (document.readyState === 'complete') loadRest()
    else addEventListener('load', loadRest, { once: true })

    let target = 0
    let cur = 0
    let drawn = -1
    let raf = 0

    const measure = () => {
      const total = film.offsetHeight - innerHeight
      target = clamp(-film.getBoundingClientRect().top / total, 0, 1)
    }

    const tick = () => {
      cur += (target - cur) * 0.14
      if (Math.abs(target - cur) < 0.0004) cur = target

      if (dirty || cur !== drawn) {
        draw(Math.min(cur * TOTAL, TOTAL - 1e-6))
        drawn = cur
        dirty = false
      }

      if (barRef.current) barRef.current.style.transform = `scaleX(${cur.toFixed(4)})`

      CAPTIONS.forEach((cap, i) => {
        const c = capRefs.current[i]
        if (!c) return
        const vis = range(cur, cap.from - FADE, cap.from) * (1 - range(cur, cap.to, cap.to + FADE))
        c.style.opacity = String(vis)
        c.style.transform = `translateY(${((1 - vis) * 14).toFixed(1)}px)`
      })

      const intro = introRef.current
      if (intro) {
        const v = 1 - range(cur, INTRO_OUT[0], INTRO_OUT[1])
        intro.style.opacity = String(v)
        intro.style.transform = `translateY(${((1 - v) * -22).toFixed(1)}px)`
        intro.style.pointerEvents = v > 0.5 ? 'auto' : 'none'
      }

      if (hintRef.current) hintRef.current.style.opacity = String(1 - range(cur, 0.005, 0.02))

      const glint = glintRef.current
      if (glint) {
        const g = range(cur, GLINT[0], GLINT[1])
        glint.style.opacity = g > 0.02 && g < 0.98 ? '0.9' : '0'
        glint.style.transform = `translateX(${(-120 + g * 520).toFixed(1)}%) skewX(-18deg)`
      }

      if (glowRef.current) glowRef.current.style.opacity = String(range(cur, OUTRO_IN[0], OUTRO_IN[1]))

      const outro = outroRef.current
      if (outro) {
        const v = range(cur, OUTRO_IN[0], OUTRO_IN[1])
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
      ro.disconnect()
      removeEventListener('scroll', measure)
      removeEventListener('resize', measure)
      removeEventListener('load', loadRest)
    }
  }, [])

  const frameVars = {
    '--iw': IW,
    '--ih': IH,
    '--sx': SAFE.x,
    '--sy': SAFE.y,
    '--sw': SAFE.w,
    '--sh': SAFE.h,
    '--film-top': BG.top,
    '--film-bottom': BG.bottom,
    '--feather-x': `${FEATHER_X}px`,
    '--feather-bottom': `${FEATHER_BOTTOM}px`,
  } as CSSProperties

  return (
    <section className="film" id="repair-film" ref={filmRef} aria-label={t('ariaLabel')} style={frameVars}>
      <div className="film-sticky" ref={stickyRef}>
        <img
          ref={posterRef}
          className="film-poster"
          src={ENTRIES[0].src}
          alt={t('posterAlt')}
          fetchPriority="high"
          decoding="async"
        />
        <canvas className="film-canvas" ref={canvasRef} aria-hidden="true" />
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
        <div className="film-hint" ref={hintRef}>
          {t('hint')}{' '}
          <svg>
            <use href="#i-arrow" />
          </svg>
        </div>
        <div className="film-bar">
          <i ref={barRef} />
        </div>
      </div>
    </section>
  )
}

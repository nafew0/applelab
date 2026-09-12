'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Homepage scroll choreography: reveals `.reveal`/`.stagger` blocks as they
 * enter the viewport and counts the trust-bar numbers up on first sight.
 * Renders nothing — it only wires observers onto the already-rendered DOM.
 */
export default function HomeEffects() {
  const pathname = usePathname()
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el))

    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.count || '0', 10)
          const suffix = el.dataset.suffix || ''
          const duration = 1500
          const start = performance.now()
          const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            el.textContent =
              Math.floor(eased * target).toLocaleString() + (t === 1 ? suffix : '')
            if (t < 1) requestAnimationFrame(step)
            else el.textContent = target.toLocaleString() + suffix
          }
          requestAnimationFrame(step)
          countIO.unobserve(el)
        })
      },
      { threshold: 0.4 },
    )
    document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el))

    return () => {
      io.disconnect()
      countIO.disconnect()
    }
  }, [pathname])

  return null
}

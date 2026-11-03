import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSettings } from '../contexts/SettingsContext'
import { sampleGlyphs, buildParticleField, clamp01, easeInOut } from '../utils/particle-text'
import glowImg from '../assets/glow.jpg'
import SnowEffect from './SnowEffect'

gsap.registerPlugin(ScrollTrigger)

// How much viewport height the splash scrolls away for progress 0 → 1.
const EXIT = '+=85%'

// Exit windows. These mirror the numbers in theme.css — the CSS decides what
// is visible, this file only keeps the particles glued to the text.
const APPEAR = [0.1, 0.14]
const FLY = [0.28, 0.5]
const SETTLE = [0.78, 0.16]
const SINK_RATE = 3.2 // progress where the 20vh sink has fully played out
const SINK_VH = 0.2 // 20vh, matches .splash-content in theme.css

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function HomeSplash({ scroller }) {
  const { settings } = useSettings()
  // Top banner comes from content config (banner_image, e.g. /images/banner.jpg);
  // falls back to the bundled glow asset while the field is empty.
  const bannerSrc = settings?.banner_image || glowImg
  const subtitle = settings?.site_subtitle || '记录技术与热爱的角落'
  const siteTitle = settings?.site_title || "风予's Blog"

  const splashRef = useRef(null)
  const titleRef = useRef(null)
  const canvasRef = useRef(null)
  const triggerRef = useRef(null)
  const progressRef = useRef(0)
  const snowProgress = useRef(0)

  // Scroll position → one CSS variable. Everything visible on the splash and
  // in the navbar is derived from it in CSS, so timings can be tuned without
  // touching this component.
  useEffect(() => {
    const el = splashRef.current
    const scrollerEl = scroller?.current
    if (!el || !scrollerEl) return

    const root = document.documentElement

    const trigger = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerEl,
      start: 'top top',
      end: EXIT,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        progressRef.current = self.progress
        snowProgress.current = self.progress
        root.style.setProperty('--splash-p', self.progress.toFixed(4))
      },
    })

    triggerRef.current = trigger

    return () => {
      trigger.kill()
      triggerRef.current = null
      root.style.removeProperty('--splash-p')
    }
  }, [scroller])

  // Scroll once and the exit plays itself out. Downward input is absorbed while
  // it runs, but scrolling *up* aborts immediately and hands control back — the
  // read can always back out instead of being carried to the end.
  useEffect(() => {
    const scrollerEl = scroller?.current
    if (!scrollerEl || prefersReducedMotion()) return

    let raf = 0
    let playing = false
    let armed = true
    let savedBehavior = null
    let touchY = 0

    const onWheel = e => {
      if (!playing) return
      if (e.deltaY < 0) {
        abort()
        return
      }
      e.preventDefault()
    }

    const onTouchStart = e => {
      if (!playing || !e.touches.length) return
      touchY = e.touches[0].clientY
    }

    const onTouchMove = e => {
      if (!playing || !e.touches.length) return
      // 手指往下拖 = 内容往回滚，当成“反悔”
      if (e.touches[0].clientY - touchY > 6) {
        abort()
        return
      }
      e.preventDefault()
    }

    const onKeyDown = e => {
      if (!playing) return
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.code)) {
        abort()
        return
      }
      if (['Space', 'PageDown', 'ArrowDown', 'End'].includes(e.code)) e.preventDefault()
    }

    const detach = () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      if (savedBehavior !== null) {
        scrollerEl.style.scrollBehavior = savedBehavior
        savedBehavior = null
      }
      playing = false
    }

    const abort = () => {
      cancelAnimationFrame(raf)
      detach()
    }

    const play = () => {
      const trigger = triggerRef.current
      const el = splashRef.current
      if (!trigger || !el) return

      const maxScroll = scrollerEl.scrollHeight - scrollerEl.clientHeight
      // Land on the first magazine page, not at the 85% point where the splash
      // has merely finished fading — otherwise the next section stays 15%
      // down the screen and the page looks parked mid-scroll.
      const to = Math.min(el.offsetHeight, maxScroll)
      const from = scrollerEl.scrollTop
      if (to - from < 8) return

      playing = true
      armed = false
      // .page-scroll-container sets scroll-behavior: smooth; driving scrollTop
      // every frame with that on turns the whole thing into a fight.
      savedBehavior = scrollerEl.style.scrollBehavior
      scrollerEl.style.scrollBehavior = 'auto'

      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('keydown', onKeyDown)

      const start = performance.now()
      const duration = 1150

      const step = now => {
        if (!playing) return
        const t = Math.min(1, (now - start) / duration)
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        scrollerEl.scrollTop = from + (to - from) * eased
        if (t < 1) {
          raf = requestAnimationFrame(step)
          return
        }
        detach()
      }
      raf = requestAnimationFrame(step)
    }

    const onScroll = () => {
      if (playing) return
      const trigger = triggerRef.current
      if (!trigger) return
      const scrollTop = scrollerEl.scrollTop
      // Re-arm at the very top so a second visit to the top behaves the same.
      if (scrollTop < 8) {
        armed = true
        return
      }
      if (!armed) return
      const progress = scrollTop / Math.max(1, trigger.end - trigger.start)
      if (progress < 0.03) return
      if (progress >= 0.995) {
        armed = false
        return
      }
      play()
    }

    scrollerEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollerEl.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      detach()
    }
  }, [scroller])

  // The title dissolves into particles that re-form as the navbar wordmark.
  // Skipped for reduced motion — the CSS fade still works on its own.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || prefersReducedMotion()) return
    const ctx = canvas.getContext('2d')

    let field = null
    let raf = 0
    let width = 0
    let height = 0
    let painted = false
    let cancelled = false

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const build = () => {
      const titleEl = titleRef.current
      const brandEl = document.querySelector('.nav-brand-text')
      // Sampling while scrolled would bake wrong offsets into the field.
      if (!titleEl || !brandEl || (scroller?.current?.scrollTop ?? 0) > 2) return
      const from = sampleGlyphs(titleEl, titleEl.textContent.trim(), 2)
      const to = sampleGlyphs(brandEl, brandEl.textContent.trim(), 1.4)
      if (!from.length || !to.length) return
      field = buildParticleField(from, to, width < 760 ? 520 : 1100, Math.min(190, height * 0.18))
    }

    const clear = () => {
      if (!painted) return
      ctx.clearRect(0, 0, width, height)
      painted = false
    }

    const draw = time => {
      raf = requestAnimationFrame(draw)
      const p = progressRef.current
      if (!field || p <= 0.05 || p >= 0.97) {
        clear()
        return
      }

      const appear = clamp01((p - APPEAR[0]) / APPEAR[1])
      const fly = clamp01((p - FLY[0]) / FLY[1])
      const settle = clamp01((p - SETTLE[0]) / SETTLE[1])
      const alpha = appear * (1 - settle)
      if (alpha <= 0.02) {
        clear()
        return
      }

      const ease = easeInOut(fly)
      const scrollTop = scroller?.current?.scrollTop ?? 0
      // Keep the particles riding the sinking text until they take off.
      const sinkPx = clamp01(p * SINK_RATE) * height * SINK_VH
      const scatter = Math.sin(Math.PI * fly) + 0.12 * appear * (1 - fly)

      ctx.clearRect(0, 0, width, height)
      painted = true

      for (const q of field) {
        const follow = 1 - ease
        const originY = q.fy + sinkPx * follow - scrollTop * follow
        const wobble = Math.sin(time * 0.0012 + q.jitter) * 9 * follow
        const x = q.fx + (q.tx - q.fx) * ease + q.sx * scatter + wobble
        const y = originY + (q.ty - originY) * ease + q.sy * scatter
        const size = q.size * (1 - ease * 0.45) * (1 + 0.35 * appear * (1 - ease))
        ctx.fillStyle = `rgba(244, 238, 246, ${(alpha * (0.55 + 0.45 * (1 - scatter))).toFixed(3)})`
        ctx.fillRect(x, y, size, size)
      }
    }

    resize()
    build()
    raf = requestAnimationFrame(draw)

    const onResize = () => {
      resize()
      if (progressRef.current < 0.02) {
        field = null
        build()
      }
    }
    window.addEventListener('resize', onResize)

    // The glyph mask is only correct once the webfont has loaded.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (cancelled || progressRef.current >= 0.02) return
        field = null
        build()
      })
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [scroller])

  return (
    <div ref={splashRef} className="home-splash">
      <img src={bannerSrc} alt="" className="splash-bg" />
      <div className="splash-overlay" />
      <SnowEffect progressRef={snowProgress} />
      <div className="splash-content">
        <span className="splash-badge">✦ BLOG ✦</span>
        <h1 ref={titleRef} className="splash-title">{siteTitle}</h1>
        <div className="splash-divider" />
        <p className="splash-subtitle">{subtitle}</p>
      </div>
      <div className="splash-scroll-hint">SCROLL ↓</div>
      <canvas ref={canvasRef} className="splash-particles" aria-hidden="true" />
    </div>
  )
}

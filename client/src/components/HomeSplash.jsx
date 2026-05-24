import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import glowImg from '../assets/glow.jpg'
import SnowEffect from './SnowEffect'

gsap.registerPlugin(ScrollTrigger)

export default function HomeSplash({ scroller }) {
  const splashRef = useRef(null)
  const snowProgress = useRef(0)

  useEffect(() => {
    const el = splashRef.current
    const scrollerEl = scroller?.current
    if (!el || !scrollerEl) return

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerEl,
      start: 'top top',
      end: '+=80%',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const p = self.progress
        snowProgress.current = p
        const right = 100 - p * 100
        const bottom = 100 - p * 100
        el.style.clipPath = `polygon(0% 0%, 100% 0%, ${right}% ${bottom}%, 0% 100%)`
        el.style.opacity = 1 - p
      },
    })

    return () => st.kill()
  }, [scroller])

  return (
    <div ref={splashRef} className="home-splash">
      <img src={glowImg} alt="" className="splash-bg" />
      <div className="splash-overlay" />
      <SnowEffect progressRef={snowProgress} />
      <div className="splash-content">
        <span className="splash-badge">✦ BLOG ✦</span>
        <h1 className="splash-title">风予's Blog</h1>
        <div className="splash-divider" />
        <p className="splash-subtitle">记录技术与热爱的角落</p>
      </div>
      <div className="splash-scroll-hint">SCROLL ↓</div>
    </div>
  )
}

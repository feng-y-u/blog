import { useSettings } from '../contexts/SettingsContext'

export default function Banner() {
  const { settings } = useSettings()
  const title = settings?.site_title || "✦ Yuki's Blog"
  const subtitle = settings?.site_subtitle || 'コードとアニメの世界'
  const hasCustomBanner = settings?.banner_image

  function highlightLastWord(text) {
    const i = text.lastIndexOf(' ')
    return i > 0 ? <>{text.slice(0, i)} <span style={{ color: 'var(--accent)' }}>{text.slice(i + 1)}</span></> : text
  }

  return (
    <div style={{
      width: '100%',
      height: 'var(--banner-h)',
      position: 'relative',
      overflow: 'hidden',
      background: hasCustomBanner
        ? `url(${settings.banner_image}) center/cover no-repeat`
        : 'linear-gradient(180deg, #0b0b2b 0%, #1a1a3e 20%, #2a1a3e 40%, #1a2a3e 55%, #1a1a2a 75%, #0d0d14 100%)',
    }}>
      <style>{`
        .banner-stars::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(2px 2px at 15% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 35% 12%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(2px 2px at 55% 25%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 72% 18%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(2px 2px at 88% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 25% 35%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 28%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(2px 2px at 68% 40%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 8% 45%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 92% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(2px 2px at 50% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 15%, rgba(0,212,255,0.2) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 78% 22%, rgba(0,212,255,0.15) 0%, transparent 100%);
        }
        .banner-stars::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 80px;
          background: linear-gradient(0deg, var(--bg) 0%, transparent 100%);
        }
        [data-theme="light"] .banner-stars {
          background: linear-gradient(180deg, #3a5a8a 0%, #5a7aaa 20%, #7a9aba 40%, #9abaca 55%, #c0d8e0 75%, var(--bg) 100%);
        }
        [data-theme="light"] .banner-stars::before {
          background:
            radial-gradient(2px 2px at 15% 20%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 35% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(2px 2px at 55% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 72% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(2px 2px at 88% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 25% 35%, rgba(255,255,255,0.5) 0%, transparent 100%);
        }
      `}</style>

      {/* 星星容器 */}
      <div className="banner-stars" style={{
        position: 'absolute', inset: 0,
      }} />

      {/* 月球 */}
      <div style={{
        position: 'absolute', top: '40px', right: '18%',
        width: '60px', height: '60px', borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fffde8, #f0e6a0)',
        boxShadow: '0 0 40px rgba(240, 230, 160, 0.3), 0 0 80px rgba(240, 230, 160, 0.1)',
      }} />

      {/* 城市剪影 (SVG mask) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
        maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 100\'%3E%3Crect x=\'0\' y=\'60\' width=\'40\' height=\'40\'/%3E%3Crect x=\'50\' y=\'40\' width=\'35\' height=\'60\'/%3E%3Crect x=\'95\' y=\'50\' width=\'30\' height=\'50\'/%3E%3Crect x=\'135\' y=\'25\' width=\'45\' height=\'75\'/%3E%3Crect x=\'190\' y=\'45\' width=\'40\' height=\'55\'/%3E%3Crect x=\'245\' y=\'30\' width=\'50\' height=\'70\'/%3E%3Crect x=\'310\' y=\'55\' width=\'35\' height=\'45\'/%3E%3Crect x=\'360\' y=\'20\' width=\'60\' height=\'80\'/%3E%3Crect x=\'435\' y=\'50\' width=\'30\' height=\'50\'/%3E%3Crect x=\'475\' y=\'35\' width=\'55\' height=\'65\'/%3E%3Crect x=\'545\' y=\'60\' width=\'40\' height=\'40\'/%3E%3Crect x=\'600\' y=\'15\' width=\'50\' height=\'85\'/%3E%3Crect x=\'665\' y=\'40\' width=\'35\' height=\'60\'/%3E%3Crect x=\'715\' y=\'50\' width=\'45\' height=\'50\'/%3E%3Crect x=\'775\' y=\'25\' width=\'55\' height=\'75\'/%3E%3Crect x=\'845\' y=\'55\' width=\'30\' height=\'45\'/%3E%3Crect x=\'885\' y=\'30\' width=\'60\' height=\'70\'/%3E%3Crect x=\'960\' y=\'45\' width=\'40\' height=\'55\'/%3E%3Crect x=\'1010\' y=\'20\' width=\'50\' height=\'80\'/%3E%3Crect x=\'1075\' y=\'55\' width=\'35\' height=\'45\'/%3E%3Crect x=\'1125\' y=\'40\' width=\'45\' height=\'60\'/%3E%3C/svg%3E")',
        WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 100\'%3E%3Crect x=\'0\' y=\'60\' width=\'40\' height=\'40\'/%3E%3Crect x=\'50\' y=\'40\' width=\'35\' height=\'60\'/%3E%3Crect x=\'95\' y=\'50\' width=\'30\' height=\'50\'/%3E%3Crect x=\'135\' y=\'25\' width=\'45\' height=\'75\'/%3E%3Crect x=\'190\' y=\'45\' width=\'40\' height=\'55\'/%3E%3Crect x=\'245\' y=\'30\' width=\'50\' height=\'70\'/%3E%3Crect x=\'310\' y=\'55\' width=\'35\' height=\'45\'/%3E%3Crect x=\'360\' y=\'20\' width=\'60\' height=\'80\'/%3E%3Crect x=\'435\' y=\'50\' width=\'30\' height=\'50\'/%3E%3Crect x=\'475\' y=\'35\' width=\'55\' height=\'65\'/%3E%3Crect x=\'545\' y=\'60\' width=\'40\' height=\'40\'/%3E%3Crect x=\'600\' y=\'15\' width=\'50\' height=\'85\'/%3E%3Crect x=\'665\' y=\'40\' width=\'35\' height=\'60\'/%3E%3Crect x=\'715\' y=\'50\' width=\'45\' height=\'50\'/%3E%3Crect x=\'775\' y=\'25\' width=\'55\' height=\'75\'/%3E%3Crect x=\'845\' y=\'55\' width=\'30\' height=\'45\'/%3E%3Crect x=\'885\' y=\'30\' width=\'60\' height=\'70\'/%3E%3Crect x=\'960\' y=\'45\' width=\'40\' height=\'55\'/%3E%3Crect x=\'1010\' y=\'20\' width=\'50\' height=\'80\'/%3E%3Crect x=\'1075\' y=\'55\' width=\'35\' height=\'45\'/%3E%3Crect x=\'1125\' y=\'40\' width=\'45\' height=\'60\'/%3E%3C/svg%3E")',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.1))',
        pointerEvents: 'none',
      }} />

      {/* 标题 */}
      <div style={{
        position: 'absolute', bottom: '80px', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(24px, 3.5vw, 42px)',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: '0.08em',
        textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        zIndex: 2, whiteSpace: 'nowrap',
      }}>
        {highlightLastWord(title)}
      </div>

      {/* 副标题 */}
      <div style={{
        position: 'absolute', bottom: '52px', left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.3em',
        zIndex: 2,
        fontFamily: 'var(--font-mono)',
      }}>
        {subtitle}
      </div>
    </div>
  )
}

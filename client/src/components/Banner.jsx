import { useSettings } from '../contexts/SettingsContext'

export default function Banner({ searchSlot }) {
  const { settings } = useSettings()
  const title = settings?.site_title || "✦ Yuki's Blog"
  const subtitle = settings?.site_subtitle || 'コードとアニメの世界'
  const hasCustomBanner = settings?.banner_image

  return (
    <div style={{
      width: '100%',
      height: hasCustomBanner ? 'var(--banner-h)' : '200px',
      position: 'relative',
      overflow: 'hidden',
      background: hasCustomBanner
        ? `url(${settings.banner_image}) center/cover no-repeat`
        : 'linear-gradient(160deg, #0d0d2b 0%, #1a1a4e 25%, #3a2a5e 45%, #2a3a5e 60%, #1a1a2a 80%, #0d0d14 100%)',
    }}>
      {/* 底部渐隐 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '60px',
        background: 'linear-gradient(0deg, var(--bg) 0%, transparent 100%)',
        zIndex: 1,
      }} />

      {/* 新月装饰 */}
      <div style={{
        position: 'absolute', top: '36px', right: '20%',
        width: '44px', height: '44px',
        borderRadius: '50%',
        boxShadow: '6px -4px 0 0 rgba(255,255,220,0.5)',
        opacity: 0.5,
      }} />

      {/* 标题 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3vw, 36px)',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.06em',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.35)',
          marginTop: '8px',
          letterSpacing: '0.3em',
          fontFamily: 'var(--font-mono)',
        }}>
          {subtitle}
        </div>
      </div>

      {/* 搜索栏 */}
      {searchSlot && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(420px, 80%)',
          zIndex: 2,
        }}>
          {searchSlot}
        </div>
      )}
    </div>
  )
}

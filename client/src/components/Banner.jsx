export default function Banner() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 'var(--banner-h)',
        background: 'linear-gradient(135deg, #0d0d14 0%, #1a1a3e 30%, #0d0d14 70%)',
      }}
    >
      {/* 星星效果 */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 160px 30px, #ddd, transparent),
          radial-gradient(1px 1px at 200px 60px, #fff, transparent),
          radial-gradient(2px 2px at 250px 20px, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 300px 90px, #eee, transparent),
          radial-gradient(2px 2px at 350px 40px, #fff, transparent),
          radial-gradient(1px 1px at 400px 70px, rgba(255,255,255,0.5), transparent),
          radial-gradient(2px 2px at 450px 25px, #ddd, transparent),
          radial-gradient(1px 1px at 500px 85px, #fff, transparent),
          radial-gradient(2px 2px at 550px 35px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 600px 50px, #eee, transparent),
          radial-gradient(2px 2px at 650px 65px, transparent, transparent),
          radial-gradient(1px 1px at 700px 30px, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 750px 75px, #fff, transparent),
          radial-gradient(1px 1px at 800px 45px, #ddd, transparent),
        `,
      }} />

      {/* 月球 */}
      <div className="absolute" style={{
        top: '40px',
        right: '15%',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f5f5dc, #e8d5a3)',
        boxShadow: '0 0 40px rgba(245, 245, 220, 0.3), 0 0 80px rgba(245, 245, 220, 0.1)',
      }} />

      {/* 城市剪影 */}
      <div className="absolute bottom-0 left-0 right-0 h-20" style={{
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.3))',
      }}>
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-full" style={{ opacity: 0.4 }}>
          <rect x="0" y="60" width="40" height="20" fill="#0d0d14" />
          <rect x="40" y="45" width="25" height="35" fill="#0d0d14" />
          <rect x="65" y="55" width="30" height="25" fill="#0d0d14" />
          <rect x="95" y="35" width="20" height="45" fill="#0d0d14" />
          <rect x="150" y="50" width="35" height="30" fill="#0d0d14" />
          <rect x="185" y="40" width="15" height="40" fill="#0d0d14" />
          <rect x="200" y="55" width="40" height="25" fill="#0d0d14" />
          <rect x="280" y="45" width="30" height="35" fill="#0d0d14" />
          <rect x="310" y="55" width="20" height="25" fill="#0d0d14" />
          <rect x="370" y="35" width="25" height="45" fill="#0d0d14" />
          <rect x="395" y="50" width="40" height="30" fill="#0d0d14" />
          <rect x="460" y="55" width="35" height="25" fill="#0d0d14" />
          <rect x="495" y="40" width="20" height="40" fill="#0d0d14" />
          <rect x="550" y="50" width="30" height="30" fill="#0d0d14" />
          <rect x="580" y="60" width="45" height="20" fill="#0d0d14" />
          <rect x="650" y="45" width="20" height="35" fill="#0d0d14" />
          <rect x="670" y="55" width="35" height="25" fill="#0d0d14" />
          <rect x="740" y="40" width="30" height="40" fill="#0d0d14" />
          <rect x="770" y="50" width="15" height="30" fill="#0d0d14" />
          <rect x="820" y="55" width="40" height="25" fill="#0d0d14" />
          <rect x="900" y="45" width="25" height="35" fill="#0d0d14" />
          <rect x="925" y="55" width="30" height="25" fill="#0d0d14" />
          <rect x="1000" y="40" width="35" height="40" fill="#0d0d14" />
          <rect x="1035" y="50" width="20" height="30" fill="#0d0d14" />
          <rect x="1100" y="55" width="30" height="25" fill="#0d0d14" />
          <rect x="1130" y="45" width="40" height="35" fill="#0d0d14" />
          <rect x="1170" y="60" width="30" height="20" fill="#0d0d14" />
        </svg>
      </div>

      {/* 标题 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-4xl font-bold tracking-wide" style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          background: 'linear-gradient(135deg, #fff 0%, #00d4ff 50%, #fff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
        }}>
          Yuki's Blog
        </h1>
        <p className="text-sm mt-2 tracking-widest" style={{ color: 'var(--fg-secondary)' }}>
          代码与动漫的世界
        </p>
      </div>
    </div>
  )
}

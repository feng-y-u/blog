import { useRef } from 'react'

// Parses an object-position value ("50% 30%") into [x, y] percentages;
// anything else (empty, "top", ...) falls back to center.
function parsePos(v) {
  const m = String(v || '').match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
  return m ? [Number(m[1]), Number(m[2])] : [50, 50]
}

const PRESETS = [
  ['顶部', '50% 0%'],
  ['居中', '50% 50%'],
  ['底部', '50% 100%'],
]

// Cover focal-point adjuster: a card-proportioned (8:3) crop preview with a
// draggable crosshair plus preset buttons. Emits object-position strings.
export default function CoverFocalPicker({ src, value, onChange }) {
  const [x, y] = parsePos(value)
  const boxRef = useRef(null)
  const draggingRef = useRef(false)

  function moveTo(clientX, clientY) {
    const rect = boxRef.current.getBoundingClientRect()
    const px = Math.round(((clientX - rect.left) / rect.width) * 100)
    const py = Math.round(((clientY - rect.top) / rect.height) * 100)
    onChange(`${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%`)
  }

  return (
    <div>
      <div
        ref={boxRef}
        style={{
          position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '8 / 3',
          overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)',
          cursor: 'crosshair', userSelect: 'none', touchAction: 'none', background: 'var(--bg)',
        }}
        onPointerDown={e => { draggingRef.current = true; moveTo(e.clientX, e.clientY) }}
        onPointerMove={e => { if (draggingRef.current) moveTo(e.clientX, e.clientY) }}
        onPointerUp={() => { draggingRef.current = false }}
        onPointerLeave={() => { draggingRef.current = false }}
      >
        <img src={src} alt="焦点预览" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: `${x}% ${y}%`, display: 'block', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, width: 18, height: 18,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(0,0,0,0.4)',
          background: 'rgba(232,93,138,0.55)', pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {PRESETS.map(([label, p]) => (
          <button key={label} type="button" className="writer-btn"
            style={{ cursor: 'pointer', background: value === p ? 'var(--accent-dim)' : 'var(--surface)' }}
            onClick={() => onChange(p)}>{label}</button>
        ))}
        <button type="button" className="writer-btn"
          style={{ cursor: 'pointer', background: 'var(--surface)' }}
          onClick={() => onChange('50% 50%')}>重置</button>
        <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>焦点：{x}% {y}%</span>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { updateSettings } from '../../api/settings'
import Loading from '../../components/Loading'

const FIELDS = [
  { key: 'site_title', label: '网站标题', type: 'text' },
  { key: 'site_subtitle', label: '网站副标题', type: 'text' },
  { key: 'banner_image', label: 'Banner 图片 URL（留空使用默认渐变背景）', type: 'text' },
  { key: 'avatar_emoji', label: '头像 Emoji', type: 'text' },
  { key: 'profile_name', label: '显示名称', type: 'text' },
  { key: 'profile_signature', label: '个性签名', type: 'text' },
  { key: 'profile_bio', label: '个人简介（支持 \\n 换行）', type: 'textarea' },
  { key: 'social_links', label: '社交链接（JSON 格式，如 {"github":"https://github.com/xxx","bilibili":"https://space.bilibili.com/xxx"}）', type: 'textarea' },
]

export default function AppearanceSettings() {
  const { settings, error, reload } = useSettings()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [jsonError, setJsonError] = useState(null)

  useEffect(() => {
    if (settings) {
      const initial = {}
      for (const f of FIELDS) {
        initial[f.key] = settings[f.key] || ''
      }
      setForm(initial)
    }
  }, [settings])

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'social_links') {
      try { JSON.parse(value); setJsonError(null) } catch { setJsonError('JSON 格式无效') }
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (jsonError) return
    setSaving(true)
    setMessage(null)
    try {
      const data = {}
      for (const f of FIELDS) {
        data[f.key] = form[f.key] || ''
      }
      await updateSettings(data)
      reload()
      setMessage({ type: 'success', text: '设置已保存' })
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败: ' + (err.message || '未知错误') })
    } finally {
      setSaving(false)
    }
  }

  if (!settings && error) {
    return (
      <div className="admin-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px', color: 'var(--fg-secondary)' }}>设置加载失败，请重试</p>
        <button onClick={reload} className="admin-btn admin-btn-primary">重试</button>
      </div>
    )
  }

  if (!settings) {
    return <Loading />
  }

  return (
    <div>
      <h1 className="admin-page-title">外观设置</h1>

      {message && (
        <div className="admin-card" style={{ padding: '12px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="admin-card" style={{ maxWidth: '672px' }}>
        {FIELDS.map(field => (
          <div key={field.key} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea value={form[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                rows={3} className="admin-textarea" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
            ) : (
              <input type="text" value={form[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                className="admin-input" />
            )}
            {field.key === 'social_links' && jsonError && (
              <p style={{ color: 'var(--accent-pink)', fontSize: '12px', marginTop: '4px' }}>{jsonError}</p>
            )}
          </div>
        ))}
        <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ opacity: saving ? 0.5 : 1 }}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </form>

      <div className="admin-card" style={{ maxWidth: '672px', marginTop: '32px' }}>
        <h2 className="admin-card-title">预览</h2>
        <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '36px' }}>{form.avatar_emoji || '🌸'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--fg)' }}>{form.profile_name || '风予'}</div>
            <div style={{ fontSize: '13px', color: 'var(--fg-secondary)', fontStyle: 'italic' }}>{form.profile_signature || ''}</div>
            <div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '4px' }}>{form.site_title || ''}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

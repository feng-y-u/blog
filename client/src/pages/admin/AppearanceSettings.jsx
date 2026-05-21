import { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { updateSettings } from '../../api/settings'

const FIELDS = [
  { key: 'site_title', label: '网站标题', type: 'text' },
  { key: 'site_subtitle', label: '网站副标题', type: 'text' },
  { key: 'banner_image', label: 'Banner 图片 URL（留空使用默认渐变背景）', type: 'text' },
  { key: 'avatar_emoji', label: '头像 Emoji', type: 'text' },
  { key: 'profile_name', label: '显示名称', type: 'text' },
  { key: 'profile_signature', label: '个性签名', type: 'text' },
  { key: 'profile_bio', label: '个人简介（支持 \\n 换行）', type: 'textarea' },
  { key: 'social_links', label: '社交链接（JSON 格式，如 {"github":"https://github.com/xxx","twitter":"https://twitter.com/xxx"}）', type: 'textarea' },
]

export default function AppearanceSettings() {
  const { settings, reload } = useSettings()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

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
  }

  async function handleSave(e) {
    e.preventDefault()
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

  if (!settings) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">外观设置</h1>

      {message && (
        <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5 max-w-2xl">
        {FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea value={form[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono text-sm" />
            ) : (
              <input type="text" value={form[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />
            )}
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存设置'}
        </button>
      </form>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
        <h2 className="font-semibold mb-3">预览</h2>
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded">
          <div className="text-4xl">{form.avatar_emoji || '🌸'}</div>
          <div>
            <div className="font-bold text-lg">{form.profile_name || 'Yuki'}</div>
            <div className="text-sm text-gray-500 italic">{form.profile_signature || ''}</div>
            <div className="text-sm text-gray-400 mt-1">{form.site_title || ''}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

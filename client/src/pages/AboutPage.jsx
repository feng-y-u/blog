import { Helmet } from 'react-helmet-async'
import { useSettings } from '../contexts/SettingsContext'
import ProfileCard from '../components/ProfileCard'
import avatarImg from '../assets/avatar.jpg'

export default function AboutPage() {
  const { settings } = useSettings()
  const name = settings?.profile_name || '风予'
  let socialLinks = {}
  try { socialLinks = JSON.parse(settings?.social_links ?? '{}') } catch {}
  const bio = settings?.profile_bio || ''

  return (
    <div>
      <Helmet>
        <title>关于 — Blog</title>
      </Helmet>
      <h1 className="page-title">关于</h1>
      <div className="card" style={{ padding: '32px' }}>
        <ProfileCard
          avatar={settings?.avatar_image || avatarImg}
          emoji={settings?.avatar_emoji || null}
          name={name}
          socialLinks={socialLinks}
          signature={settings?.profile_signature || ''}
        />
        {bio && (
          <div style={{
            marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)',
            lineHeight: 1.9, color: 'var(--fg-secondary)', whiteSpace: 'pre-line', fontSize: '14px',
          }}>
            {bio}
          </div>
        )}
      </div>
    </div>
  )
}

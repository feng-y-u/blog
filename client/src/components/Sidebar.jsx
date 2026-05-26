import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories, getTags } from '../api/posts'
import { useSettings } from '../contexts/SettingsContext'
import avatarImg from '../assets/avatar.jpg'
import ProfileCard from './ProfileCard'
import NavStats from './NavStats'
import TagList from './TagList'

export default function Sidebar() {
  const { settings } = useSettings()
  const profileName = '风予'
  let socialLinks = {}
  try { socialLinks = JSON.parse(settings?.social_links ?? '{}') } catch {}
  const [stats, setStats] = useState({ posts: '-', categories: '-' })
  const [tags, setTags] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    Promise.all([
      getPosts({ limit: 1 }),
      getCategories(),
      getTags(),
    ]).then(([postsRes, catRes, tagRes]) => {
      setStats({
        posts: postsRes.data.pagination.total,
        categories: catRes.data.data.length,
      })
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    }).catch(err => console.error('Failed to load sidebar data:', err))
  }, [])

  return (
    <aside className="sidebar">
      <ProfileCard avatar={avatarImg} name={profileName} socialLinks={socialLinks} signature={settings?.profile_signature} />
      <NavStats stats={stats} links={[
        { to: '/', label: '文章', key: 'posts' },
        { to: '/categories', label: '分类', key: 'categories' },
      ]} />
      {categories.length > 0 && (
        <div className="sidebar-card">
          <div className="section-title">分类</div>
          <div className="category-list">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="tag-row">
                <span>{cat.name}</span>
                <span>{cat._count?.posts || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {tags.length > 0 && (
        <div className="sidebar-card">
          <div className="section-title">热门标签</div>
          <div className="tag-cloud">
            <TagList tags={tags} getLink={slug => `/tag/${slug}`} />
          </div>
        </div>
      )}
    </aside>
  )
}

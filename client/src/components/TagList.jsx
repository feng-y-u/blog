import { Link } from 'react-router-dom'

export default function TagList({ tags, variant = 'tag', getLink }) {
  if (!tags || tags.length === 0) return null
  return (
    <>
      {tags.map(tag => (
        <Link key={tag.slug} to={getLink(tag.slug)} className={variant === 'row' ? 'tag-row' : 'tag'}>
          {tag.name}
          {variant === 'row' && <span>{tag._count?.posts || 0}</span>}
        </Link>
      ))}
    </>
  )
}

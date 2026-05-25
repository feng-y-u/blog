import MagazineNumbering from './MagazineNumbering'
import MagazineSpread from './MagazineSpread'

export default function MagazinePage({ posts, pageIndex, visibleIndex, postsPerPage = 3 }) {
  const perPage = postsPerPage

  return (
    <div data-index={pageIndex} className="magazine-page">
      <MagazineNumbering side="left">
        {posts.map((post, i) => (
          <div key={post.id} style={{
            height: posts.length >= 2 ? `calc(100vh / ${posts.length})` : '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: i === 0 && posts.length >= 2 ? '20px' : '28px',
              fontWeight: 800,
              color: 'var(--accent-pink-dim)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}>
              {String(pageIndex * perPage + i + 1).padStart(2, '0')}
            </span>
            <span style={{
              fontSize: '9px',
              color: 'var(--fg-muted)',
              letterSpacing: '0.15em',
              writingMode: 'vertical-rl',
              height: '48px',
              opacity: 0.6,
            }}>
              {post.category?.name || 'ARTICLE'}
            </span>
          </div>
        ))}
      </MagazineNumbering>

      <MagazineNumbering side="right">
        <span style={{
          fontSize: '10px',
          color: 'var(--fg-muted)',
          letterSpacing: '0.1em',
          fontFeatureSettings: "'tnum' 1",
        }}>
          — {String(pageIndex + 1).padStart(3, '0')} —
        </span>
      </MagazineNumbering>

      <div className="magazine-content" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        {posts.map((post, i) => (
          <MagazineSpread
            key={post.id}
            post={post}
            index={pageIndex * perPage + i}
            isVisible={pageIndex === visibleIndex}
            compact={posts.length >= 2}
            compactHeight={posts.length >= 2 ? `calc(100vh / ${posts.length})` : undefined}
          />
        ))}
      </div>
    </div>
  )
}

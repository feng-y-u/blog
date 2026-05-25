import PostCard from './PostCard'

export default function RestPosts({ posts, searchTrigger }) {
  return (
    <div className="rest-posts">
      <div className="rest-posts-divider">
        <span style={{ color: 'var(--accent-pink)', marginRight: '8px' }}>✦</span>
        More articles
        <span style={{ color: 'var(--accent-pink)', marginLeft: '8px' }}>✦</span>
      </div>

      <div className="rest-posts-list">
        {searchTrigger}

        <div className="post-list">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}

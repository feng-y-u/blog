export default function ArticleToolbar({ author, viewCount, fontSize, onFontSizeChange }) {
  const sizes = { small: 'S', medium: 'M', large: 'L' }

  return (
    <div className="article-toolbar">
      <span>{author || '风予'}</span>
      <span>·</span>
      <span>阅读量 {viewCount}</span>
      <span className="article-toolbar-spacer">
        {Object.entries(sizes).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onFontSizeChange(key)}
            className={`icon-btn${fontSize === key ? ' active' : ''}`}
          >
            {label}
          </button>
        ))}
      </span>
    </div>
  )
}

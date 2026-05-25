export default function SearchInput({ value, onChange, onSearch }) {
  return (
    <div className="search-input-wrapper">
      <svg className="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && onSearch?.(value)}
        placeholder="搜索文章标题或内容..."
        className="search-input"
      />
    </div>
  )
}

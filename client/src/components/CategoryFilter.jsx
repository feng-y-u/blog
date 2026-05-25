export default function CategoryFilter({ categories, activeCategory, onCategoryClick }) {
  if (!categories || categories.length === 0) return null
  return (
    <div className="category-filter">
      <button
        onClick={() => onCategoryClick('')}
        className={`filter-btn${!activeCategory ? ' active' : ''}`}
      >
        全部
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onCategoryClick(cat.slug)}
          className={`filter-btn${activeCategory === cat.slug ? ' active' : ''}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

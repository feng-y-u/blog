export function extractTOC(content) {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/[`*_~]/g, '').trim()
    headings.push({
      level: match[1].length,
      text,
      id: text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, ''),
    })
  }
  return headings
}

function handleClick(id) {
  return (e) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function TableOfContents({ headings }) {
  if (headings.length < 2) return null

  return (
    <div className="article-toc">
      <div className="article-toc-title">目录</div>
      <ul className="article-toc-list">
        {headings.map(h => (
          <li
            key={h.id}
            className={`article-toc-item article-toc-item-${h.level === 3 ? 'h3' : 'h2'}`}
          >
            <a
              href={`#${h.id}`}
              className="article-toc-link"
              onClick={handleClick(h.id)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

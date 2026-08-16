import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default function ArticleBody({ content, onImageClick }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              loading="lazy"
              onClick={() => onImageClick(src)}
            />
          ),
          pre: ({ children }) => <pre>{children}</pre>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const lang = match ? match[1] : ''
            return (
              <code className={className} {...props}>
                {lang && <span className="lang-tag">{lang}</span>}
                {/* children may be highlighted <span> elements — render them as-is,
                    never String() them (that yields "[object Object]") */}
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

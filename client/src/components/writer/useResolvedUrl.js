import { useState, useEffect } from 'react'
import { resolveImageUrl } from '../../utils/file-system'

// Resolves a site-relative /images/... URL to a blob URL backed by the
// connected content dir handle, so writer previews don't depend on the
// dev-only vite middleware. Returns the input unchanged until resolved
// (and forever, when it isn't an /images/ URL or the file is missing).
export default function useResolvedUrl(dir, url) {
  const [resolved, setResolved] = useState(url)
  useEffect(() => {
    let alive = true
    setResolved(url)
    if (!dir || !/^\/images\//.test(String(url || ''))) return undefined
    resolveImageUrl(dir, url).then(v => {
      if (alive) setResolved(v)
    })
    return () => { alive = false }
  }, [dir, url])
  return resolved
}
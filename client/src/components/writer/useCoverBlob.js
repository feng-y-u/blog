import { useRef, useCallback } from 'react'

// Owns the preview blob URL of a cover picked but not yet saved, so the
// object URL is released exactly once when superseded, removed, or saved.
export default function useCoverBlob() {
  const blobUrlRef = useRef(null)

  const releaseCoverBlob = useCallback(() => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
  }, [])

  return { blobUrlRef, releaseCoverBlob }
}
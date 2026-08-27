import { useRef, useCallback } from 'react'

// Owns the preview blob URL of a cover picked but not yet saved, plus the URL
// of the cover last written by a successful save, so the object URL is
// released exactly once when superseded, removed, or saved, and the replaced
// cover can be cleaned up correctly across repeated saves in one session.
export default function useCoverBlob() {
  const blobUrlRef = useRef(null)
  const lastSavedCoverRef = useRef(null)

  const releaseCoverBlob = useCallback(() => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    lastSavedCoverRef.current = null
  }, [])

  return { blobUrlRef, lastSavedCoverRef, releaseCoverBlob }
}
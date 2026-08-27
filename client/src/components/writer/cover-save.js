// Save-time cover helpers: a picked-but-unsaved cover file is copied into
// content/images/ only here, and a replaced cover file is removed afterward
// unless another post still references it.
import { copyImageTo, deleteImage, revokeImageUrl, isImageReferencedElsewhere } from '../../utils/file-system'

// Copies the pending cover (only for a freshly picked one) into content/images/
// and returns the frontmatter URL to write plus the copied URL (null when the
// cover wasn't changed). Throws when the copy fails — never lets the blob URL
// leak into the saved frontmatter.
export async function copyCoverOnSave(dir, form) {
  if (!form.coverFile) return { coverUrl: form.coverImage, copiedUrl: null }
  const copiedUrl = await copyImageTo(dir, form.coverFile)
  return { coverUrl: copiedUrl, copiedUrl }
}

// Deletes the replaced cover file when no other post references it; returns a
// toast notice (or null) for the caller. Throws surface as save-side cleanup
// failures without failing the save itself.
export async function cleanupReplacedCover(dir, postsDir, { oldCover, copiedUrl, name }) {
  if (!copiedUrl || !oldCover || !/^\/images\//.test(oldCover) || oldCover === copiedUrl) return null
  const oldName = decodeURIComponent(oldCover.replace(/^\/images\//, ''))
  if (await isImageReferencedElsewhere(postsDir, oldName, name)) {
    return `已保存；旧封面被其他文章引用，文件「${oldName}」保留`
  }
  await deleteImage(dir, oldName)
  revokeImageUrl(oldName)
  return null
}
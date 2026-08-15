// Shared slug rules used by both the build script (node) and the writer tool (browser).
// Keep in sync with content/post filename derivation in build-content.mjs.
export function slugify(text) {
  let slug = String(text).toLowerCase().trim()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'untitled'
}

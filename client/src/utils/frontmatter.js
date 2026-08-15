// Minimal frontmatter parser/generator for the writer tool.
// Handles single-line "key: value", inline arrays "tags: [a, b]", comment lines.
// Unknown fields are kept in `data` and re-emitted on save (no data loss).

export function parseFrontmatter(raw) {
  const text = String(raw)
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, order: [], content: text }
  const body = match[1]
  const data = {}
  const order = []
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf(':')
    if (idx === -1) continue
    const key = t.slice(0, idx).trim()
    let value = t.slice(idx + 1).trim()
    const quoted = value.match(/^('|")(.*)\1$/)
    if (quoted) {
      value = quoted[2]
    } else if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      value = value === 'true'
    } else if (/^-?\d+$/.test(value)) {
      value = Number(value)
    } else {
      value = value.replace(/^['"]|['"]$/g, '')
    }
    data[key] = value
    if (!order.includes(key)) order.push(key)
  }
  return { data, order, content: text.slice(match[0].length) }
}

export function stringifyFrontmatter(data, order) {
  const renderValue = v => {
    if (Array.isArray(v)) return `[${v.map(String).join(', ')}]`
    if (typeof v === 'boolean') return String(v)
    if (typeof v === 'number') return String(v)
    const s = String(v).replace(/\n/g, ' ')
    const needsQuote = /^-?\d+$/.test(s) || s === 'true' || s === 'false' || s.includes(':') || s !== s.trim()
    return needsQuote ? `'${s}'` : s
  }
  const lines = ['---']
  for (const key of order) {
    const v = data[key]
    if (v === undefined || v === null) continue
    lines.push(`${key}: ${renderValue(v)}`)
  }
  for (const key of Object.keys(data)) {
    if (!order.includes(key)) lines.push(`${key}: ${renderValue(data[key])}`)
  }
  lines.push('---')
  return lines.join('\n') + '\n'
}

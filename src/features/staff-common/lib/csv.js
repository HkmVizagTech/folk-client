const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

/** Builds a CSV from row arrays and triggers a browser download. `bom` keeps Excel happy with non-ASCII names. */
export const downloadCsv = (filename, rows, { bom = false } = {}) => {
  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([(bom ? '﻿' : '') + csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

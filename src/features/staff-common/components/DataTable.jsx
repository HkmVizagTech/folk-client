import React from 'react'
import { Skeleton } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/**
 * Responsive data table: a real table from md up, a stack of cards on phones.
 * Column: { key, header, cell(row), align?, mobile?: 'title' | 'meta' | 'footer' | 'hidden' }
 * `title` renders as the card heading, `footer` as the action row, `meta` (default) as label/value pairs.
 */
const DataTable = ({ columns, rows, getRowKey, loading, empty, className }) => {
  if (loading) {
    return <div className="space-y-2 px-5 pb-5 sm:px-6" aria-hidden="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
  }
  if (!rows.length) return <div className="px-5 pb-5 sm:px-6">{empty}</div>

  const where = (kind) => columns.filter((c) => (c.mobile || 'meta') === kind)
  const titleCols = where('title')
  const metaCols = where('meta')
  const footerCols = where('footer')

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-y border-line/80 bg-paper/70 text-[12px] font-semibold uppercase tracking-label text-ink-muted">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-3 py-3 font-semibold first:pl-6 last:pr-6', c.align === 'right' && 'text-right')}>
                  {c.header || <span className="sr-only">{c.key}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors hover:bg-paper/60">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 py-3.5 align-middle first:pl-6 last:pr-6', c.align === 'right' && 'text-right')}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 px-5 pb-5 sm:px-6 md:hidden">
        {rows.map((row) => (
          <li key={getRowKey(row)} className="rounded-xl border border-line/80 bg-paper/50 p-4">
            {titleCols.length > 0 && <div className="min-w-0 font-semibold text-ink">{titleCols.map((c) => <div key={c.key}>{c.cell(row)}</div>)}</div>}
            {metaCols.length > 0 && (
              <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-3', titleCols.length > 0 && 'mt-3')}>
                {metaCols.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">{c.header}</dt>
                    <dd className="mt-0.5 text-[14px] text-ink">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {footerCols.length > 0 && <div className="mt-4 flex justify-end gap-2">{footerCols.map((c) => <React.Fragment key={c.key}>{c.cell(row)}</React.Fragment>)}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DataTable

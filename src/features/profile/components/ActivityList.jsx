import React from 'react'
import { Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'

/** Loading / empty / list states shared by the attendance and payment tabs. */
const ActivityList = ({ loading, items, icon, emptyTitle, emptyText, renderRow }) => {
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px]" />)}</div>
  if (!items.length) return <EmptyState icon={icon} title={emptyTitle} description={emptyText} />
  return <ul className="space-y-3">{items.map((it) => <li key={it.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">{renderRow(it)}</li>)}</ul>
}

export default ActivityList

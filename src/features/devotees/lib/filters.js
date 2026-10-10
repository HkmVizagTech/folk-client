import { toDate } from '../../../lib/dates'

// An empty search box must mean "everyone": half-finished records with no name
// or phone still need to be editable, QR-able and deletable.
export const filterDevotees = (devotees, roleFilter, searchTerm) => {
  const term = searchTerm.trim().toLowerCase()
  return devotees.filter((d) =>
    (roleFilter === 'All' || d.role === roleFilter) &&
    (!term || d.name?.toLowerCase().includes(term) || d.phone?.includes(term)))
}

export const summarize = (devotees) => ({
  total: devotees.length,
  staff: devotees.filter((d) => d.role === 'admin' || d.role === 'folks_head').length,
  withQr: devotees.filter((d) => d.qrToken).length,
  recent: devotees.filter((d) => (toDate(d.createdAt)?.getTime() || 0) > Date.now() - 604800000).length,
})

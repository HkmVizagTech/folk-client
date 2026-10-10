import React from 'react'
import { Select } from '../../../components/ui'
import { Toolbar } from '../../staff-common/components'
import { ROLE_FILTERS } from '../lib/levels'

const DevoteeToolbar = ({ search, onSearch, role, onRole, shown, total }) => (
  <Toolbar data-reveal className="mb-6">
    <Toolbar.Search value={search} onChange={onSearch} placeholder="Search by name or phone" />
    <Toolbar.Group className="flex-nowrap">
      <Select aria-label="Filter by role" value={role} onChange={(e) => onRole(e.target.value)} className="min-w-[10rem] sm:w-44">
        {ROLE_FILTERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <span className="hidden whitespace-nowrap text-[13px] text-ink-muted lg:inline">{shown} of {total}</span>
    </Toolbar.Group>
  </Toolbar>
)

export default DevoteeToolbar

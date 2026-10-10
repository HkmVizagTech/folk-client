import React from 'react'
import { Tabs } from '../../../components/ui'
import { CATEGORIES } from '../lib/events'

const CategoryTabs = ({ value, onChange }) => (
  <Tabs value={value} onValueChange={onChange}>
    <Tabs.List aria-label="Filter events by category">
      {CATEGORIES.map((c) => <Tabs.Trigger key={c} value={c}>{c}</Tabs.Trigger>)}
    </Tabs.List>
  </Tabs>
)

export default CategoryTabs

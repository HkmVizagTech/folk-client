import React from 'react'
import * as T from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

/** Compound tabs: <Tabs defaultValue><Tabs.List><Tabs.Trigger/></Tabs.List><Tabs.Panel/></Tabs> */
const Tabs = T.Root
Tabs.List = ({ className, ...p }) => (
  <T.List className={cn('inline-flex max-w-full overflow-x-auto scrollbar-hide gap-1 p-1 rounded-full bg-paper-dark', className)} {...p} />
)
Tabs.Trigger = ({ className, ...p }) => (
  <T.Trigger
    className={cn('h-9 px-4 rounded-full text-[14px] font-semibold text-ink-muted whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-soft hover:text-ink', className)}
    {...p}
  />
)
Tabs.Panel = ({ className, ...p }) => <T.Content className={cn('mt-5 outline-none', className)} {...p} />

export default Tabs

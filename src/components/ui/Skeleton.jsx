import React from 'react'
import { cn } from '../../lib/utils'

const Skeleton = ({ className, ...p }) => <div className={cn('skeleton rounded-xl bg-paper-dark', className)} aria-hidden="true" {...p} />

export default Skeleton

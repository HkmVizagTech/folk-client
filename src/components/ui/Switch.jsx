import React from 'react'
import * as S from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

const Switch = ({ className, ...p }) => (
  <S.Root className={cn('h-6 w-11 shrink-0 rounded-full bg-line transition-colors data-[state=checked]:bg-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2', className)} {...p}>
    <S.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
  </S.Root>
)

export default Switch

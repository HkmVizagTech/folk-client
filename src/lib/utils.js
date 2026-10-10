import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const initials = (name = '') =>
  String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'F'

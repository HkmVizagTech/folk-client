import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/ui';
import { cn } from '../../../lib/utils';

const ChannelBody = ({ icon: Icon, tone, label, value, wrap, linked }) => (
  <>
    <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tone)}>
      <Icon size={22} aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-display text-[16px] font-semibold text-ink">{label}</span>
      <span className={cn('block text-[14px] text-ink-muted', wrap ? 'user-text' : 'truncate')}>{value}</span>
    </span>
    {linked && <ArrowUpRight size={18} className="shrink-0 text-ink-muted transition-colors group-hover:text-saffron-dark" aria-hidden="true" />}
  </>
);

const ChannelList = ({ channels, className }) => (
  <ul data-reveal className={cn('space-y-3', className)}>
    {channels.map((c) => (
      <li key={c.id}>
        {c.href ? (
          <a
            href={c.href}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
          >
            <Card interactive className="flex min-h-[72px] items-center gap-4 !p-4"><ChannelBody {...c} linked /></Card>
          </a>
        ) : (
          <Card className="flex min-h-[72px] items-center gap-4 !p-4"><ChannelBody {...c} /></Card>
        )}
      </li>
    ))}
  </ul>
);

export default ChannelList;

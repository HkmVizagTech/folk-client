import React from 'react';
import { Section } from '../../../components/common';
import { Card } from '../../../components/ui';

const PrinciplesGrid = ({ items }) => (
  <Section title="What FOLK stands for" description="Four ideas that shape everything we do.">
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map(({ icon: Icon, title, body }) => (
        <li key={title}>
          <Card interactive className="flex h-full gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-marigold-light">
              <Icon size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[18px] font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{body}</p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  </Section>
);

export default PrinciplesGrid;

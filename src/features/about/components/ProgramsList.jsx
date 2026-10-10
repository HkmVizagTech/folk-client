import React from 'react';
import { Section } from '../../../components/common';
import { Card } from '../../../components/ui';

const ProgramsList = ({ items }) => (
  <Section title="What we offer" description="Where most newcomers start, and where they go next.">
    <Card padded={false}>
      <ol className="divide-y divide-line/80">
        {items.map((p, i) => (
          <li key={p.key} className="grid gap-1 px-5 py-4 sm:grid-cols-[3rem_14rem_1fr] sm:items-baseline sm:gap-4 sm:px-6">
            <span className="hidden font-display text-[15px] font-semibold text-marigold-dark sm:block">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="font-display text-[17px] font-semibold text-ink">{p.title}</h3>
            <p className="text-[15px] text-ink-muted">{p.body}</p>
          </li>
        ))}
      </ol>
    </Card>
  </Section>
);

export default ProgramsList;

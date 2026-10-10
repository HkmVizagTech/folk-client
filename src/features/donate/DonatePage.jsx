import React from 'react';
import { Page, PageHeader } from '../../components/common';
import { CAUSES } from './lib/causes';
import { useDonation } from './hooks/useDonation';
import CauseCard from './components/CauseCard';
import DonationPanel from './components/DonationPanel';

const DonatePage = () => {
  const d = useDonation();
  return (
    <Page width="max-w-6xl">
      <PageHeader
        kicker="Donations"
        title="Give with devotion"
        description="Every contribution keeps the temple programs, prasadam distribution and Gita education flourishing. Choose a cause and give securely via UPI or card."
      />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-3" role="radiogroup" aria-label="Choose a cause">
          {CAUSES.map((c) => (
            <CauseCard key={c.id} cause={c} selected={d.selected === c.id} onSelect={() => d.selectCause(c)} />
          ))}
        </ul>
        <DonationPanel {...d} className="lg:sticky lg:top-24 lg:col-span-2" />
      </div>
    </Page>
  );
};

export default DonatePage;

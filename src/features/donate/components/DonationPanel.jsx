import React from 'react';
import { Gift, ShieldCheck } from 'lucide-react';
import { Card, Button } from '../../../components/ui';
import { formatINR } from '../lib/causes';
import CauseIcon from './CauseIcon';
import AmountPicker from './AmountPicker';

const DonationPanel = ({ cause, presets, amount, setAmount, paying, canDonate, donate, result, className }) => (
  <Card data-reveal className={className}>
    <div className="flex items-center gap-4">
      <CauseIcon cause={cause} />
      <div className="min-w-0">
        <p className="kicker">Your gift</p>
        <h2 className="font-display text-[20px] font-semibold leading-snug text-navy">{cause.title}</h2>
      </div>
    </div>
    <div className="my-5 h-px bg-gradient-to-r from-marigold/60 via-line to-transparent" aria-hidden="true" />

    <AmountPicker presets={presets} amount={amount} onChange={setAmount} />

    <Button size="lg" className="mt-6 w-full" onClick={donate} loading={paying} disabled={!canDonate}>
      {paying ? 'Opening payment...' : <><Gift size={17} aria-hidden="true" /> Donate {formatINR(amount)}</>}
    </Button>

    {result && (
      <p role={result.tone === 'err' ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-[15px] ${result.tone === 'err' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
        {result.text}
      </p>
    )}

    <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-ink-muted">
      <ShieldCheck size={15} className="text-marigold-dark" aria-hidden="true" /> Secure payments by Razorpay · UPI, cards and net-banking
    </p>
  </Card>
);

export default DonationPanel;

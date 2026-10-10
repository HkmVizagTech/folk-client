import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Section } from '../../../components/common';
import { Button } from '../../../components/ui';

const QuestionCta = ({ href }) => {
  if (!href) return null;
  return (
    <Section className="mb-0">
      <div className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-white shadow-premium-xl sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="font-display text-[22px] font-semibold">Have a question?</h2>
          <p className="mt-1 text-white/70">Message the FOLK Vizag team on WhatsApp.</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <a href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp us</a>
        </Button>
      </div>
    </Section>
  );
};

export default QuestionCta;

import React from 'react';
import { Section } from '../../../components/common';

const AboutIntro = ({ parent }) => (
  <Section className="grid gap-6 lg:grid-cols-5 lg:gap-10">
    <div className="space-y-4 text-[16px] sm:text-[17px] leading-relaxed text-ink-soft lg:col-span-3">
      <p>
        FOLK is the youth program of the Hare Krishna Movement. It was started to give young people a
        place to explore life&apos;s bigger questions, using the timeless teachings of the Bhagavad-gita
        and the practice of Krishna consciousness.
      </p>
      <p>
        FOLK Vizag is run by the {parent} for students and young working professionals in the
        city. Anyone is welcome: you don&apos;t need any background, only curiosity.
      </p>
    </div>
    <figure className="relative overflow-hidden rounded-t-[6rem] rounded-b-2xl border border-line bg-gradient-to-b from-marigold/15 to-paper-dark px-6 pb-8 pt-14 text-center shadow-card lg:col-span-2">
      <span className="absolute left-1/2 top-5 h-1 w-10 -translate-x-1/2 rounded-full bg-marigold/70" aria-hidden="true" />
      <blockquote className="font-display text-[20px] font-medium italic leading-snug text-navy">
        &ldquo;Whatever action a great man performs, common men follow.&rdquo;
      </blockquote>
      <figcaption className="mt-4 text-[13px] font-semibold uppercase tracking-label text-saffron-dark">Bhagavad-gita 3.21</figcaption>
    </figure>
  </Section>
);

export default AboutIntro;

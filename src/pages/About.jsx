import React from 'react';
import { BookOpen, Sunrise, HandHeart, Users, MessageCircle } from 'lucide-react';
import { SITE, PROGRAMS, whatsappLink } from '../content/site';

// Written to be true for FOLK Vizag without relying on numbers we can't vouch
// for. Add real figures (members, programs held) only once they're known.
const PRINCIPLES = [
  { icon: BookOpen, title: 'Wisdom', body: 'Practical classes from the Bhagavad-gita on the mind, relationships, work and purpose.' },
  { icon: Sunrise, title: 'Practice', body: 'Mantra meditation and a simple daily routine that brings steadiness and clarity.' },
  { icon: HandHeart, title: 'Service', body: 'Seva at festivals, prasadam distribution and outreach: learning to give, together.' },
  { icon: Users, title: 'Friendship', body: 'Friends who share your values, and a FOLK guide who looks out for you.' },
];

const About = () => {
  const wa = whatsappLink();
  return (
    <div className="space-y-10 max-w-5xl">
      <section>
        <p className="kicker">About</p>
        <h1 className="display-lg mt-2">{SITE.fullName}</h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4 text-[17px] leading-relaxed">
            <p>
              FOLK is the youth program of the Hare Krishna Movement. It was started to give young people a
              place to explore life&apos;s bigger questions, using the timeless teachings of the Bhagavad-gita
              and the practice of Krishna consciousness.
            </p>
            <p>
              FOLK Vizag is run by the {SITE.parent} for students and young working professionals in the
              city. Anyone is welcome: you don&apos;t need any background, only curiosity.
            </p>
          </div>
          <figure className="lg:col-span-2 bg-paper-dark border border-line rounded-t-[6rem] rounded-b-2xl px-6 pt-12 pb-6 text-center">
            <blockquote className="font-display text-xl italic font-medium leading-snug text-navy">
              &ldquo;Whatever action a great man performs, common men follow.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm font-semibold uppercase tracking-label text-saffron-dark">Bhagavad-gita 3.21</figcaption>
          </figure>
        </div>
      </section>

      <section>
        <h2 className="display-md">What FOLK stands for</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5 flex gap-4">
              <span className="w-11 h-11 shrink-0 rounded-md bg-navy text-white inline-flex items-center justify-center"><Icon size={22} /></span>
              <div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <p className="mt-1 text-ink-muted leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display-md">What we offer</h2>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {PROGRAMS.map((p) => (
            <li key={p.key} className="py-4 grid gap-1 sm:grid-cols-[14rem_1fr]">
              <span className="font-display font-bold">{p.title}</span>
              <span className="text-ink-muted">{p.body}</span>
            </li>
          ))}
        </ul>
      </section>

      {wa && (
        <section className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Have a question?</h2>
            <p className="text-ink-muted">Message the FOLK Vizag team on WhatsApp.</p>
          </div>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0"><MessageCircle size={17} /> WhatsApp us</a>
        </section>
      )}
    </div>
  );
};

export default About;

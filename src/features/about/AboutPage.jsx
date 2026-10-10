import React from 'react';
import { Page, PageHeader } from '../../components/common';
import { SITE, PROGRAMS, whatsappLink } from '../../content/site';
import { PRINCIPLES } from './lib/principles';
import AboutIntro from './components/AboutIntro';
import PrinciplesGrid from './components/PrinciplesGrid';
import ProgramsList from './components/ProgramsList';
import QuestionCta from './components/QuestionCta';

const AboutPage = () => (
  <Page width="max-w-5xl" className="pb-6">
    <PageHeader
      kicker="About"
      title={SITE.fullName}
      description={`${SITE.name} is the youth club of the ${SITE.parent}.`}
    />
    <AboutIntro parent={SITE.parent} />
    <PrinciplesGrid items={PRINCIPLES} />
    <ProgramsList items={PROGRAMS} />
    <QuestionCta href={whatsappLink()} />
  </Page>
);

export default AboutPage;

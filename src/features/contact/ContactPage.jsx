import React from 'react';
import { Page, PageHeader } from '../../components/common';
import { useContactForm } from './hooks/useContactForm';
import { getChannels } from './lib/channels';
import ChannelList from './components/ChannelList';
import MessageForm from './components/MessageForm';

const ContactPage = () => {
  const form = useContactForm();
  return (
    <Page width="max-w-5xl">
      <PageHeader
        kicker="Get in touch"
        title="Contact"
        description="Reach the FOLK Vizag team. WhatsApp is usually the quickest."
      />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <ChannelList channels={getChannels()} className="lg:col-span-2" />
        <MessageForm {...form} className="lg:col-span-3" />
      </div>
    </Page>
  );
};

export default ContactPage;

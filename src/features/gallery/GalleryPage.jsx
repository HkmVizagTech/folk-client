import React, { useMemo } from 'react';
import { Instagram } from 'lucide-react';
import { Page, PageHeader } from '../../components/common';
import { Button } from '../../components/ui';
import { useFirestore } from '../../hooks/useFirestore';
import { PHOTOS, SITE } from '../../content/site';
import { buildGalleryItems } from './lib/items';
import { useLightbox } from './hooks/useLightbox';
import GalleryGrid from './components/GalleryGrid';
import Lightbox from './components/Lightbox';

const GalleryPage = () => {
  const { data: events, loading } = useFirestore('events');
  const items = useMemo(() => buildGalleryItems(PHOTOS.gallery, events), [events]);
  const lightbox = useLightbox(items.length);
  const ready = !(loading && items.length === 0);

  return (
    <Page width="max-w-6xl" revealKey={ready}>
      <PageHeader
        kicker="Moments"
        title="Gallery"
        description="Photos and posters from FOLK Vizag programs."
        actions={SITE.social.instagram && (
          <Button asChild variant="secondary">
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={17} aria-hidden="true" /> @folkvizag</a>
          </Button>
        )}
      />
      <GalleryGrid items={items} loading={!ready} onOpen={lightbox.open} />
      <Lightbox items={items} index={lightbox.index} onClose={lightbox.close} onStep={lightbox.step} />
    </Page>
  );
};

export default GalleryPage;

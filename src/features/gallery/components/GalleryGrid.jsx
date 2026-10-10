import React from 'react';
import { ImageOff } from 'lucide-react';
import { EmptyState } from '../../../components/common';
import { Skeleton } from '../../../components/ui';
import GalleryTile from './GalleryTile';

const GalleryGrid = ({ items, loading, onOpen }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="aspect-square" />)}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div data-reveal>
        <EmptyState
          icon={ImageOff}
          title="No photos yet"
          description="Follow @folkvizag on Instagram for the latest from programs and festivals."
        />
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <GalleryTile key={`${item.src.slice(-40)}-${i}`} item={item} onOpen={() => onOpen(i)} />
      ))}
    </ul>
  );
};

export default GalleryGrid;

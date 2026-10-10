import React from 'react';
import { Maximize2 } from 'lucide-react';
import { formatDay } from '../../../lib/dates';
import { cn } from '../../../lib/utils';

const GalleryTile = ({ item, onOpen }) => (
  <li data-reveal>
    <button type="button" onClick={onOpen} className="group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2">
      <span className="relative block aspect-square overflow-hidden rounded-2xl border border-line/80 bg-paper-dark shadow-card transition-shadow duration-300 group-hover:shadow-premium-xl">
        <img
          src={item.src}
          alt={item.caption}
          loading="lazy"
          className={cn('h-full w-full transition-transform duration-500 group-hover:scale-[1.04]', item.kind === 'poster' ? 'object-contain' : 'object-cover')}
        />
        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
          <Maximize2 size={14} />
        </span>
      </span>
      <span className="mt-2 block truncate px-0.5 text-[14px] font-semibold text-ink">{item.caption}</span>
      {item.date && <span className="block px-0.5 text-[13px] text-ink-muted">{formatDay(item.date)}</span>}
    </button>
  </li>
);

export default GalleryTile;

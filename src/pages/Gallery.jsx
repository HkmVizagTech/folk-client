import React, { useEffect, useMemo, useState } from 'react';
import { Instagram, X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { PHOTOS, SITE } from '../content/site';
import { toDate, formatDay } from '../lib/dates';

// Only real images: photos added in src/content/site.js (PHOTOS.gallery) and
// the posters the team uploaded to events. The old page listed albums with
// photo counts but contained no photos at all.
const realImage = (src) => (src && !/picsum\.photos|unsplash\.com\/random/.test(src) ? src : '');

const Gallery = () => {
  const { data: events, loading } = useFirestore('events');
  const [open, setOpen] = useState(null);

  const items = useMemo(() => {
    const photos = (PHOTOS.gallery || []).map((p) => ({ src: p.src, caption: p.caption || '', kind: 'photo' }));
    const posters = events
      .filter((e) => realImage(e.img))
      .map((e) => ({ src: e.img, caption: e.title, date: toDate(e.dateISO || e.date), kind: 'poster' }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    return [...photos, ...posters];
  }, [events]);

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items.length]);

  const current = open !== null ? items[open] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Gallery</h1>
          <p className="mt-1 text-ink-muted">Photos and posters from FOLK Vizag programs.</p>
        </div>
        {SITE.social.instagram && (
          <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><Instagram size={17} /> @folkvizag</a>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square card animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <ImageOff size={36} className="mx-auto text-ink-muted" />
          <p className="mt-4 font-display font-bold">No photos yet</p>
          <p className="mt-1 text-ink-muted">Follow @folkvizag on Instagram for the latest from programs and festivals.</p>
        </div>
      ) : (
        <ul className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <li key={`${it.src.slice(-40)}-${i}`}>
              <button type="button" onClick={() => setOpen(i)} className="group block w-full text-left">
                <span className="block aspect-square rounded-lg overflow-hidden bg-navy-900">
                  <img src={it.src} alt={it.caption} loading="lazy" className={`w-full h-full ${it.kind === 'poster' ? 'object-contain' : 'object-cover'} group-hover:opacity-90`} />
                </span>
                <span className="mt-1.5 block text-[14px] font-semibold truncate">{it.caption}</span>
                {it.date && <span className="block text-[13px] text-ink-muted">{formatDay(it.date)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col" role="dialog" aria-modal="true" aria-label={current.caption || 'Photo'}>
          <div className="h-14 px-4 flex items-center justify-between text-white">
            <p className="font-semibold truncate">{current.caption}</p>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="w-11 h-11 inline-flex items-center justify-center rounded-md hover:bg-white/10"><X size={22} /></button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-2 pb-6 relative">
            <img src={current.src} alt={current.caption} className="max-w-full max-h-full object-contain" />
            {items.length > 1 && (
              <>
                <button type="button" onClick={() => setOpen((i) => (i - 1 + items.length) % items.length)} aria-label="Previous" className="absolute left-2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"><ChevronLeft size={24} /></button>
                <button type="button" onClick={() => setOpen((i) => (i + 1) % items.length)} aria-label="Next" className="absolute right-2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"><ChevronRight size={24} /></button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;

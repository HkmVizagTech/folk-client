import { toDate } from '../../../lib/dates';

// Only real images: photos added in src/content/site.js (PHOTOS.gallery) and
// the posters the team uploaded to events.
const realImage = (src) => (src && !/picsum\.photos|unsplash\.com\/random/.test(src) ? src : '');

export const buildGalleryItems = (photos = [], events = []) => {
  const fromPhotos = photos.map((p) => ({ src: p.src, caption: p.caption || '', kind: 'photo' }));
  const posters = events
    .filter((e) => realImage(e.img))
    .map((e) => ({ src: e.img, caption: e.title, date: toDate(e.dateISO || e.date), kind: 'poster' }))
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  return [...fromPhotos, ...posters];
};

import { toDate, formatDay, formatTime } from '../../../lib/dates';

const HIDDEN_TRIP_STATUS = ['cancelled', 'completed', 'draft'];
const MAX_SLIDES = 6;

/**
 * Everything coming up that has a poster, nearest first. A yatra and a
 * festival are the same thing here: something to come to.
 */
export const buildPosterSlides = (trips = [], events = [], now = Date.now()) => {
  const soon = now - 6 * 3600 * 1000;
  const fromTrips = trips
    .filter((t) => !HIDDEN_TRIP_STATUS.includes(String(t.status || '').toLowerCase()))
    .map((t) => ({
      id: `t_${t.id}`,
      kind: 'Yatra',
      title: t.title,
      image: t.coverImage,
      when: t.startDate ? Date.parse(`${t.startDate}T06:00:00+05:30`) : null,
      whenText: t.startDate ? formatDay(new Date(`${t.startDate}T06:00:00+05:30`)) : 'Dates soon',
      place: t.location,
      href: `/trip/${encodeURIComponent(t.slug || '')}`,
    }));
  const fromEvents = events.map((e) => {
    const d = toDate(e.dateISO || e.date);
    return {
      id: `e_${e.id}`,
      kind: e.category || 'Program',
      title: e.title,
      image: e.img,
      when: d ? d.getTime() : null,
      whenText: d ? `${formatDay(d)}, ${formatTime(d)}` : '',
      place: e.location,
      href: null,
    };
  });
  return [...fromTrips, ...fromEvents]
    .filter((s) => s.image && s.when && s.when >= soon)
    .sort((a, b) => a.when - b.when)
    .slice(0, MAX_SLIDES);
};

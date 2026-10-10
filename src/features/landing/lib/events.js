const timeOf = (e) => new Date(e.dateISO || e.date).getTime() || 0;

/** Events soonest-first; legacy docs without an ISO date fall back to the display date. */
export const sortEventsByDate = (events = []) => [...events].sort((a, b) => timeOf(a) - timeOf(b));

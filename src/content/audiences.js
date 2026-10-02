// Who an event is for.
//
// 'all' is the public calendar: it also appears on folkvizag.org, so only an
// admin can create one. A FOLK guide creates events for the circle of youth
// they look after ('mine'), or for the residency boys ('residents'). The
// server enforces all of this (folk-server-main/db/policies.js); these are
// only the labels.

export const AUDIENCES = [
  {
    id: 'all',
    label: 'Everyone',
    short: 'Public',
    desc: 'Open to all members and shown on the public website.',
    adminOnly: true,
  },
  {
    id: 'mine',
    label: 'My members',
    short: 'My members',
    desc: 'Only the youth you guide will see this in their calendar.',
  },
  {
    id: 'residents',
    label: 'Residency',
    short: 'Residency',
    desc: 'The FOLK residency boys and the team.',
  },
];

export const audienceOf = (event) => {
  const id = event && event.audience;
  return AUDIENCES.find((a) => a.id === id) || AUDIENCES[0];
};

/** The audiences this person may create an event for. */
export const audiencesFor = (role) =>
  AUDIENCES.filter((a) => !a.adminOnly || role === 'admin');

/** True when this staff member may edit or delete this event. */
export const canManageEvent = (user, event) => {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'folks_head') return false;
  return !!event.ownerId && event.ownerId === user.uid;
};

import { useMemo } from 'react';
import { useFirestore } from './useFirestore';
import { stageOf } from '../content/journey';

const STAFF_ROLES = ['admin', 'folks_head'];

/**
 * Every profile in `users` (staff-only read, enforced by firestore.rules),
 * enriched with the derived fields the team screens need.
 */
export const useMembers = () => {
  const { data, loading } = useFirestore('users');
  const members = useMemo(
    () => data
      .map((u) => ({
        ...u,
        uid: u.uid || u.id,
        displayName: String(u.name || u.fullName || u.displayName || 'Unnamed').trim(),
        stage: stageOf(u),
        isStaff: STAFF_ROLES.includes(u.role),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [data]
  );
  const staff = useMemo(() => members.filter((m) => m.isStaff), [members]);
  return { members, staff, loading };
};

import { useMemo } from 'react';
import { useFirestore } from '../../../hooks/useFirestore';
import { sortEventsByDate } from '../lib/events';

export const useUpcomingEvents = () => {
  const { data, loading } = useFirestore('events');
  const events = useMemo(() => sortEventsByDate(data), [data]);
  return { events, loading };
};

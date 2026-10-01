import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from '../lib/pgstore';

const DEFAULT_CONSTRAINTS = [];
const EMPTY_LOADING = { data: [], loading: true, error: null };
// Not loading, not failed - simply not asked for. Shared module-level object so
// a disabled hook returns the same identity on every render (a fresh object
// would re-trigger every downstream useMemo/useEffect keyed on `data`).
const EMPTY_IDLE = { data: [], loading: false, error: null, disabled: true };

// The constraints are plain descriptor objects from pgstore ({kind:'where',
// field, op, value} / {kind:'orderBy'...} / {kind:'limit', n}) and a Timestamp
// serialises to its ISO string, so the JSON of the list IS the query. Keying
// the effect on that instead of on array identity means two things:
//   - a caller who forgets useMemo no longer re-subscribes on every render
//     (which used to loop: new array -> effect -> setState -> render -> ...);
//   - a caller who memoizes correctly still re-subscribes the moment the
//     query really changes, e.g. when user.uid arrives after auth resolves.
const keyOf = (constraints) => {
  try {
    return JSON.stringify(constraints);
  } catch {
    return null; // un-serialisable: fall back to identity, as before
  }
};

/**
 * Subscribe to a collection.
 *
 * Pass a falsy `collectionName` to turn the subscription OFF without breaking
 * the rules of hooks - the hook still runs, it just never asks the server.
 * This is how a page skips a query it already knows would be refused: a public
 * trip page has no signed-in user, so `trip_registrations` / `payments` are
 * user-scoped reads nobody is allowed to make. Firing them anyway produced a
 * 403 on every poll of the change feed - a permanent error loop in the console
 * of a page that was otherwise working fine.
 */
export const useFirestore = (collectionName, queryConstraints = DEFAULT_CONSTRAINTS) => {
  const [state, setState] = useState(() => (collectionName ? EMPTY_LOADING : EMPTY_IDLE));

  // Read inside the effect so the key, not the array identity, drives it.
  const constraintsRef = useRef(queryConstraints);
  constraintsRef.current = queryConstraints;
  const serialized = keyOf(queryConstraints);
  const depKey = serialized === null ? queryConstraints : serialized;
  const firstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;

    // Disabled: report "nothing here, and we didn't ask" and subscribe to
    // nothing. Re-enabling (e.g. the user signs in) re-runs this effect and
    // takes the normal path below.
    if (!collectionName) {
      setState(EMPTY_IDLE);
      firstRun.current = false;
      return () => { cancelled = true; };
    }

    // A new query must not keep showing the previous query's rows (opening a
    // second course's roster used to show the first one's until its data
    // arrived). Skipped on mount, where the state already says "loading".
    if (firstRun.current) firstRun.current = false;
    else setState(EMPTY_LOADING);

    try {
      const q = query(collection(db, collectionName), ...constraintsRef.current);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (cancelled) return;
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setState({ data: items, loading: false, error: null });
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn(`Permission denied for ${collectionName}.`);
        } else {
          console.error(`Firestore error in ${collectionName}:`, error);
        }
        // Surface the failure. Callers that only read `data`/`loading` behave
        // exactly as before, but a screen can now tell "there is nothing here"
        // apart from "we could not load it", instead of confidently rendering
        // an empty list over a denied or offline read.
        if (!cancelled) setState({ data: [], loading: false, error });
      });

      return () => { cancelled = true; unsubscribe(); };
    } catch (error) {
      console.error('Error setting up Firestore query:', error);
      setState({ data: [], loading: false, error });
      return () => { cancelled = true; };
    }
  }, [collectionName, depKey]);

  return state;
};

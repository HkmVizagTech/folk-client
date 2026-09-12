import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const DEFAULT_CONSTRAINTS = [];

export const useFirestore = (collectionName, queryConstraints = DEFAULT_CONSTRAINTS) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // We rely on the caller to memoize queryConstraints using useMemo.
  // We include collectionName and queryConstraints in the dependency array.
  useEffect(() => {
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(items);
        setLoading(false);
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn(`Permission denied for ${collectionName}.`);
        } else {
          console.error(`Firestore error in ${collectionName}:`, error);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up Firestore query:", error);
      setLoading(false);
    }
  }, [collectionName, queryConstraints]); 

  return { data, loading };
};

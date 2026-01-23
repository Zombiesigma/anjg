'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Query, DocumentData, FirestoreError } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from '../provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const auth = useAuth();

  // Note: JSON.stringify is not a reliable way to memoize a query object.
  // For this app's simplicity, it might work, but in a real-world scenario,
  // dependencies of the query (e.g., collection path, where clauses) should be in the dependency array.
  const memoizedQuery = useMemo(() => query, [JSON.stringify(query)]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setIsLoading(false);
        setError(null);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
            // The public Firebase JS SDK does not expose the path from a query object.
            // This is a known limitation. We'll use a placeholder.
            path: 'unknown/collection/path (from query)',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, auth]);

  return { data, isLoading, error };
}

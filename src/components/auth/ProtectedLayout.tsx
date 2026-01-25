'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);
  
  useEffect(() => {
    if (!firestore || !user) return;

    const userStatusRef = doc(firestore, 'users', user.uid);

    // Set online on mount and update lastSeen
    updateDoc(userStatusRef, {
      status: 'online',
      lastSeen: serverTimestamp(),
    });

    // Set up an interval to update lastSeen periodically to maintain 'online' status
    const intervalId = setInterval(() => {
      updateDoc(userStatusRef, {
        lastSeen: serverTimestamp(),
      });
    }, 2 * 60 * 1000); // every 2 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [firestore, user]);


  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat sesi Anda...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/Logo';

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
    }).catch(err => console.warn("Failed to set online status (normal during shutdown):", err));

    // Set up an interval to update lastSeen periodically to maintain 'online' status
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
          updateDoc(userStatusRef, {
            lastSeen: serverTimestamp(),
          }).catch(err => console.warn("Periodic status update failed:", err));
      }
    }, 2 * 60 * 1000); // every 2 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [firestore, user]);


  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
            <Logo className="w-16 h-16 text-primary animate-pulse" />
            <div className='flex items-center gap-3'>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className='text-muted-foreground'>Memuat Sesi Elitera...</p>
            </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

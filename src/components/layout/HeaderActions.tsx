'use client';
import { useUser, useFirestore, useCollection } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell } from 'lucide-react';
import { UserNav } from './UserNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import type { Chat, Notification } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';


export function HeaderActions() {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();

  const chatThreadsQuery = useMemo(() => (
    (firestore && user)
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', user.uid))
      : null
  ), [firestore, user]);
  const { data: chatThreads } = useCollection<Chat>(chatThreadsQuery);

  const totalUnreadCount = useMemo(() => {
    if (!chatThreads || !user) return 0;
    return chatThreads.reduce((total, chat) => {
      return total + (chat.unreadCounts?.[user.uid] ?? 0);
    }, 0);
  }, [chatThreads, user]);

  const notificationsQuery = useMemo(() => (
    (firestore && user)
      ? query(collection(firestore, `users/${user.uid}/notifications`), where('read', '==', false))
      : null
  ), [firestore, user]);
  const { data: unreadNotifications } = useCollection<Notification>(notificationsQuery);

  const totalUnreadNotifCount = unreadNotifications?.length ?? 0;


  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/messages" className="relative">
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Pesan</span>
          </Button>
          {totalUnreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Link>
        <Link href="/notifications" className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifikasi</span>
          </Button>
           {totalUnreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Link>
        <UserNav />
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      <Link href="/login">
        <Button>Masuk</Button>
      </Link>
      <Link href="/register">
        <Button variant="outline">Daftar</Button>
      </Link>
    </nav>
  );
}

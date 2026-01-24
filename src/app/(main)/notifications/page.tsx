'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function NotificationsPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notificationsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, `users/${currentUser.uid}/notifications`), orderBy('createdAt', 'desc'))
      : null
  ), [firestore, currentUser]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const handleNotificationClick = async (notification: Notification) => {
    if (firestore && !notification.read && currentUser) {
      const notifRef = doc(firestore, `users/${currentUser.uid}/notifications`, notification.id);
      await updateDoc(notifRef, { read: true });
    }
    router.push(notification.link);
  };
  
  const handleMarkAllAsRead = async () => {
      if (!firestore || !currentUser || !notifications) return;

      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(firestore);
      unreadNotifications.forEach(notif => {
          const notifRef = doc(firestore, `users/${currentUser.uid}/notifications`, notif.id);
          batch.update(notifRef, { read: true });
      });
      await batch.commit();
  }

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `Anda memiliki ${unreadCount} notifikasi belum dibaca.` : 'Anda tidak memiliki notifikasi belum dibaca.'}
          </p>
        </div>
        <Button variant="outline" disabled={unreadCount === 0} onClick={handleMarkAllAsRead}>Tandai semua telah dibaca</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && notifications?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-16">Tidak ada notifikasi untuk ditampilkan saat ini.</p>
          )}
          <div className="divide-y">
            {notifications?.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-4 p-4 w-full text-left transition-colors hover:bg-accent",
                  !notification.read && "bg-primary/5"
                )}
              >
                <Avatar className="mt-1">
                  <AvatarImage src={notification.actor.photoURL} alt={notification.actor.displayName} />
                  <AvatarFallback>{notification.actor.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.text.replace(notification.actor.displayName, `<strong>${notification.actor.displayName}</strong>`) }} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMounted ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: id }) : '...'}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 self-center shrink-0" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

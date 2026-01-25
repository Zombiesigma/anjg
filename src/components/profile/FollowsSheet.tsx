'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, documentId, orderBy } from 'firebase/firestore';
import type { User, Follow } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowsSheetProps {
  userId: string;
  type: 'followers' | 'following';
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function FollowsSheet({ userId, type, open, onOpenChange }: FollowsSheetProps) {
  const firestore = useFirestore();

  const title = type === 'followers' ? 'Pengikut' : 'Mengikuti';

  const followsQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'users', userId, type), orderBy('followedAt', 'desc')) : null
  ), [firestore, userId, type]);

  const { data: follows, isLoading: areFollowsLoading } = useCollection<Follow>(followsQuery);

  const userIds = useMemo(() => {
    if (!follows) return [];
    // Firestore 'in' query is limited to 30 items
    return follows.map(f => f.id).slice(0, 30);
  }, [follows]);

  const usersQuery = useMemo(() => {
    if (!firestore || userIds.length === 0) return null;
    return query(collection(firestore, 'users'), where(documentId(), 'in', userIds));
  }, [firestore, userIds]);

  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const isLoading = areFollowsLoading || areUsersLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isLoading ? 'Memuat...' : `Menampilkan ${users?.length || 0} pengguna.`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-4 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && users?.length === 0 && (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Tidak ada yang bisa ditampilkan.
            </div>
          )}
          <div className="space-y-1 py-4">
            {users?.map((user) => (
              <Link
                href={`/profile/${user.username}`}
                key={user.id}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 px-4 py-2 rounded-md hover:bg-accent"
              >
                <Avatar>
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

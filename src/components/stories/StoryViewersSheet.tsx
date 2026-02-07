'use client';

import { useMemo, useEffect } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { StoryView } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface StoryViewersSheetProps {
  storyId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function StoryViewersSheet({ storyId, isOpen, onOpenChange }: StoryViewersSheetProps) {
  const firestore = useFirestore();

  // Safety net: Pastikan pointer-events kembali normal saat sheet ditutup
  useEffect(() => {
    if (!isOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const viewersQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'stories', storyId, 'views'), orderBy('viewedAt', 'desc')) : null
  ), [firestore, storyId]);

  const { data: viewers, isLoading } = useCollection<StoryView>(viewersQuery);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-2/3 flex flex-col"
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Dilihat oleh</SheetTitle>
          <SheetDescription>
            {isLoading ? 'Memuat...' : `${viewers?.length || 0} orang telah melihat cerita ini.`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!isLoading && viewers?.length === 0 && (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Belum ada yang melihat.
            </div>
          )}
          <div className="space-y-4 py-4">
            {viewers?.map((viewer) => (
              <div key={viewer.id} className="flex items-center gap-4 px-4">
                <Avatar>
                  <AvatarImage src={viewer.userAvatarUrl} />
                  <AvatarFallback>{viewer.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{viewer.userName}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {viewer.viewedAt ? formatDistanceToNow(viewer.viewedAt.toDate(), { locale: id, addSuffix: true }) : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

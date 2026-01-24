'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Book, Chat, BookShareMessage } from '@/lib/types';

interface ShareDialogProps {
  book: Book;
  children: React.ReactNode; // The trigger button
}

export function ShareDialog({ book, children }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const chatThreadsQuery = useMemo(() => (
    (firestore && currentUser && open) // Only query when dialog is open
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
      : null
  ), [firestore, currentUser, open]);
  const { data: chatThreads, isLoading } = useCollection<Chat>(chatThreadsQuery);

  const handleSend = async () => {
    if (!firestore || !currentUser || !selectedChatId || !book) return;
    
    setIsSending(true);
    const otherParticipant = chatThreads?.find(c => c.id === selectedChatId)?.participants.find(p => p.uid !== currentUser.uid);
    if (!otherParticipant) {
      toast({ variant: 'destructive', title: 'Gagal mengirim.' });
      setIsSending(false);
      return;
    }
    
    const messageData: Omit<BookShareMessage, 'id' | 'createdAt'> & { createdAt: any } = {
      type: 'book_share',
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      book: {
        id: book.id,
        title: book.title,
        coverUrl: book.coverUrl,
        authorName: book.authorName,
      },
    };

    try {
      const batch = writeBatch(firestore);

      const messagesCol = collection(firestore, 'chats', selectedChatId, 'messages');
      const newMessageRef = doc(messagesCol);
      batch.set(newMessageRef, messageData);
      
      const chatDocRef = doc(firestore, 'chats', selectedChatId);
      batch.update(chatDocRef, {
        lastMessage: {
          text: `Membagikan buku: ${book.title}`,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        [`unreadCounts.${otherParticipant.uid}`]: increment(1)
      });
      
      await batch.commit();
      
      toast({ title: 'Buku dibagikan!', description: `Tautan ke "${book.title}" telah dikirim.` });
      setOpen(false);
      setSelectedChatId(null);
    } catch (error) {
      console.error("Error sending share message:", error);
      toast({ variant: 'destructive', title: 'Gagal membagikan', description: 'Terjadi kesalahan.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Buku</DialogTitle>
          <DialogDescription>
            Kirim tautan ke buku "{book.title}" ke salah satu percakapan Anda.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-64 my-4">
            <div className="flex flex-col gap-1 pr-4">
                {isLoading && <div className="text-center py-4"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></div>}
                {!isLoading && chatThreads?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Anda belum memiliki percakapan.</p>}
                {chatThreads?.map(chat => {
                    const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                    if (!otherP) return null;
                    return (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`flex items-center gap-3 p-2 rounded-md w-full text-left transition-colors ${selectedChatId === chat.id ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        >
                            <Avatar className="border">
                                <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                                <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{otherP.displayName}</span>
                        </button>
                    )
                })}
            </div>
        </ScrollArea>

        <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Batal</Button>
            </DialogClose>
            <Button
                type="button"
                onClick={handleSend}
                disabled={!selectedChatId || isSending}
            >
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Kirim
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

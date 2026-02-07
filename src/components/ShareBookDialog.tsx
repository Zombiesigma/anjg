'use client';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import type { Book, Chat, BookShareMessage } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ShareBookDialogProps {
    book: Book;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareBookDialog({ book, open, onOpenChange }: ShareBookDialogProps) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Safety net: Pastikan pointer-events kembali normal saat dialog ditutup
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                document.body.style.pointerEvents = '';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const chatThreadsQuery = useMemo(() => (
        (firestore && currentUser)
          ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
          : null
      ), [firestore, currentUser]);
    const { data: chatThreads, isLoading: isLoadingThreads } = useCollection<Chat>(chatThreadsQuery);

    const filteredChats = useMemo(() => {
        if (!chatThreads) return [];
        return chatThreads.filter(chat => {
            const otherParticipant = chat.participants.find(p => p.uid !== currentUser?.uid);
            return otherParticipant?.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [chatThreads, currentUser, searchTerm]);
    

    const handleSend = async () => {
        if (!selectedChatId || !firestore || !currentUser) return;
        
        const selectedChat = chatThreads?.find(c => c.id === selectedChatId);
        const otherParticipant = selectedChat?.participants.find(p => p.uid !== currentUser.uid);
        if(!otherParticipant) return;

        setIsSending(true);

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
            
            // Bersihkan state
            setSelectedChatId(null);
            setSearchTerm('');
            
            // Tutup dialog
            onOpenChange(false);

            // Beri jeda sedikit sebelum toast agar tidak bentrok dengan penutupan modal
            setTimeout(() => {
                toast({ title: "Buku Dibagikan!", description: `"${book.title}" telah dikirim ke obrolan.` });
            }, 100);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Gagal membagikan buku." });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-md"
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    // Paksa body agar bisa diinteraksi kembali
                    document.body.style.pointerEvents = '';
                }}
            >
                <DialogHeader>
                    <DialogTitle>Kirim Buku ke Obrolan</DialogTitle>
                    <DialogDescription>Pilih percakapan untuk membagikan buku "{book.title}".</DialogDescription>
                </DialogHeader>
                <div className="relative my-2">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                     <Input placeholder="Cari pengguna..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <ScrollArea className="h-64 border rounded-md">
                    {isLoadingThreads && <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin" /></div>}
                    <div className="flex flex-col gap-1 p-1">
                        {filteredChats.map(chat => {
                            const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                            if (!otherP) return null;
                            return (
                                <button 
                                    key={chat.id} 
                                    onClick={() => setSelectedChatId(chat.id)} 
                                    className={cn("flex items-center gap-3 p-2 text-left hover:bg-accent w-full transition-colors rounded-md", selectedChatId === chat.id && "bg-accent")}
                                >
                                    <Avatar>
                                        <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                                        <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{otherP.displayName}</span>
                                </button>
                            )
                        })}
                         {!isLoadingThreads && filteredChats.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada obrolan ditemukan.</p>
                         )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleSend} disabled={!selectedChatId || isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kirim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

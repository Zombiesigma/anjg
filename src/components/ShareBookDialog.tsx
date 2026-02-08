'use client';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, writeBatch, increment } from 'firebase/firestore';
import type { Book, Chat, BookShareMessage } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Check, Send, MessageSquare } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setSelectedChatId(null);
                setSearchTerm("");
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
                    text: `📖 Membagikan buku: ${book.title}`,
                    senderId: currentUser.uid,
                    timestamp: serverTimestamp(),
                },
                [`unreadCounts.${otherParticipant.uid}`]: increment(1)
            });

            await batch.commit();
            
            onOpenChange(false);

            setTimeout(() => {
                toast({ 
                    variant: 'success',
                    title: "Buku Berhasil Dikirim", 
                    description: `"${book.title}" telah dibagikan ke ${otherParticipant.displayName}.` 
                });
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
                className="max-w-md w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85dvh]"
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    document.body.style.pointerEvents = '';
                }}
            >
                <div className="p-8 bg-primary/5 border-b border-primary/10 shrink-0">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 rounded-2xl bg-white shadow-sm text-primary">
                                <Send className="h-6 w-6" />
                            </div>
                            <DialogTitle className="font-headline text-2xl font-black tracking-tight uppercase">Kirim Karya</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm font-medium leading-relaxed">
                            Bagikan <span className="font-black text-foreground">"{book.title}"</span> kepada teman atau penulis pilihan Anda.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 space-y-6">
                    <div className="relative group shrink-0">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                         <Input 
                            placeholder="Cari obrolan..." 
                            className="h-12 pl-11 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all shadow-inner" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                         />
                    </div>

                    <ScrollArea className="flex-1 px-1">
                        {isLoadingThreads ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 opacity-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi Kontak...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <AnimatePresence mode="popLayout">
                                    {filteredChats.map((chat, idx) => {
                                        const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                                        if (!otherP) return null;
                                        const isSelected = selectedChatId === chat.id;

                                        return (
                                            <motion.button 
                                                key={chat.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                onClick={() => setSelectedChatId(isSelected ? null : chat.id)} 
                                                className={cn(
                                                    "flex items-center gap-4 p-4 text-left rounded-[1.5rem] transition-all group relative",
                                                    isSelected 
                                                        ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                                    <AvatarImage src={otherP.photoURL} alt={otherP.displayName} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/5 text-primary font-black">
                                                        {otherP.displayName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm truncate">{otherP.displayName}</p>
                                                    <p className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                                                        isSelected ? "text-white/60" : "text-muted-foreground"
                                                    )}>@{otherP.username}</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="bg-white text-primary p-1 rounded-full shadow-lg">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </AnimatePresence>
                                {!isLoadingThreads && filteredChats.length === 0 && (
                                    <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                                        <MessageSquare className="h-12 w-12" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Kontak Kosong</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 shrink-0 mt-auto">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full font-bold h-12 px-6">Batal</Button>
                    <Button 
                        onClick={handleSend} 
                        disabled={!selectedChatId || isSending}
                        className="rounded-full px-10 font-black shadow-xl shadow-primary/20 h-12"
                    >
                        {isSending ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim...</>
                        ) : (
                            <><Send className="mr-2 h-5 w-5" /> Bagikan Sekarang</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

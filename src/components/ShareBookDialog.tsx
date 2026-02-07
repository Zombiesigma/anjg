'use client';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
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
                className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden"
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    document.body.style.pointerEvents = '';
                }}
            >
                <div className="p-6 bg-primary/5 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-2xl bg-white shadow-sm text-primary">
                                <Send className="h-5 w-5" />
                            </div>
                            <DialogTitle className="font-headline text-2xl font-black">Kirim Karya</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm font-medium">
                            Bagikan <span className="font-black text-foreground">"{book.title}"</span> kepada teman atau penulis lainnya.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4">
                    <div className="relative group">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                         <Input 
                            placeholder="Cari obrolan atau pengguna..." 
                            className="h-12 pl-10 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                         />
                    </div>

                    <ScrollArea className="h-72 px-1">
                        {isLoadingThreads && (
                            <div className="flex flex-col items-center justify-center p-12 gap-3 opacity-50">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-xs font-bold uppercase tracking-widest">Sinkronisasi Kontak...</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <AnimatePresence mode="popLayout">
                                {filteredChats.map(chat => {
                                    const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                                    if (!otherP) return null;
                                    const isSelected = selectedChatId === chat.id;

                                    return (
                                        <motion.button 
                                            key={chat.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setSelectedChatId(isSelected ? null : chat.id)} 
                                            className={cn(
                                                "flex items-center gap-4 p-3 text-left rounded-2xl transition-all group relative",
                                                isSelected 
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                                                <AvatarFallback className="bg-primary/5 text-primary font-black">
                                                    {otherP.displayName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{otherP.displayName}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                    isSelected ? "text-white/60" : "text-muted-foreground"
                                                )}>@{otherP.username}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="bg-white text-primary p-1 rounded-full shadow-md">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </AnimatePresence>
                            {!isLoadingThreads && filteredChats.length === 0 && (
                                <div className="text-center py-12 opacity-40">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-3" />
                                    <p className="text-sm font-medium">Tidak ada obrolan ditemukan.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-border/50">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full font-bold">Batal</Button>
                    <Button 
                        onClick={handleSend} 
                        disabled={!selectedChatId || isSending}
                        className="rounded-full px-8 font-black shadow-xl shadow-primary/20 h-11"
                    >
                        {isSending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                        ) : (
                            <><Send className="mr-2 h-4 w-4" /> Kirim Sekarang</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

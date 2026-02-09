'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, increment, documentId, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2, Send, Search, ArrowLeft, ChevronRight, Sparkles, Zap, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, User as AppUser } from '@/lib/types';
import { isSameDay, format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [onlineStatus, setOnlineStatus] = useState<{ [key: string]: boolean }>({});

  // 1. Fetching Chat Threads
  const chatThreadsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
      : null
  ), [firestore, currentUser]);
  const { data: chatThreads, isLoading: isLoadingThreads } = useCollection<Chat>(chatThreadsQuery);

  // 2. Fetching Participant Profiles for status & display
  const otherParticipantUids = useMemo(() => {
      if (!chatThreads || !currentUser) return [];
      const uids = new Set<string>();
      chatThreads.forEach(chat => {
          chat.participantUids.forEach(uid => {
              if (uid !== currentUser.uid) uids.add(uid);
          });
      });
      return Array.from(uids);
  }, [chatThreads, currentUser]);

  const usersQuery = useMemo(() => {
      if (!firestore || otherParticipantUids.length === 0) return null;
      return query(collection(firestore, 'users'), where(documentId(), 'in', otherParticipantUids.slice(0, 30)));
  }, [firestore, otherParticipantUids]);
  const { data: participantProfiles } = useCollection<AppUser>(usersQuery);

  const profilesMap = useMemo(() => {
      if (!participantProfiles) return new Map<string, AppUser>();
      return new Map(participantProfiles.map(p => [p.id, p]));
  }, [participantProfiles]);

  // Status Check Sync
  useEffect(() => {
    if (profilesMap.size === 0) return;
    const checkStatuses = () => {
        const newStatus: { [key: string]: boolean } = {};
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        profilesMap.forEach((profile, uid) => {
            let lastSeenMillis = 0;
            if (profile.lastSeen && typeof (profile.lastSeen as any).toMillis === 'function') {
                lastSeenMillis = (profile.lastSeen as any).toMillis();
            } else if (profile.lastSeen instanceof Date) {
                lastSeenMillis = profile.lastSeen.getTime();
            }
            newStatus[uid] = profile.status === 'online' && lastSeenMillis > fiveMinutesAgo;
        });
        setOnlineStatus(newStatus);
    };
    checkStatuses();
    const interval = setInterval(checkStatuses, 60000); 
    return () => clearInterval(interval);
  }, [profilesMap]);

  // Mark as read logic
  useEffect(() => {
    if (!firestore || !currentUser?.uid || !selectedChatId || !chatThreads) return;
    const selectedChatData = chatThreads.find(c => c.id === selectedChatId);
    if (selectedChatData?.unreadCounts?.[currentUser.uid] > 0) {
      updateDoc(doc(firestore, 'chats', selectedChatId), {
        [`unreadCounts.${currentUser.uid}`]: 0
      }).catch(err => console.warn(err));
    }
  }, [selectedChatId, currentUser?.uid, firestore, chatThreads]);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    setSelectedChatId(chatIdFromUrl || null);
  }, [searchParams]);

  // 3. Fetching Messages for current chat
  const messagesQuery = useMemo(() => (
    (firestore && selectedChatId)
      ? query(collection(firestore, 'chats', selectedChatId, 'messages'), orderBy('createdAt', 'asc'))
      : null
  ), [firestore, selectedChatId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(messagesQuery);
  
  const messageGroups = useMemo(() => {
    if (!messages) return [];
    type MessageGroupItem = ChatMessage | { type: 'date_marker', id: string, date: Date };
    const grouped: MessageGroupItem[] = [];
    messages.forEach((msg, index) => {
        if (!msg.createdAt || typeof (msg.createdAt as any).toDate !== 'function') return; 
        const msgDate = (msg.createdAt as any).toDate();
        const prevMsgDate = index > 0 && messages[index - 1].createdAt && typeof (messages[index - 1].createdAt as any).toDate === 'function' 
            ? (messages[index - 1].createdAt as any).toDate() : null;
        if (index === 0 || (prevMsgDate && !isSameDay(prevMsgDate, msgDate))) {
            grouped.push({ type: 'date_marker', id: `date-${msgDate.toISOString()}`, date: msgDate });
        }
        grouped.push(msg);
    });
    return grouped;
  }, [messages]);

  const selectedChat = useMemo(() => chatThreads?.find(chat => chat.id === selectedChatId), [chatThreads, selectedChatId]);
  const otherParticipant = useMemo(() => selectedChat?.participants.find(p => p.uid !== currentUser?.uid), [selectedChat, currentUser]);
  const isOtherParticipantOnline = otherParticipant ? onlineStatus[otherParticipant.uid] : false;

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [messageGroups]);

  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`; 
      }
  }, [newMessage]);
  
  const handleSelectChat = (chatId: string) => {
    router.push(`/messages?chatId=${chatId}`, { scroll: false });
  }
  
  const handleGoBack = () => {
    router.push('/messages', { scroll: false });
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedChatId || !firestore || !otherParticipant) return;
    const textToSend = newMessage.trim();
    setNewMessage(""); 
    setIsSending(true);
    try {
      const batch = writeBatch(firestore);
      batch.set(doc(collection(firestore, 'chats', selectedChatId, 'messages')), {
        type: 'text', text: textToSend, senderId: currentUser.uid, createdAt: serverTimestamp(),
      });
      batch.update(doc(firestore, 'chats', selectedChatId), {
        lastMessage: { text: textToSend, senderId: currentUser.uid, timestamp: serverTimestamp() },
        [`unreadCounts.${otherParticipant.uid}`]: increment(1)
      });
      await batch.commit();
    } catch (error) {
      setNewMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const sortedAndFilteredChatThreads = useMemo(() => {
    if (!chatThreads) return [];
    let threads = chatThreads.filter(chat => {
        if (!searchQuery.trim()) return true;
        const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
        return otherP?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return [...threads].sort((a, b) => {
        const timeA = (a.lastMessage?.timestamp as any)?.toMillis() || 0;
        const timeB = (b.lastMessage?.timestamp as any)?.toMillis() || 0;
        return timeB - timeA;
    });
  }, [chatThreads, searchQuery, currentUser?.uid]);

  return (
    <div className="h-[calc(100dvh-180px)] md:h-[calc(100dvh-theme(spacing.20)-4px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden flex flex-col bg-background relative shadow-inner">
      <div className="grid grid-cols-12 flex-1 h-full overflow-hidden">
        
        {/* Sidebar: Chat List */}
        <div className={cn(
          "col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col bg-card/30 overflow-hidden relative transition-all duration-500",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          {/* Header Sidebar */}
          <div className="p-6 border-b shrink-0 bg-background/50 backdrop-blur-md z-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-headline font-black tracking-tight uppercase">Pesan</h1>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 text-primary">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Cari pujangga..." 
                    className="pl-11 h-12 bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20 transition-all shadow-inner font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          {/* List Obrolan */}
          <div className="flex-1 overflow-hidden relative bg-muted/5">
            <ScrollArea className="h-full">
                <div className="flex flex-col p-3 gap-2 pb-24">
                {isLoadingThreads ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Menyambungkan Sinyal...</p>
                    </div>
                ) : sortedAndFilteredChatThreads.length === 0 ? (
                    <div className="text-center py-20 px-6 opacity-30 flex flex-col items-center gap-4">
                        <Zap className="h-12 w-12" />
                        <p className="text-sm font-bold leading-relaxed">Belum ada jejak percakapan.</p>
                    </div>
                ) : sortedAndFilteredChatThreads.map((chat, idx) => {
                    const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                    if (!otherP) return null;
                    const unreadCount = chat.unreadCounts?.[currentUser?.uid ?? ''] ?? 0;
                    const isOnline = onlineStatus[otherP.uid];
                    const isActive = selectedChatId === chat.id;
                    
                    return (
                    <motion.button
                        key={chat.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelectChat(chat.id)}
                        className={cn(
                        "flex items-start gap-4 p-4 text-left rounded-[1.75rem] transition-all duration-300 group relative w-full",
                        isActive 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10" 
                            : "hover:bg-card hover:shadow-md"
                        )}
                    >
                        <div className="relative shrink-0">
                            <Avatar className={cn(
                                "h-14 w-14 border-2 transition-transform duration-500 group-hover:scale-105", 
                                isActive ? "border-white/20" : "border-background"
                            )}>
                                <AvatarImage src={otherP.photoURL} alt={otherP.displayName} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary font-black">{otherP.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-sm ring-1 ring-green-400 animate-pulse" />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-black truncate text-sm tracking-tight">{otherP.displayName}</p>
                                {chat.lastMessage?.timestamp && (
                                    <p className={cn("text-[9px] font-bold uppercase", isActive ? "text-white/60" : "text-muted-foreground/60")}>
                                        {format(chat.lastMessage.timestamp.toDate(), 'HH:mm')}
                                    </p>
                                )}
                            </div>
                            <p className={cn(
                                "text-xs truncate mt-1 leading-relaxed", 
                                isActive ? "text-white/80" : "text-muted-foreground"
                            )}>
                                {chat.lastMessage?.text || "Kirim pesan inspirasi..."}
                            </p>
                        </div>

                        {unreadCount > 0 && !isActive && (
                            <div className="absolute right-4 bottom-4 h-6 min-w-[24px] px-2 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-black shadow-lg shadow-primary/30 ring-2 ring-background animate-bounce">
                                {unreadCount}
                            </div>
                        )}
                        
                        {!isActive && (
                            <ChevronRight className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-all group-hover:translate-x-1" />
                        )}
                    </motion.button>
                    )
                })}
                </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Box: Messages Area */}
        <div className={cn(
            "col-span-12 md:col-span-8 lg:col-span-9 h-full flex flex-col overflow-hidden relative bg-background transition-all duration-500",
            selectedChatId ? 'flex' : 'hidden md:flex'
        )}>
          {!selectedChatId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-muted/5 relative">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-10 rounded-[3.5rem] bg-card shadow-2xl shadow-primary/5 flex flex-col items-center gap-8 relative z-10 ring-1 ring-border/50"
                >
                    <div className="p-8 rounded-[2.5rem] bg-primary/5 text-primary shadow-inner">
                        <MessageSquare className="h-20 w-16" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-headline font-black tracking-tight uppercase">Ruang Inspirasi</h2>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium italic">
                            "Pilih salah satu obrolan untuk mulai membagikan imajinasi, kritik sastra, dan semangat pujangga."
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                        <Sparkles className="h-3.5 w-3.5" /> Jalin Koneksi Baru
                    </div>
                </motion.div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Chat Box */}
              <div className="flex items-center px-6 py-4 border-b bg-background/95 backdrop-blur-md shrink-0 z-30 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-20" />
                
                <Button variant="ghost" size="icon" className="md:hidden mr-4 rounded-full hover:bg-muted shrink-0" onClick={handleGoBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                
                {otherParticipant ? (
                   <Link href={`/profile/${otherParticipant.username}`} className="flex items-center gap-4 group min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-primary/10 transition-all group-hover:scale-105 group-hover:border-primary/30 shadow-md">
                        <AvatarImage src={otherParticipant.photoURL} className="object-cover" />
                        <AvatarFallback className="font-black bg-primary/5 text-primary">{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                       {isOtherParticipantOnline && (
                           <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-lg animate-pulse" />
                       )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-lg group-hover:text-primary transition-colors truncate leading-none">{otherParticipant.displayName}</h2>
                        {isOtherParticipantOnline && (
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 flex items-center gap-2">
                          @{otherParticipant.username}
                          <span className="opacity-30">•</span>
                          <span className={cn(isOtherParticipantOnline ? "text-green-500 lowercase tracking-normal" : "lowercase tracking-normal")}>
                            {isOtherParticipantOnline ? 'aktif sekarang' : 'sedang istirahat'}
                          </span>
                      </p>
                    </div>
                   </Link>
                ) : (
                    <div className="flex-1 min-w-0 h-12 flex items-center">
                        <Skeleton className="h-10 w-48 rounded-full" />
                    </div>
                )}
                
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                        <Info className="h-5 w-5" />
                    </Button>
                </div>
              </div>
              
              {/* Pesan-pesan */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                    <div className="py-10 px-6 space-y-10">
                    {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Membuka Gulungan Surat...</p>
                        </div>
                    ) : messageGroups.length === 0 ? (
                        <div className="text-center py-32 opacity-20 flex flex-col items-center gap-6">
                            <div className="p-6 rounded-[2rem] bg-primary/5">
                                <Sparkles className="h-16 w-16 text-primary" />
                            </div>
                            <p className="font-headline text-2xl font-black italic max-w-xs mx-auto">Mulailah Percakapan Puitis Pertama Anda</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messageGroups.map((item) => {
                            if ('type' in item && item.type === 'date_marker') {
                                return (
                                <div key={item.id} className="flex items-center justify-center my-12 select-none">
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
                                    <span className="text-[9px] uppercase tracking-[0.4em] font-black text-muted-foreground/40 px-8 bg-background relative z-10">
                                        {isToday(item.date) ? 'Hari Ini' : isYesterday(item.date) ? 'Kemarin' : format(item.date, 'd MMM yyyy', { locale: id })}
                                    </span>
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
                                </div>
                                );
                            }
                            const msg = item as ChatMessage;
                            const isSender = msg.senderId === currentUser?.uid;
                            return (
                                <motion.div 
                                    key={msg.id} 
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    className={cn("flex items-end gap-3", isSender ? "justify-end" : "justify-start")}
                                >
                                {!isSender && (
                                    <Avatar className="h-9 w-9 mb-1 shrink-0 border-2 border-background shadow-md">
                                        <AvatarImage src={otherParticipant?.photoURL} className="object-cover" />
                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{otherParticipant?.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("flex flex-col gap-1.5 max-w-[85%] md:max-w-[70%]", isSender ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "rounded-[1.75rem] shadow-sm text-[15px] leading-relaxed relative overflow-hidden", 
                                        msg.type === 'text' ? "px-6 py-4" : "p-1",
                                        isSender 
                                            ? "bg-primary text-white rounded-br-none shadow-primary/20 ring-1 ring-white/10" 
                                            : "bg-card border border-border/50 rounded-bl-none shadow-black/5"
                                    )}>
                                        {msg.type === 'text' && (
                                            <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                        )}
                                        {msg.type === 'book_share' && (
                                            <Link href={`/books/${msg.book.id}`} className="block group/shared">
                                                <div className={cn(
                                                    "flex flex-col gap-2 min-w-[180px] sm:min-w-[240px] overflow-hidden rounded-2xl transition-all",
                                                    isSender ? "bg-white/5 hover:bg-white/10" : "bg-muted/20 hover:bg-muted/40"
                                                )}>
                                                    <div className="aspect-[2/3] relative w-full h-40 sm:h-56">
                                                        <Image 
                                                            src={msg.book.coverUrl} 
                                                            alt={msg.book.title} 
                                                            fill 
                                                            className="object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40" />
                                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                                            <p className="font-black text-xs sm:text-sm line-clamp-2 leading-tight uppercase tracking-tight">{msg.book.title}</p>
                                                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{msg.book.authorName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-2 text-center">
                                                        <span className={cn(
                                                            "text-[8px] sm:text-[10px] font-black uppercase tracking-widest",
                                                            isSender ? "text-white/60" : "text-primary"
                                                        )}>Buka Karya</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}
                                        
                                        {/* Subtle message arrow tail */}
                                        <div className={cn(
                                            "absolute bottom-0 w-4 h-4",
                                            isSender ? "-right-1 bg-primary [clip-path:polygon(0_0,100%_100%,0_100%)]" : "-left-1 bg-card border-l border-b border-border/50 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
                                        )} />
                                    </div>
                                    <p className={cn("text-[8px] font-black uppercase opacity-40 px-2 tracking-widest", isSender ? "text-right" : "text-left")}>
                                        {format(msg.createdAt.toDate(), 'HH:mm')}
                                    </p>
                                </div>
                                </motion.div>
                            );
                            })}
                        </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                    </div>
                </ScrollArea>
              </div>

              {/* Input Area - Terangkat di atas Mobile Nav */}
              <div className="p-4 md:p-6 border-t bg-background/95 backdrop-blur-md shrink-0 z-[60] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)]">
                  <form onSubmit={handleSendMessage} className="relative flex items-end gap-4 max-w-5xl mx-auto">
                      <div className="relative flex-1 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Textarea 
                            ref={textareaRef}
                            placeholder="Tuangkan inspirasi Anda..." 
                            className="relative w-full resize-none rounded-[1.75rem] border-none bg-muted/40 px-6 py-4 pr-16 min-h-[60px] max-h-40 focus-visible:ring-primary/20 focus-visible:bg-background transition-all shadow-inner text-sm leading-relaxed font-medium"
                            rows={1}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                            disabled={isSending}
                        />
                        <div className="absolute right-2 bottom-2">
                            <Button 
                                type="submit" 
                                size="icon" 
                                className="h-11 w-11 rounded-[1.25rem] shadow-xl shadow-primary/30 transition-all active:scale-90 bg-primary hover:bg-primary/90" 
                                disabled={isSending || !newMessage.trim()}
                            >
                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5"/>}
                            </Button>
                        </div>
                      </div>
                  </form>
                  <div className="mt-2 flex justify-center opacity-20 pointer-events-none select-none">
                      <p className="text-[7px] font-black uppercase tracking-[0.4em]">Elitera Secure Chat</p>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

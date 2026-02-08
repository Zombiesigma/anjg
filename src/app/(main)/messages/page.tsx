'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, documentId, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, MessageSquare, Loader2, Send, Search, ArrowLeft, User, Trash2, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, User as AppUser } from '@/lib/types';
import { formatDistanceToNow, isSameDay, format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

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

  const chatThreadsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
      : null
  ), [firestore, currentUser]);
  const { data: chatThreads, isLoading: isLoadingThreads } = useCollection<Chat>(chatThreadsQuery);

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
  const otherParticipantProfile = useMemo(() => otherParticipant ? profilesMap.get(otherParticipant.uid) : null, [otherParticipant, profilesMap]);
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
    <div className="h-[calc(100dvh-theme(spacing.16)-4px)] md:h-[calc(100dvh-theme(spacing.20)-4px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden flex flex-col bg-background relative">
      <div className="grid grid-cols-12 flex-1 h-full overflow-hidden">
        
        {/* Sidebar: Chat List */}
        <div className={cn(
          "col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col bg-card/30 overflow-hidden",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b shrink-0 bg-background/50 backdrop-blur-sm">
            <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tighter">Pesan</h1>
            <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Cari obrolan..." 
                    className="pl-9 h-10 bg-muted/50 border-none rounded-xl" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
                <div className="flex flex-col p-2 gap-1 pb-20">
                {sortedAndFilteredChatThreads.map(chat => {
                    const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                    if (!otherP) return null;
                    const unreadCount = chat.unreadCounts?.[currentUser?.uid ?? ''] ?? 0;
                    const isOnline = onlineStatus[otherP.uid];
                    
                    return (
                    <button
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={cn(
                        "flex items-start gap-3 p-3 text-left rounded-2xl transition-all duration-200 group relative w-full",
                        selectedChatId === chat.id 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] z-10" 
                            : "hover:bg-accent/50"
                        )}
                    >
                        <div className="relative shrink-0">
                        <Avatar className={cn("h-12 w-12 border-2", selectedChatId === chat.id ? "border-white/20" : "border-background")}>
                            <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                            <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {isOnline && <span className="absolute bottom-0.5 right-0.5 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-bold truncate text-sm">{otherP.displayName}</p>
                                {chat.lastMessage?.timestamp && (
                                    <p className="text-[9px] font-black uppercase opacity-60">
                                        {format(chat.lastMessage.timestamp.toDate(), 'HH:mm')}
                                    </p>
                                )}
                            </div>
                        <p className={cn("text-xs truncate mt-0.5", selectedChatId === chat.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {chat.lastMessage?.text || "Mulai obrolan..."}
                        </p>
                        </div>
                        {unreadCount > 0 && selectedChatId !== chat.id && (
                        <div className="absolute right-3 bottom-3 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black ring-2 ring-background">
                            {unreadCount}
                        </div>
                        )}
                    </button>
                    )
                })}
                </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Box: Messages Area */}
        <div className={cn(
            "col-span-12 md:col-span-8 lg:col-span-9 h-full flex flex-col overflow-hidden relative",
            selectedChatId ? 'flex' : 'hidden md:flex'
        )}>
          {!selectedChatId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/5">
                <MessageSquare className="h-16 w-16 text-primary/10 mb-4" />
                <h2 className="text-xl font-headline font-black uppercase tracking-tighter">Obrolan Elitera</h2>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">Pilih percakapan untuk memulai inspirasi.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-background overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b bg-background/95 backdrop-blur-md shrink-0 z-20 shadow-sm">
                <Button variant="ghost" size="icon" className="md:hidden mr-3 rounded-full" onClick={handleGoBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                {otherParticipant && (
                   <Link href={`/profile/${otherParticipant.username}`} className="flex items-center gap-3 group min-w-0">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarImage src={otherParticipant.photoURL} />
                        <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                       {isOtherParticipantOnline && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-sm group-hover:text-primary transition-colors truncate leading-tight">{otherParticipant.displayName}</h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">@{otherParticipant.username}</p>
                    </div>
                   </Link>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full px-4 md:px-6">
                    <div className="py-6 space-y-6">
                    <AnimatePresence initial={false}>
                        {messageGroups.map((item) => {
                        if ('type' in item && item.type === 'date_marker') {
                            return (
                            <div key={item.id} className="flex items-center justify-center my-8">
                                <div className="h-[1px] bg-border flex-1" />
                                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-4">
                                    {isToday(item.date) ? 'Hari Ini' : isYesterday(item.date) ? 'Kemarin' : format(item.date, 'd MMM yyyy', { locale: id })}
                                </span>
                                <div className="h-[1px] bg-border flex-1" />
                            </div>
                            );
                        }
                        const msg = item as ChatMessage;
                        const isSender = msg.senderId === currentUser?.uid;
                        return (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-end gap-2.5", isSender ? "justify-end" : "justify-start")}>
                            {!isSender && (
                                <Avatar className="h-8 w-8 mb-1 shrink-0">
                                    <AvatarImage src={otherParticipant?.photoURL} />
                                    <AvatarFallback>{otherParticipant?.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex flex-col gap-1 max-w-[80%] md:max-w-[65%]">
                                <div className={cn("px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed", isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted/50 border rounded-bl-none")}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <p className={cn("text-[8px] font-black uppercase opacity-40 px-1", isSender ? "text-right" : "text-left")}>
                                    {format(msg.createdAt.toDate(), 'HH:mm')}
                                </p>
                            </div>
                            </motion.div>
                        );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-4" />
                    </div>
                </ScrollArea>
              </div>

              <div className="p-4 border-t bg-background/95 backdrop-blur-md shrink-0 z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 max-w-5xl mx-auto">
                      <div className="relative flex-1 group">
                        <Textarea 
                            ref={textareaRef}
                            placeholder="Tulis inspirasi..." 
                            className="w-full resize-none rounded-2xl border-none bg-muted/50 px-4 py-3 pr-12 min-h-[48px] max-h-32 focus-visible:ring-primary/20 shadow-inner"
                            rows={1}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                            disabled={isSending}
                        />
                        <div className="absolute right-2 bottom-2">
                            <Button type="submit" size="icon" className="h-9 w-9 rounded-full shadow-lg" disabled={isSending || !newMessage.trim()}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5"/>}
                            </Button>
                        </div>
                      </div>
                  </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
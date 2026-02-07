'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, type Timestamp, writeBatch, increment, documentId } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, MessageSquare, Loader2, Send, Search, ArrowLeft, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, TextMessage, User as AppUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [onlineStatus, setOnlineStatus] = useState<{ [key: string]: boolean }>({});


  // 1. Fetch user's chat threads
  const chatThreadsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
      : null
  ), [firestore, currentUser]);
  const { data: chatThreads, isLoading: isLoadingThreads } = useCollection<Chat>(chatThreadsQuery);

  // 2. Get all other participant uids
  const otherParticipantUids = useMemo(() => {
      if (!chatThreads || !currentUser) return [];
      const uids = new Set<string>();
      chatThreads.forEach(chat => {
          chat.participantUids.forEach(uid => {
              if (uid !== currentUser.uid) {
                  uids.add(uid);
              }
          });
      });
      return Array.from(uids);
  }, [chatThreads, currentUser]);

  // 3. Fetch all user profiles in one go
  const usersQuery = useMemo(() => {
      if (!firestore || otherParticipantUids.length === 0) return null;
      return query(collection(firestore, 'users'), where(documentId(), 'in', otherParticipantUids.slice(0, 30)));
  }, [firestore, otherParticipantUids]);
  const { data: participantProfiles } = useCollection<AppUser>(usersQuery);

  // 4. Create a map for easy lookup
  const profilesMap = useMemo(() => {
      if (!participantProfiles) return new Map<string, AppUser>();
      return new Map(participantProfiles.map(p => [p.id, p]));
  }, [participantProfiles]);

  // 5. Periodically check online status
  useEffect(() => {
    if (profilesMap.size === 0) return;

    const checkStatuses = () => {
        const newStatus: { [key: string]: boolean } = {};
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        profilesMap.forEach((profile, uid) => {
            // Safety check: ensure lastSeen is a Timestamp before calling toMillis()
            let lastSeenMillis = 0;
            if (profile.lastSeen && typeof (profile.lastSeen as any).toMillis === 'function') {
                lastSeenMillis = (profile.lastSeen as any).toMillis();
            } else if (profile.lastSeen instanceof Date) {
                lastSeenMillis = profile.lastSeen.getTime();
            }

            const isOnline = profile.status === 'online' && lastSeenMillis > fiveMinutesAgo;
            newStatus[uid] = isOnline;
        });
        setOnlineStatus(newStatus);
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profilesMap]);

  // Effect to reset unread count when a chat is opened
  useEffect(() => {
    if (!firestore || !currentUser?.uid || !selectedChatId || !chatThreads) return;

    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const selectedChatData = chatThreads.find(c => c.id === selectedChatId);
    
    if (selectedChatData?.unreadCounts?.[currentUser.uid] > 0) {
      updateDoc(chatDocRef, {
        [`unreadCounts.${currentUser.uid}`]: 0
      }).catch(error => console.warn("Failed to reset unread count (expected if connection is closing):", error));
    }
  }, [selectedChatId, currentUser?.uid, firestore, chatThreads]);


  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
    } else {
      setSelectedChatId(null);
    }
  }, [searchParams]);

  // Fetch messages for the selected chat
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
            ? (messages[index - 1].createdAt as any).toDate() 
            : null;

        if (index === 0 || (prevMsgDate && !isSameDay(prevMsgDate, msgDate))) {
            grouped.push({
                type: 'date_marker',
                id: `date-${msgDate.toISOString()}`,
                date: msgDate
            });
        }
        grouped.push(msg);
    });
    
    return grouped;
  }, [messages]);


  const selectedChat = useMemo(() => (
    chatThreads?.find(chat => chat.id === selectedChatId)
  ), [chatThreads, selectedChatId]);

  const otherParticipant = useMemo(() => (
    selectedChat?.participants.find(p => p.uid !== currentUser?.uid)
  ), [selectedChat, currentUser]);

  const otherParticipantProfile = useMemo(() => {
    if (!otherParticipant) return null;
    return profilesMap.get(otherParticipant.uid);
  }, [otherParticipant, profilesMap]);

  const isOtherParticipantOnline = otherParticipant ? onlineStatus[otherParticipant.uid] : false;


  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageGroups]);

    // Auto-resize textarea
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          const scrollHeight = textareaRef.current.scrollHeight;
          textareaRef.current.style.height = `${scrollHeight}px`;
      }
  }, [newMessage]);
  
  const handleSelectChat = (chatId: string) => {
    router.push(`/messages?chatId=${chatId}`, { scroll: false });
    setSelectedChatId(chatId);
  }
  
  const handleGoBack = () => {
    router.push('/messages', { scroll: false });
    setSelectedChatId(null);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedChatId || !firestore || !otherParticipant) return;
    setIsSending(true);

    const messageData: Omit<TextMessage, 'id' | 'createdAt'> & { createdAt: any } = {
      type: 'text',
      text: newMessage,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(firestore);

      const messagesCol = collection(firestore, 'chats', selectedChatId, 'messages');
      const newMessageRef = doc(messagesCol);
      batch.set(newMessageRef, messageData);
      
      const chatDocRef = doc(firestore, 'chats', selectedChatId);
      batch.update(chatDocRef, {
        lastMessage: {
          text: newMessage,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        [`unreadCounts.${otherParticipant.uid}`]: increment(1)
      });
      
      await batch.commit();
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDateMarker = (date: Date) => {
    if (isToday(date)) return 'Hari Ini';
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'eeee, d MMMM yyyy', { locale: id });
  }

  // Safety sort for chat threads
  const sortedChatThreads = useMemo(() => {
    if (!chatThreads) return [];
    return [...chatThreads].sort((a, b) => {
        const timeA = (a.lastMessage?.timestamp && typeof (a.lastMessage.timestamp as any).toMillis === 'function') 
            ? (a.lastMessage.timestamp as any).toMillis() 
            : 0;
        const timeB = (b.lastMessage?.timestamp && typeof (b.lastMessage.timestamp as any).toMillis === 'function') 
            ? (b.lastMessage.timestamp as any).toMillis() 
            : 0;
        return timeB - timeA;
    });
  }, [chatThreads]);
  
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.14)-theme(spacing.12)-2px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden flex flex-col">
      <div className="grid grid-cols-12 flex-1 overflow-hidden">
        {/* Chat List */}
        <div className={cn(
          "col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col bg-background",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b shrink-0">
            <h1 className="text-2xl font-headline font-bold">Pesan</h1>
            <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari obrolan..." className="pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1 overflow-y-auto">
            {isLoadingThreads && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
            {!isLoadingThreads && chatThreads?.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-base text-foreground">Tidak Ada Pesan</h3>
                <p>Mulai percakapan di profil seseorang.</p>
              </div>
            )}
            <div className="flex flex-col">
              {sortedChatThreads.map(chat => {
                const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                if (!otherP) return null;
                const unreadCount = chat.unreadCounts?.[currentUser?.uid ?? ''] ?? 0;
                const isOnline = onlineStatus[otherP.uid];
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 text-left hover:bg-accent w-full transition-colors",
                      selectedChatId === chat.id ? "bg-accent" : (unreadCount > 0 ? "bg-primary/5" : "")
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="border">
                        <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                        <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{otherP.displayName}</p>
                            {chat.lastMessage?.timestamp && typeof (chat.lastMessage.timestamp as any).toDate === 'function' && (
                                <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDistanceToNow((chat.lastMessage.timestamp as any).toDate(), { locale: id, addSuffix: true })}
                                </p>
                            )}
                        </div>
                      <p className={cn(
                          "text-sm text-muted-foreground truncate",
                          unreadCount > 0 && "font-bold text-foreground"
                      )}>
                        {chat.lastMessage?.senderId === currentUser?.uid && 'Anda: '}{chat.lastMessage?.text}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 ml-2 self-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Box */}
        <div className={cn(
            "col-span-12 md:col-span-8 lg:col-span-9 h-full flex flex-col overflow-hidden",
            selectedChatId ? 'flex' : 'hidden md:flex'
        )}>
          {!selectedChatId && !searchParams.get('chatId') ? (
            <div className="items-center justify-center h-full text-center hidden md:flex flex-col gap-2 bg-muted/30">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <h2 className="mt-2 text-xl font-semibold">Pesan Elitera Anda</h2>
              <p className="text-muted-foreground max-w-sm px-4">Pilih dari obrolan yang ada untuk mulai mengirim pesan.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-muted/20 overflow-hidden relative">
              {/* Chat Header - Tetap Diam */}
              <div className="flex items-center p-2.5 border-b bg-background shadow-sm shrink-0 z-20">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                {otherParticipant && (
                   <Link href={`/profile/${otherParticipant.username}`} className="flex items-center gap-3 group min-w-0">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.displayName} />
                        <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                       {isOtherParticipantOnline && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                       )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold group-hover:underline truncate">{otherParticipant.displayName}</h2>
                       {isOtherParticipantOnline ? (
                          <p className="text-xs text-green-600">Online</p>
                       ) : (
                          otherParticipantProfile?.lastSeen && typeof (otherParticipantProfile.lastSeen as any).toDate === 'function' && 
                          <p className="text-xs text-muted-foreground">Aktif {formatDistanceToNow((otherParticipantProfile.lastSeen as any).toDate(), { locale: id, addSuffix: true })}</p>
                       )}
                    </div>
                   </Link>
                )}
                <div className="ml-auto flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {otherParticipant?.username && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${otherParticipant.username}`}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Lihat Profil</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" disabled>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus Obrolan</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
              
              {/* Messages Area - Satu-satunya yang bisa di-scroll */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                    {isLoadingMessages && <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                    <div className="p-4 md:p-6 space-y-4">
                    <AnimatePresence initial={false}>
                        {messageGroups.map((item) => {
                        if ('type' in item && item.type === 'date_marker') {
                            return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center my-6"
                            >
                                <div className="h-px bg-border flex-1" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground px-4 bg-muted/50 py-1 rounded-full border">
                                {formatDateMarker(item.date)}
                                </span>
                                <div className="h-px bg-border flex-1" />
                            </motion.div>
                            );
                        }

                        const msg = item as ChatMessage;
                        const isSender = msg.senderId === currentUser?.uid;

                        return (
                            <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn("flex items-end gap-2", isSender && "justify-end")}
                            >
                            {!isSender && (
                                <Avatar className="h-7 w-7 mb-1 shrink-0">
                                <AvatarImage src={otherParticipant?.photoURL} alt={otherParticipant?.displayName} />
                                <AvatarFallback>{otherParticipant?.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            
                            {msg.type === 'book_share' && msg.book ? (
                                    <div className={cn(
                                        "max-w-[280px] rounded-2xl overflow-hidden shadow-md w-full border",
                                        isSender
                                        ? "bg-primary text-primary-foreground rounded-br-none border-primary"
                                        : "bg-background rounded-bl-none"
                                    )}>
                                    <Link href={`/books/${msg.book.id}`} className="block hover:opacity-90 transition-opacity">
                                        <div className="p-3">
                                            <p className="text-[10px] uppercase font-bold tracking-tight opacity-80">Membagikan Buku</p>
                                        </div>
                                        <div className={cn("p-3 flex gap-3 items-start", isSender ? "bg-black/10" : "bg-muted/50")}>
                                            <div className="relative h-20 w-14 flex-shrink-0 shadow-sm">
                                                <Image src={msg.book.coverUrl} alt={msg.book.title} fill className="object-cover rounded-sm bg-muted"/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{msg.book.title}</p>
                                                <p className={cn("text-xs mt-0.5", isSender ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                    oleh {msg.book.authorName}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    </div>
                            ) : (
                                <div className={cn(
                                    "max-w-[75%] md:max-w-[60%] p-3 rounded-2xl shadow-sm",
                                    isSender
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "bg-background rounded-bl-none border"
                                )}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <p className={cn(
                                        "text-[9px] mt-1 text-right opacity-70",
                                        isSender ? "text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {msg.createdAt && typeof (msg.createdAt as any).toDate === 'function' && format((msg.createdAt as any).toDate(), 'HH:mm')}
                                    </p>
                                </div>
                            )}
                            </motion.div>
                        );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-2" />
                    </div>
                </ScrollArea>
              </div>

              {/* Message Input - Tetap Diam */}
              <div className="p-3 border-t bg-background/95 backdrop-blur-md shrink-0 z-20">
                  <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                      <div className="relative flex-1">
                        <Textarea 
                            ref={textareaRef}
                            placeholder="Ketik sebuah pesan..." 
                            className="w-full resize-none rounded-2xl border-input bg-muted/50 p-3 pr-12 min-h-[44px] max-h-32 focus-visible:ring-primary py-2.5"
                            rows={1}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e as any);
                                }
                            }}
                            disabled={isSending}
                        />
                        <div className="absolute right-2 bottom-1.5">
                            <Button 
                                type="submit" 
                                size="icon" 
                                className="h-8 w-8 rounded-full shadow-md" 
                                disabled={isSending || !newMessage.trim()}
                            >
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

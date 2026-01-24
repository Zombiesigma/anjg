'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, type Timestamp, writeBatch, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, MessageSquare, Loader2, Send, Search, ArrowLeft, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isSameDay, format } from 'date-fns';
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

  // 1. Fetch user's chat threads
  const chatThreadsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid))
      : null
  ), [firestore, currentUser]);
  const { data: chatThreads, isLoading: isLoadingThreads } = useCollection<Chat>(chatThreadsQuery);

  // Effect to reset unread count when a chat is opened
  useEffect(() => {
    if (!firestore || !currentUser?.uid || !selectedChatId || !chatThreads) return;

    const chatDocRef = doc(firestore, 'chats', selectedChatId);
    const selectedChatData = chatThreads.find(c => c.id === selectedChatId);
    
    if (selectedChatData?.unreadCounts?.[currentUser.uid] > 0) {
      updateDoc(chatDocRef, {
        [`unreadCounts.${currentUser.uid}`]: 0
      }).catch(error => console.error("Failed to reset unread count:", error));
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

  // 2. Fetch messages for the selected chat
  const messagesQuery = useMemo(() => (
    (firestore && selectedChatId)
      ? query(collection(firestore, 'chats', selectedChatId, 'messages'), orderBy('createdAt', 'asc'))
      : null
  ), [firestore, selectedChatId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(messagesQuery);
  
  const messageGroups = useMemo(() => {
    if (!messages) return [];
    
    const grouped: (ChatMessage | { type: 'date_marker', id: string, date: Date })[] = [];
    
    messages.forEach((msg, index) => {
        if (!msg.createdAt) return; 
        
        const msgDate = msg.createdAt.toDate();
        const prevMsgDate = index > 0 && messages[index - 1].createdAt ? messages[index - 1].createdAt.toDate() : null;

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

    const messageData = {
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
  
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 h-full">
        {/* Chat List */}
        <div className={cn(
          "col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b">
            <h1 className="text-2xl font-headline font-bold">Pesan</h1>
            <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari obrolan atau mulai yang baru" className="pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoadingThreads && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
            {!isLoadingThreads && chatThreads?.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-base text-foreground">Tidak Ada Pesan</h3>
                <p>Mulai percakapan di halaman profil seseorang untuk melihatnya di sini.</p>
              </div>
            )}
            <div className="flex flex-col">
              {chatThreads?.sort((a, b) => (b.lastMessage?.timestamp?.toMillis() || 0) - (a.lastMessage?.timestamp?.toMillis() || 0)).map(chat => {
                const otherP = chat.participants.find(p => p.uid !== currentUser?.uid);
                if (!otherP) return null;
                const unreadCount = chat.unreadCounts?.[currentUser?.uid ?? ''] ?? 0;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 text-left hover:bg-accent w-full transition-colors",
                      selectedChatId === chat.id && "bg-accent/50"
                    )}
                  >
                    <Avatar className="border">
                      <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                      <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{otherP.displayName}</p>
                            {chat.lastMessage?.timestamp && (
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { locale: id, addSuffix: true })}
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
                      <Badge className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 self-center">
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
            "col-span-12 md:col-span-8 lg:col-span-9 h-full flex flex-col",
            selectedChatId ? 'flex' : 'hidden md:flex'
        )}>
          {!selectedChatId && !searchParams.get('chatId') ? (
            <div className="items-center justify-center h-full text-center hidden md:flex flex-col gap-2 bg-muted/30">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <h2 className="mt-2 text-xl font-semibold">Pesan Litera Anda</h2>
              <p className="text-muted-foreground max-w-sm">Pilih dari obrolan yang ada, atau mulai percakapan baru di halaman profil pengguna.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-muted/20">
              {/* Chat Header */}
              <div className="flex items-center p-2.5 border-b bg-background shadow-sm">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                {otherParticipant && (
                   <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.displayName} />
                      <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="font-semibold">{otherParticipant.displayName}</h2>
                   </div>
                )}
                <div className="ml-auto">
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
              
              {/* Messages Area */}
              <ScrollArea className="flex-1">
                {isLoadingMessages && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                <div className="p-4 md:p-6 space-y-2">
                  <AnimatePresence>
                    {messageGroups.map((item) => {
                      if ('type' in item && item.type === 'date_marker') {
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center my-4"
                          >
                            <div className="h-px bg-border flex-1" />
                            <span className="text-xs text-muted-foreground px-3">
                              {format(item.date, 'eeee, d MMMM yyyy', { locale: id })}
                            </span>
                            <div className="h-px bg-border flex-1" />
                          </motion.div>
                        );
                      }

                      const msg = item as ChatMessage;
                      return (
                        <motion.div
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className={cn(
                            "flex items-end gap-2.5",
                            msg.senderId === currentUser?.uid && "justify-end"
                          )}
                        >
                          {msg.senderId !== currentUser?.uid && (
                            <Avatar className="h-8 w-8 self-end">
                              <AvatarImage src={otherParticipant?.photoURL} alt={otherParticipant?.displayName} />
                              <AvatarFallback>{otherParticipant?.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                           <div className={cn(
                            "max-w-lg p-3 rounded-2xl",
                            msg.senderId === currentUser?.uid
                              ? "bg-primary text-primary-foreground rounded-br-lg"
                              : "bg-background rounded-bl-lg shadow-sm"
                          )}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          {msg.senderId === currentUser?.uid && currentUser && (
                            <Avatar className="h-8 w-8 self-end">
                                <AvatarImage src={currentUser.photoURL ?? ''} alt={currentUser.displayName ?? ''}/>
                                <AvatarFallback>{currentUser.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                   <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-2 border-t bg-background/80 backdrop-blur-sm">
                  <form onSubmit={handleSendMessage} className="relative">
                      <Textarea 
                        ref={textareaRef}
                        placeholder="Ketik sebuah pesan..." 
                        className="w-full resize-none rounded-lg border-input bg-background p-3 pr-14 min-h-0"
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
                            }
                        }}
                        disabled={isSending}
                      />
                      <Button type="submit" size="icon" className="absolute top-1/2 right-2.5 -translate-y-1/2 h-9 w-9" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                      </Button>
                  </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

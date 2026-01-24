'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, type Timestamp, writeBatch, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, MessageSquare, Loader2, Send, Search, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function MessagesPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const selectedChat = useMemo(() => (
    chatThreads?.find(chat => chat.id === selectedChatId)
  ), [chatThreads, selectedChatId]);

  const otherParticipant = useMemo(() => (
    selectedChat?.participants.find(p => p.uid !== currentUser?.uid)
  ), [selectedChat, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSelectChat = (chatId: string) => {
    router.push(`/messages?chatId=${chatId}`, { scroll: false });
    setSelectedChatId(chatId);
  }
  
  const handleGoBack = () => {
    router.push('/messages', { scroll: false });
    setSelectedChatId(null);
  };

  const handleSendMessage = async () => {
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
          "col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex-col",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b">
            <h1 className="text-2xl font-headline font-bold">Pesan</h1>
            <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari obrolan" className="pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoadingThreads && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
            {!isLoadingThreads && chatThreads?.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Tidak ada pesan. Mulai percakapan di halaman profil seseorang.
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
                      "flex items-center gap-3 p-4 text-left hover:bg-accent w-full",
                      selectedChatId === chat.id && "bg-accent"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={otherP.photoURL} alt={otherP.displayName} />
                      <AvatarFallback>{otherP.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{otherP.displayName}</p>
                      <p className={cn(
                          "text-sm text-muted-foreground truncate",
                          unreadCount > 0 && "font-bold text-foreground"
                      )}>
                        {chat.lastMessage?.senderId === currentUser?.uid && 'Anda: '}{chat.lastMessage?.text}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0">
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
            "col-span-12 md:col-span-8 lg:col-span-9 h-full flex-col bg-muted/20",
            selectedChatId ? 'flex' : 'hidden md:flex'
        )}>
          {!selectedChatId && !searchParams.get('chatId') ? (
            <div className="items-center justify-center h-full text-center hidden md:flex">
              <div>
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold">Pilih obrolan</h2>
                <p className="text-muted-foreground mt-1">Pilih dari obrolan yang ada, atau mulai yang baru.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex items-center p-4 border-b bg-background">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                {otherParticipant && (
                   <>
                    <Avatar>
                      <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.displayName} />
                      <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="ml-3 font-semibold">{otherParticipant.displayName}</h2>
                   </>
                )}
                <div className="ml-auto">
                    <Button variant="ghost" size="icon"><MoreVertical /></Button>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-muted/20">
                {isLoadingMessages && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                <div className="space-y-4">
                  {messages?.map(msg => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser?.uid && "justify-end")}>
                      {msg.senderId !== currentUser?.uid && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={otherParticipant?.photoURL} alt={otherParticipant?.displayName} />
                          <AvatarFallback>{otherParticipant?.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                       <div className={cn(
                        "max-w-md p-3 rounded-xl",
                        msg.senderId === currentUser?.uid
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-background rounded-bl-none shadow-sm"
                      )}>
                          <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                   <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-background">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                      <Textarea 
                        placeholder="Ketik sebuah pesan..." 
                        className="pr-14"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                      />
                      <Button type="submit" size="icon" className="absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
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

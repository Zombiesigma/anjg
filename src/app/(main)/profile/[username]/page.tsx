'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, limit, addDoc } from 'firebase/firestore';
import type { User, Book, Chat } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookCard } from '@/components/BookCard';
import { UserPlus, MessageCircle, Edit, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const userQuery = useMemo(() => (
    firestore 
      ? query(collection(firestore, 'users'), where('username', '==', params.username), limit(1)) 
      : null
  ), [firestore, params.username]);
  const { data: users, isLoading: isUserLoading } = useCollection<User>(userQuery);
  const user = users?.[0];
  
  const isOwnProfile = user?.uid === currentUser?.uid;
  
  // Single query for all books by author to avoid composite index
  const booksByAuthorQuery = useMemo(() => (
    (firestore && user) 
      ? query(collection(firestore, 'books'), where('authorId', '==', user.uid)) 
      : null
  ), [firestore, user]);
  const { data: allBooks, isLoading: areBooksLoading } = useCollection<Book>(booksByAuthorQuery);

  // Filter books on the client
  const publishedBooks = useMemo(() => allBooks?.filter(book => book.status === 'published'), [allBooks]);
  const draftBooks = useMemo(() => (isOwnProfile ? allBooks?.filter(book => book.status === 'draft') : []), [allBooks, isOwnProfile]);

  const chatsByUserQuery = useMemo(() => (
      (firestore && currentUser) 
        ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid)) 
        : null
    ), [firestore, currentUser]);
  const { data: userChats, isLoading: areChatsLoading } = useCollection<Chat>(chatsByUserQuery);

  const handleStartChat = async () => {
    if (!firestore || !currentUser || !user) return;
    setIsCreatingChat(true);

    const existingChat = userChats?.find(chat => chat.participantUids.includes(user.uid));

    if (existingChat) {
        router.push(`/messages?chatId=${existingChat.id}`);
        return;
    }

    try {
        const newChatData = {
            participantUids: [currentUser.uid, user.uid],
            participants: [
                { uid: currentUser.uid, displayName: currentUser.displayName!, photoURL: currentUser.photoURL! },
                { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
            ],
        };
        const chatsCollection = collection(firestore, 'chats');
        const docRef = await addDoc(chatsCollection, newChatData);
        router.push(`/messages?chatId=${docRef.id}`);
    } catch (error) {
        console.error("Error creating chat:", error);
        toast({
            variant: "destructive",
            title: "Gagal Memulai Obrolan",
            description: "Terjadi kesalahan. Silakan coba lagi.",
        });
    } finally {
        setIsCreatingChat(false);
    }
  };

  if (isUserLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-accent/20" />
        <CardContent className="p-4 md:p-6 -mt-16 md:-mt-24">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback className="text-4xl">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <h1 className="text-3xl font-bold font-headline">{user.displayName}</h1>
                        <Badge variant={user.role === 'penulis' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                    </div>
                    <p className="text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile ? (
                        <Link href="/settings">
                          <Button><Edit className="mr-2 h-4 w-4"/> Edit Profil</Button>
                        </Link>
                    ) : (
                        <>
                            <Button><UserPlus className="mr-2 h-4 w-4"/> Ikuti</Button>
                            <Button variant="outline" onClick={handleStartChat} disabled={isCreatingChat || areChatsLoading}>
                                {(isCreatingChat || areChatsLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4"/>}
                                Pesan
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <p className="mt-4 text-center md:text-left max-w-2xl">{user.bio}</p>
            <div className="flex justify-center md:justify-start gap-6 mt-4 pt-4 border-t">
                <div className="text-center">
                    <p className="font-bold text-lg">{areBooksLoading ? '...' : publishedBooks?.length ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Buku Terbit</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">{new Intl.NumberFormat('id-ID').format(user.followers)}</p>
                    <p className="text-sm text-muted-foreground">Pengikut</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">{new Intl.NumberFormat('id-ID').format(user.following)}</p>
                    <p className="text-sm text-muted-foreground">Mengikuti</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="published-books">
        <TabsList>
            <TabsTrigger value="published-books">Buku Terbitan</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="drafts">Draf</TabsTrigger>}
            <TabsTrigger value="favorites">Favorit</TabsTrigger>
        </TabsList>
        <TabsContent value="published-books">
             {areBooksLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="aspect-[2/3] w-full" />
                        <Skeleton className="h-5 w-3/4 mt-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {publishedBooks?.map(book => <BookCard key={book.id} book={book} />)}
            </div>
            {!areBooksLoading && publishedBooks?.length === 0 && <p className="text-muted-foreground text-center py-8">{isOwnProfile ? "Anda" : "Pengguna ini"} belum menerbitkan buku apa pun.</p>}
        </TabsContent>
        {isOwnProfile && (
          <TabsContent value="drafts">
               {areBooksLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="aspect-[2/3] w-full" />
                          <Skeleton className="h-5 w-3/4 mt-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                  </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {draftBooks?.map(book => <BookCard key={book.id} book={book} />)}
              </div>
              {!areBooksLoading && draftBooks?.length === 0 && <p className="text-muted-foreground text-center py-8">Anda tidak memiliki draf buku.</p>}
          </TabsContent>
        )}
        <TabsContent value="favorites">
            <p className="text-muted-foreground text-center py-8">Fitur ini sedang dalam pengembangan.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}


function ProfileSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Card>
                <Skeleton className="h-32 md:h-48 w-full" />
                <CardContent className="p-4 md:p-6 -mt-16 md:-mt-24">
                     <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                        <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background" />
                        <div className="flex-1 text-center md:text-left space-y-2">
                             <Skeleton className="h-9 w-48 mx-auto md:mx-0" />
                             <Skeleton className="h-5 w-24 mx-auto md:mx-0" />
                        </div>
                         <div className="flex gap-2">
                             <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                     <Skeleton className="h-4 w-full max-w-lg mt-4" />
                     <div className="flex justify-center md:justify-start gap-6 mt-4 pt-4 border-t">
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-10 w-16" />
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-10 w-48" />
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[2/3] w-full" />
                    <Skeleton className="h-5 w-3/4 mt-2" />
                    <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    )
}

'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, where, limit, addDoc, documentId, doc, writeBatch, increment, serverTimestamp, orderBy, getDoc, type Query, type DocumentData } from 'firebase/firestore';
import type { User, Book, Chat, Favorite, Follow, Story } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookCard } from '@/components/BookCard';
import { UserPlus, MessageCircle, Edit, Loader2, UserMinus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsBack, setFollowsBack] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const userQuery = useMemo(() => (
    firestore 
      ? query(collection(firestore, 'users'), where('username', '==', params.username), limit(1)) 
      : null
  ), [firestore, params.username]);
  const { data: users, isLoading: isUserLoading } = useCollection<User>(userQuery);
  const user = users?.[0];

  const { data: currentUserProfile, isLoading: isCurrentUserProfileLoading } = useDoc<User>(
    (currentUser && firestore) ? doc(firestore, 'users', currentUser.uid) : null
  );
  
  const isOwnProfile = user?.uid === currentUser?.uid;

  useEffect(() => {
    if (!user) return;
    const checkStatus = () => {
        if (!user.status || user.status === 'offline' || !user.lastSeen) {
            setIsOnline(false);
            return;
        }
        // User is online if lastSeen is less than 5 minutes ago
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        setIsOnline(user.lastSeen.toMillis() > fiveMinutesAgo);
    }
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // check every minute
    return () => clearInterval(interval);
  }, [user]);


  const followingRef = useMemo(() => (
    (firestore && currentUser && user && !isOwnProfile)
      ? doc(firestore, 'users', currentUser.uid, 'following', user.uid)
      : null
  ), [firestore, currentUser, user, isOwnProfile]);
  const { data: followingDoc, isLoading: isFollowingLoading } = useDoc<Follow>(followingRef);
  
  const followerRef = useMemo(() => (
    (firestore && currentUser && user && !isOwnProfile)
      ? doc(firestore, 'users', user.uid, 'following', currentUser.uid)
      : null
  ), [firestore, currentUser, user, isOwnProfile]);
  const { data: isFollowerDoc, isLoading: isFollowerLoading } = useDoc<Follow>(followerRef);

  useEffect(() => {
    setIsFollowing(!!followingDoc);
  }, [followingDoc]);
  
  useEffect(() => {
    setFollowsBack(!!isFollowerDoc);
  }, [isFollowerDoc]);
  
  const publishedBooksQuery = useMemo(() => (
    (firestore && user) 
      ? query(collection(firestore, 'books'), where('authorId', '==', user.uid), where('status', '==', 'published')) 
      : null
  ), [firestore, user]);
  const { data: publishedBooks, isLoading: arePublishedBooksLoading } = useCollection<Book>(publishedBooksQuery);

  const otherBooksQuery = useMemo(() => (
    (firestore && user && isOwnProfile)
      ? query(collection(firestore, 'books'), where('authorId', '==', user.uid), where('status', 'in', ['draft', 'pending_review', 'rejected']))
      : null
  ), [firestore, user, isOwnProfile]);
  const { data: otherBooks, isLoading: areOtherBooksLoading } = useCollection<Book>(otherBooksQuery);

  const areBooksLoading = arePublishedBooksLoading || (isOwnProfile && areOtherBooksLoading);

  const chatsByUserQuery = useMemo(() => (
      (firestore && currentUser) 
        ? query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid)) 
        : null
    ), [firestore, currentUser]);
  const { data: userChats, isLoading: areChatsLoading } = useCollection<Chat>(chatsByUserQuery);

  const favoritesQuery = useMemo(() => (
    (firestore && user && isOwnProfile) ? query(collection(firestore, 'users', user.uid, 'favorites')) : null
  ), [firestore, user, isOwnProfile]);
  const { data: favorites, isLoading: areFavoritesLoading } = useCollection<Favorite>(favoritesQuery);

  const favoriteBookIds = useMemo(() => favorites?.map(f => f.id) || [], [favorites]);

  const favoriteBooksQuery = useMemo(() => {
      if (!firestore || favoriteBookIds.length === 0 || !isOwnProfile) return null;
      // Firestore 'in' queries are limited to 30 elements in a single query.
      const chunks = favoriteBookIds.slice(0, 30);
      if (chunks.length === 0) return null;
      return query(collection(firestore, 'books'), where(documentId(), 'in', chunks));
  }, [firestore, favoriteBookIds, isOwnProfile]);
  const { data: favoriteBooks, isLoading: areFavoriteBooksLoading } = useCollection<Book>(favoriteBooksQuery);
  
  const [allActiveStoriesQuery, setAllActiveStoriesQuery] = useState<Query<DocumentData> | null>(null);

  useEffect(() => {
    if (firestore) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      setAllActiveStoriesQuery(
        query(
          collection(firestore, 'stories'),
          where('createdAt', '>', twentyFourHoursAgo),
          orderBy('createdAt', 'desc')
        )
      );
    }
  }, [firestore]);
  
  const { data: allActiveStories, isLoading: areStoriesLoading } = useCollection<Story>(allActiveStoriesQuery);
  const userHasActiveStory = useMemo(() => (
      allActiveStories?.some(story => story.authorId === user?.uid)
  ), [allActiveStories, user]);


  const handleStartChat = async () => {
    if (!firestore || !currentUser || !user || !currentUserProfile) return;
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
                { uid: currentUser.uid, displayName: currentUser.displayName!, photoURL: currentUser.photoURL!, username: currentUserProfile.username },
                { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, username: user.username }
            ],
            unreadCounts: {
                [currentUser.uid]: 0,
                [user.uid]: 0,
            },
            lastMessage: {
                text: 'Percakapan dimulai.',
                senderId: 'system',
                timestamp: serverTimestamp()
            }
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

  const handleToggleFollow = async () => {
    if (!firestore || !currentUser || !user || isOwnProfile || !currentUserProfile) return;
    setIsTogglingFollow(true);

    const followingDocRef = doc(firestore, 'users', currentUser.uid, 'following', user.uid);
    const followerDocRef = doc(firestore, 'users', user.uid, 'followers', currentUser.uid);
    const currentUserProfileRef = doc(firestore, 'users', currentUser.uid);
    const targetUserProfileRef = doc(firestore, 'users', user.uid);

    try {
        const batch = writeBatch(firestore);
        if (isFollowing) {
            batch.delete(followingDocRef);
            batch.delete(followerDocRef);
            batch.update(currentUserProfileRef, { following: increment(-1) });
            batch.update(targetUserProfileRef, { followers: increment(-1) });
        } else {
            const followData = { userId: currentUser.uid, followedAt: serverTimestamp() };
            batch.set(followingDocRef, followData);
            batch.set(followerDocRef, followData);
            batch.update(currentUserProfileRef, { following: increment(1) });
            batch.update(targetUserProfileRef, { followers: increment(1) });
        }
        await batch.commit();

        if (!isFollowing) {
            const targetUserDoc = await getDoc(targetUserProfileRef);
            if (targetUserDoc.exists()) {
                const targetUserProfileData = targetUserDoc.data() as User;
                if (targetUserProfileData.notificationPreferences?.onNewFollower !== false) {
                    const notificationData = {
                        type: 'follow' as const,
                        text: `${currentUser.displayName} mulai mengikuti Anda.`,
                        link: `/profile/${currentUserProfile.username}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName!,
                            photoURL: currentUser.photoURL!,
                        },
                        read: false,
                        createdAt: serverTimestamp()
                    };
                    const notificationsCol = collection(firestore, 'users', user.uid, 'notifications');
                    await addDoc(notificationsCol, notificationData);
                }
            }
            toast({ title: `Anda sekarang mengikuti ${user.displayName}` });
        } else {
            toast({ title: `Anda berhenti mengikuti ${user.displayName}` });
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        toast({
            variant: "destructive",
            title: "Gagal Mengikuti",
            description: "Terjadi kesalahan. Silakan coba lagi.",
        });
    } finally {
        setIsTogglingFollow(false);
    }
  };

  if (isUserLoading || areStoriesLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    notFound();
  }

  return (
    <>
      {userHasActiveStory && allActiveStories && (
        <StoryViewer
          stories={allActiveStories}
          initialAuthorId={user.uid}
          isOpen={isStoryViewerOpen}
          onClose={() => setIsStoryViewerOpen(false)}
        />
      )}
      <div className="space-y-8">
        <Card className="overflow-hidden">
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-accent/20" />
          <CardContent className="p-4 md:p-6 -mt-16 md:-mt-24">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                  <button
                    disabled={!userHasActiveStory}
                    onClick={() => userHasActiveStory && setIsStoryViewerOpen(true)}
                    className="relative rounded-full disabled:cursor-default"
                  >
                    <Avatar className={cn(
                      "w-24 h-24 md:w-32 md:h-32 border-4 shadow-lg",
                      userHasActiveStory ? "border-primary" : "border-background"
                    )}>
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="text-4xl">{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                     {isOnline && (
                        <span className="absolute bottom-1 right-1 block h-6 w-6 rounded-full bg-green-500 border-4 border-card" title="Online" />
                    )}
                  </button>
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
                              <Button onClick={handleToggleFollow} disabled={isTogglingFollow || isFollowingLoading || isCurrentUserProfileLoading || isFollowerLoading} variant={isFollowing ? "outline" : "default"}>
                                {(isTogglingFollow || isFollowingLoading || isCurrentUserProfileLoading || isFollowerLoading) ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                ) : (
                                  isFollowing ? <UserMinus className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4"/>
                                )}
                                {isFollowing ? 'Berhenti Mengikuti' : (followsBack ? 'Follback' : 'Ikuti')}
                              </Button>
                              <Button variant="outline" onClick={handleStartChat} disabled={isCreatingChat || areChatsLoading || isCurrentUserProfileLoading}>
                                  {(isCreatingChat || areChatsLoading || isCurrentUserProfileLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4"/>}
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
              {isOwnProfile && <TabsTrigger value="favorites">Favorit</TabsTrigger>}
          </TabsList>
          <TabsContent value="published-books">
               {arePublishedBooksLoading && (
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
              {!arePublishedBooksLoading && publishedBooks?.length === 0 && <p className="text-muted-foreground text-center py-8">{isOwnProfile ? "Anda" : "Pengguna ini"} belum menerbitkan buku apa pun.</p>}
          </TabsContent>
          {isOwnProfile && (
            <TabsContent value="drafts">
                 {areOtherBooksLoading && (
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
                    {otherBooks?.map(book => <BookCard key={book.id} book={book} />)}
                </div>
                {!areOtherBooksLoading && otherBooks?.length === 0 && <p className="text-muted-foreground text-center py-8">Anda tidak memiliki draf buku.</p>}
            </TabsContent>
          )}
          {isOwnProfile && (
              <TabsContent value="favorites">
                  {(areFavoritesLoading || areFavoriteBooksLoading) && (
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
                      {favoriteBooks?.map(book => <BookCard key={book.id} book={book} />)}
                  </div>
                  {!(areFavoritesLoading || areFavoriteBooksLoading) && favoriteBooks?.length === 0 && <p className="text-muted-foreground text-center py-8">Anda belum memfavoritkan buku apa pun.</p>}
              </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  )
}


function ProfileSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Card className="overflow-hidden">
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

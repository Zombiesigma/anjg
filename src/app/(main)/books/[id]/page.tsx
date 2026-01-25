'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, writeBatch, getDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Eye, BookOpen, Send, MessageCircle, Loader2, Edit, Layers, Heart, Share2 } from 'lucide-react';
import type { Book, Comment, User, Favorite } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BookCommentItem } from '@/components/comments/BookCommentItem';

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const bookRef = useMemo(() => (
    firestore ? doc(firestore, 'books', params.id) : null
  ), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const authorRef = useMemo(() => (
    (firestore && book?.authorId) ? doc(firestore, 'users', book.authorId) : null
  ), [firestore, book]);
  const { data: author, isLoading: isAuthorLoading } = useDoc<User>(authorRef);

  const commentsQuery = useMemo(() => (
    firestore 
      ? query(collection(firestore, 'books', params.id, 'comments'), orderBy('createdAt', 'desc')) 
      : null
  ), [firestore, params.id]);
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);
  
  const favoriteRef = useMemo(() => (
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid, 'favorites', params.id) : null
  ), [firestore, currentUser, params.id]);
  const { data: favoriteDoc, isLoading: isFavoriteLoading } = useDoc<Favorite>(favoriteRef);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const viewIncremented = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    // Increment view count only once
    if (book && bookRef && !viewIncremented.current) {
        updateDoc(bookRef, { viewCount: increment(1) })
            .catch(err => console.error("Failed to increment view count", err));
        viewIncremented.current = true;
    }
  }, [book, bookRef]);

  useEffect(() => {
    setIsFavorite(!!favoriteDoc);
  }, [favoriteDoc]);

  const isAuthor = currentUser?.uid === book?.authorId;

  function handleCommentSubmit() {
    if (!newComment.trim() || !currentUser || !firestore || !book) return;

    setIsSubmitting(true);
    const commentsCol = collection(firestore, 'books', params.id, 'comments');
    const commentData = {
      text: newComment,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatarUrl: currentUser.photoURL,
      createdAt: serverTimestamp(),
      likeCount: 0,
      replyCount: 0,
    };

    addDoc(commentsCol, commentData)
      .then(async () => {
        setNewComment('');
        // Add notification if not commenting on own book and if preferences allow
        if (currentUser.uid !== book.authorId) {
            const authorDoc = await getDoc(doc(firestore, 'users', book.authorId));
            if (authorDoc.exists()) {
                const authorProfile = authorDoc.data() as User;
                if (authorProfile.notificationPreferences?.onBookComment !== false) {
                    const notificationsCol = collection(firestore, 'users', book.authorId, 'notifications');
                    addDoc(notificationsCol, {
                        type: 'comment' as const,
                        text: `${currentUser.displayName} mengomentari buku Anda: ${book.title}`,
                        link: `/books/${params.id}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName!,
                            photoURL: currentUser.photoURL!,
                        },
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
            }
        }
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: commentsCol.path,
          operation: 'create',
          requestResourceData: commentData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  const handleToggleFavorite = async () => {
    if (!firestore || !currentUser || !bookRef || !book) {
        toast({
            variant: "destructive",
            title: "Harap masuk",
            description: "Anda harus masuk untuk menambahkan ke favorit.",
        });
        return;
    };
    setIsTogglingFavorite(true);

    const favoriteDocRef = doc(firestore, 'users', currentUser.uid, 'favorites', params.id);
    const batch = writeBatch(firestore);

    try {
        if (isFavorite) {
            // Remove from favorites
            batch.delete(favoriteDocRef);
            batch.update(bookRef, { favoriteCount: increment(-1) });
        } else {
            // Add to favorites
            batch.set(favoriteDocRef, {
                userId: currentUser.uid,
                addedAt: serverTimestamp()
            });
            batch.update(bookRef, { favoriteCount: increment(1) });
        }
        await batch.commit();

        // Handle notification outside of batch
        if (!isFavorite && currentUser.uid !== book.authorId) {
            const authorDoc = await getDoc(doc(firestore, 'users', book.authorId));
             if (authorDoc.exists()) {
                const authorProfile = authorDoc.data() as User;
                if (authorProfile.notificationPreferences?.onBookFavorite !== false) {
                    const notificationsCol = collection(firestore, 'users', book.authorId, 'notifications');
                    addDoc(notificationsCol, {
                        type: 'favorite' as const,
                        text: `${currentUser.displayName} menyukai buku Anda: ${book.title}`,
                        link: `/books/${params.id}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName!,
                            photoURL: currentUser.photoURL!,
                        },
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }
             }
        }

        toast({
            title: isFavorite ? "Dihapus dari Favorit" : "Ditambahkan ke Favorit",
        });
    } catch (error) {
        console.error("Error toggling favorite: ", error);
        toast({
            variant: "destructive",
            title: "Gagal",
            description: "Terjadi kesalahan. Silakan coba lagi.",
        });
    } finally {
        setIsTogglingFavorite(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;
    const shareData = {
      title: book.title,
      text: `Lihat buku "${book.title}" oleh ${book.authorName} di Elitera!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Tautan Disalin",
          description: "Tautan buku telah disalin ke clipboard Anda.",
        });
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast({
          variant: "destructive",
          title: "Gagal Menyalin",
          description: "Tidak dapat menyalin tautan ke clipboard.",
        });
      }
    }
  };

  if (isBookLoading || isAuthorLoading) {
    return <BookDetailsSkeleton />;
  }

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <div className="aspect-[2/3] relative">
              <Image
                src={book.coverUrl}
                alt={`Sampul ${book.title}`}
                fill
                className="object-cover bg-muted"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <CardContent className="p-4 grid grid-cols-3 gap-4 text-sm text-center">
                <div className="flex flex-col items-center gap-1">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{isMounted ? new Intl.NumberFormat('id-ID').format(book.viewCount) : '...'}</span>
                    <span className="text-xs text-muted-foreground">Dilihat</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{isMounted ? new Intl.NumberFormat('id-ID').format(book.favoriteCount) : '...'}</span>
                    <span className="text-xs text-muted-foreground">Favorit</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{isMounted ? book.chapterCount ?? 0 : '...'}</span>
                    <span className="text-xs text-muted-foreground">Bab</span>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div>
            <Badge>{book.genre}</Badge>
            <h1 className="text-4xl font-headline font-bold mt-2">{book.title}</h1>
            <div className="flex items-center gap-2 mt-4">
              <Avatar>
                <AvatarImage src={book.authorAvatarUrl} alt={book.authorName} />
                <AvatarFallback>{book.authorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Link href={author ? `/profile/${author.username}` : '#'} className="font-medium hover:underline">{book.authorName}</Link>
            </div>
          </div>
          <div className="space-y-4">
              <h2 className="text-xl font-headline font-semibold">Sinopsis</h2>
              <p className="text-muted-foreground leading-relaxed">{book.synopsis}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href={`/books/${book.id}/read`} className="flex-1">
                <Button size="lg" className="w-full"><BookOpen className="mr-2 h-5 w-5"/> Baca Sekarang</Button>
            </Link>
            <Button size="lg" variant="outline" className="flex-1" onClick={handleToggleFavorite} disabled={isTogglingFavorite || isFavoriteLoading}>
              {isTogglingFavorite ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Heart className={cn("mr-2 h-5 w-5", isFavorite && "fill-current text-red-500")}/>}
              {isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
            </Button>
            <Button size="lg" variant="outline" className="flex-1 w-full" onClick={handleShare}>
                <Share2 className="mr-2 h-5 w-5" /> Bagikan
            </Button>
            {isAuthor && (
              <Link href={`/books/${book.id}/edit`} className="flex-1">
                <Button size="lg" variant="outline" className="w-full"><Edit className="mr-2 h-5 w-5"/> Edit Buku</Button>
              </Link>
            )}
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><MessageCircle/> Komentar</h2>
            {currentUser && (
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={currentUser.photoURL ?? ''} alt={currentUser.displayName ?? ''} />
                  <AvatarFallback>{currentUser.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="w-full relative">
                  <Textarea 
                    placeholder="Tambahkan komentar..." 
                    className="w-full pr-12"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleCommentSubmit} disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
                {areCommentsLoading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>}
                {comments?.map(comment => (
                  <BookCommentItem key={comment.id} bookId={params.id} comment={comment} />
                ))}
                {!areCommentsLoading && comments?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Jadilah yang pertama berkomentar.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookDetailsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="overflow-hidden sticky top-20">
                        <Skeleton className="aspect-[2/3] w-full" />
                        <CardContent className="p-4 grid grid-cols-3 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-12 w-3/4 rounded-md" />
                    <div className="flex items-center gap-2 mt-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-6 w-48 rounded-md" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-8 w-32 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full rounded-md" />
                            <Skeleton className="h-4 w-full rounded-md" />
                            <Skeleton className="h-4 w-5/6 rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    )
}

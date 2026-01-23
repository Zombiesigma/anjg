'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Download, BookOpen, Send, MessageCircle, Loader2 } from 'lucide-react';
import type { Book, Comment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const bookRef = firestore ? doc(firestore, 'books', params.id) : null;
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const commentsQuery = useMemo(() => (
    firestore 
      ? query(collection(firestore, 'books', params.id, 'comments'), orderBy('createdAt', 'desc')) 
      : null
  ), [firestore, params.id]);
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleCommentSubmit() {
    if (!newComment.trim() || !currentUser || !firestore) return;

    setIsSubmitting(true);
    const commentsCol = collection(firestore, 'books', params.id, 'comments');
    const commentData = {
      text: newComment,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatarUrl: currentUser.photoURL,
      createdAt: serverTimestamp(),
    };

    addDoc(commentsCol, commentData)
      .then(() => {
        setNewComment('');
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

  if (isBookLoading) {
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
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm text-center">
                <div className="flex flex-col items-center gap-1">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{isMounted ? new Intl.NumberFormat('id-ID').format(book.viewCount) : '...'}</span>
                    <span className="text-xs text-muted-foreground">Dilihat</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Download className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{isMounted ? new Intl.NumberFormat('id-ID').format(book.downloadCount) : '...'}</span>
                    <span className="text-xs text-muted-foreground">Unduhan</span>
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
              <Link href={`/profile/${book.authorName}`} className="font-medium hover:underline">{book.authorName}</Link>
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
            <Button size="lg" variant="outline" className="flex-1"><Download className="mr-2 h-5 w-5"/> Unduh eBook</Button>
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
            
            <div className="space-y-6">
                {areCommentsLoading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>}
                {comments?.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                            <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm">{comment.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {isMounted && comment.createdAt ? comment.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : '...'}
                                    </span>
                                </div>
                                <p className="text-sm mt-1">{comment.text}</p>
                            </div>
                        </div>
                    </div>
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
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
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

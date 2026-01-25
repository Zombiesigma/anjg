'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, writeBatch, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Send, Loader2 } from 'lucide-react';
import type { Comment, BookCommentLike } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface BookCommentItemProps {
    bookId: string;
    comment: Comment;
}

export function BookCommentItem({ bookId, comment }: BookCommentItemProps) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Like Logic ---
    const likeRef = useMemo(() => (
        (firestore && currentUser) ? doc(firestore, 'books', bookId, 'comments', comment.id, 'likes', currentUser.uid) : null
    ), [firestore, currentUser, bookId, comment.id]);
    const { data: likeDoc } = useDoc<BookCommentLike>(likeRef);
    const isLiked = !!likeDoc;
    
    const handleToggleLike = async () => {
        if (!likeRef || !firestore || !currentUser) {
            toast({ variant: 'destructive', title: 'Anda harus masuk untuk menyukai.' });
            return;
        }
        setIsLiking(true);
        const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);
        const batch = writeBatch(firestore);

        try {
            if (isLiked) {
                batch.delete(likeRef);
                batch.update(commentRef, { likeCount: increment(-1) });
            } else {
                batch.set(likeRef, { userId: currentUser.uid, likedAt: serverTimestamp() });
                batch.update(commentRef, { likeCount: increment(1) });
            }
            await batch.commit();
        } catch (error) {
            console.error("Error toggling comment like:", error);
            toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan.' });
        } finally {
            setIsLiking(false);
        }
    };

    // --- Reply Logic ---
    const repliesQuery = useMemo(() => (
        firestore ? query(collection(firestore, 'books', bookId, 'comments', comment.id, 'replies'), orderBy('createdAt', 'asc')) : null
    ), [firestore, bookId, comment.id]);
    const { data: replies, isLoading: areRepliesLoading } = useCollection<Comment>(repliesQuery);

    const handleReplySubmit = async () => {
        if (!replyText.trim() || !currentUser || !firestore) return;

        setIsSubmittingReply(true);
        const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);
        const repliesCol = collection(commentRef, 'replies');
        
        const replyData = {
            text: replyText,
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userAvatarUrl: currentUser.photoURL,
            createdAt: serverTimestamp(),
            likeCount: 0,
            replyCount: 0, // Replies cannot be replied to in this implementation
        };

        const batch = writeBatch(firestore);
        batch.set(doc(repliesCol), replyData);
        batch.update(commentRef, { replyCount: increment(1) });

        try {
            await batch.commit();
            setReplyText('');
            setShowReplyInput(false);
            toast({ title: "Balasan terkirim!" });
        } catch (error) {
            console.error("Error submitting reply:", error);
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengirim balasan.' });
        } finally {
            setIsSubmittingReply(false);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Main Comment */}
            <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                    <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                                {isMounted && comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { locale: id, addSuffix: true }) : '...'}
                            </span>
                        </div>
                        <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 px-2 pt-1">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleToggleLike} disabled={isLiking}>
                            <Heart className={cn("h-3.5 w-3.5 mr-1.5", isLiked && "fill-red-500 text-red-500")} />
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                            <span className="ml-1">{isLiked ? 'Batal Suka' : 'Suka'}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowReplyInput(!showReplyInput)}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            {comment.replyCount > 0 && <span>{comment.replyCount}</span>}
                             <span className="ml-1">Balas</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {showReplyInput && currentUser && (
                <div className="flex items-start gap-3 pl-12 pt-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.photoURL ?? ''} alt={currentUser.displayName ?? ''} />
                        <AvatarFallback>{currentUser.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full relative">
                        <Textarea 
                            placeholder={`Balas kepada ${comment.userName}...`}
                            className="w-full pr-12 text-sm"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            disabled={isSubmittingReply}
                        />
                        <Button size="icon" className="absolute top-1.5 right-1.5 h-7 w-7" onClick={handleReplySubmit} disabled={isSubmittingReply || !replyText.trim()}>
                            {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Replies List */}
            {replies && replies.length > 0 && (
                <div className="pl-12 pt-4 space-y-4">
                    {replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={reply.userAvatarUrl} alt={reply.userName} />
                                <AvatarFallback>{reply.userName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="bg-muted/50 p-2.5 rounded-lg rounded-tl-none">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-sm">{reply.userName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {isMounted && reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate(), { locale: id, addSuffix: true }) : '...'}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">{reply.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, increment, writeBatch } from 'firebase/firestore';
import type { ReelComment } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Send, Clock, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ReelCommentsSheetProps {
  reelId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ReelCommentsSheet({ reelId, isOpen, onOpenChange }: ReelCommentsSheetProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        setCommentText("");
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const commentsQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'reels', reelId, 'comments'), orderBy('createdAt', 'desc')) : null
  ), [firestore, reelId]);

  const { data: comments, isLoading } = useCollection<ReelComment>(commentsQuery);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || !firestore || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      const commentsCol = collection(firestore, 'reels', reelId, 'comments');
      const reelRef = doc(firestore, 'reels', reelId);

      const newComment = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Pujangga Elitera',
        userAvatarUrl: currentUser.photoURL || '',
        text: commentText.trim(),
        createdAt: serverTimestamp()
      };

      batch.set(doc(commentsCol), newComment);
      batch.update(reelRef, { commentCount: increment(1) });

      await batch.commit();
      setCommentText("");
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat mengirim komentar.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] md:h-[65vh] flex flex-col rounded-t-[3rem] border-t-0 bg-background p-0 overflow-hidden z-[300] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)]"
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <div className="mx-auto w-16 h-1.5 bg-muted rounded-full mt-4 shrink-0 opacity-50" />
        
        <SheetHeader className="px-8 pt-6 pb-6 text-left shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="h-6 w-6" />
                    <SheetTitle className="text-2xl font-headline font-black tracking-tight">Komentar</SheetTitle>
                </div>
                <SheetDescription className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {isLoading ? 'Menghubungkan pikiran...' : `${comments?.length || 0} suara pujangga`}
                </SheetDescription>
            </div>
            <div className="bg-primary/5 p-3 rounded-2xl">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>
        </SheetHeader>

        <Separator className="opacity-50" />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5 p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Memuat Diskusi...</p>
                </div>
            ) : !comments || comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-30">
                    <div className="bg-muted p-8 rounded-[2rem] mb-6">
                        <MessageSquare className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h3 className="font-headline text-xl font-bold">Belum Ada Suara</h3>
                    <p className="text-sm max-w-[240px] mx-auto mt-2 leading-relaxed">Jadilah yang pertama mengapresiasi karya video ini.</p>
                </div>
            ) : (
                <div className="space-y-6">
                {comments.map((comment) => (
                    <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4"
                    >
                    <Avatar className="h-10 w-10 border-2 border-background shrink-0 shadow-sm">
                        <AvatarImage src={comment.userAvatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary font-black">
                            {comment.userName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-sm truncate">{comment.userName}</p>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                                {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { locale: id, addSuffix: true }) : 'Baru saja'}
                            </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium bg-white/50 dark:bg-zinc-900/50 p-3 rounded-2xl rounded-tl-none border border-white/10">
                            {comment.text}
                        </p>
                    </div>
                    </motion.div>
                ))}
                </div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t bg-background/95 backdrop-blur-md">
            <form onSubmit={handleSendComment} className="flex items-center gap-3 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Input 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="Tulis pesan penyemangat..." 
                    className="relative flex-1 h-14 rounded-2xl bg-muted/30 border-none px-6 font-medium focus-visible:ring-primary/20"
                    disabled={isSubmitting}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="relative h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-all active:scale-90"
                    disabled={isSubmitting || !commentText.trim()}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
        </div>
      </SheetContent>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </Sheet>
  );
}

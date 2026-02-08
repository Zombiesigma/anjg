'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, serverTimestamp, writeBatch, increment, addDoc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import type { Story, User as AppUser, StoryLike } from '@/lib/types';
import { X, Heart, MessageSquare, Send as SendIcon, ChevronLeft, ChevronRight, Loader2, Eye, MoreHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { StoryViewersSheet } from './StoryViewersSheet';
import { StoryCommentsSheet } from './StoryCommentsSheet';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
  stories: Story[];
  initialAuthorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewer({ stories, initialAuthorId, isOpen, onClose }: StoryViewerProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [authorIndex, setAuthorIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const viewedStoriesInSession = useRef(new Set<string>());

  useEffect(() => {
    if (!isOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const storyGroups = useMemo(() => {
    const groups: { [key: string]: { authorId: string; authorName: string; authorAvatarUrl: string; authorRole: string; stories: Story[] } } = {};
    stories.forEach(story => {
      if (!groups[story.authorId]) {
        groups[story.authorId] = {
          authorId: story.authorId,
          authorName: story.authorName,
          authorAvatarUrl: story.authorAvatarUrl,
          authorRole: story.authorRole,
          stories: [],
        };
      }
      groups[story.authorId].stories.push(story);
    });
    return Object.values(groups).sort((a,b) => b.stories[0].createdAt.toMillis() - a.stories[0].createdAt.toMillis());
  }, [stories]);
  
  useEffect(() => {
    const initialIndex = storyGroups.findIndex(g => g.authorId === initialAuthorId);
    if (initialIndex !== -1) {
      setAuthorIndex(initialIndex);
      setStoryIndex(0);
    }
  }, [initialAuthorId, storyGroups]);

  const currentGroup = storyGroups[authorIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const nextStory = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(s => s + 1);
    } else if (authorIndex < storyGroups.length - 1) {
      setAuthorIndex(a => a + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, authorIndex, currentGroup, storyGroups.length, onClose]);

  const prevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(s => s - 1);
    } else if (authorIndex > 0) {
      const prevGroup = storyGroups[authorIndex - 1];
      setAuthorIndex(a => a - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }, [storyIndex, authorIndex, storyGroups]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('form') || target.closest('input')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      prevStory();
    } else {
      nextStory();
    }
  };
  
  useEffect(() => {
    if (!isOpen || isPaused || showViews || showComments) return;

    const timer = setTimeout(() => {
      nextStory();
    }, 7000); 

    return () => clearTimeout(timer);
  }, [storyIndex, authorIndex, isOpen, isPaused, showViews, showComments, nextStory]);
  
  useEffect(() => {
    if (!currentStory || !currentUser || !firestore) return;

    const isAuthor = currentStory.authorId === currentUser.uid;
    const hasBeenViewed = viewedStoriesInSession.current.has(currentStory.id);

    if (!isAuthor && !hasBeenViewed) {
      const storyRef = doc(firestore, 'stories', currentStory.id);
      const viewRef = doc(firestore, 'stories', currentStory.id, 'views', currentUser.uid);
      
      const batch = writeBatch(firestore);
      batch.update(storyRef, { viewCount: increment(1) });
      batch.set(viewRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Pujangga Anonim',
        userAvatarUrl: currentUser.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${currentUser.uid}`,
        viewedAt: serverTimestamp()
      });

      batch.commit().then(() => {
        viewedStoriesInSession.current.add(currentStory.id);
      }).catch(err => {
        console.warn("Failed to record story view:", err);
      });
    }
  }, [currentStory, currentUser, firestore]);

  const likeRef = useMemo(() => (
    firestore && currentUser && currentStory ? doc(firestore, 'stories', currentStory.id, 'likes', currentUser.uid) : null
  ), [firestore, currentUser, currentStory]);
  const { data: likeDoc, isLoading: isLikeLoading } = useDoc<StoryLike>(likeRef);
  const isLiked = !!likeDoc;
  
  const handleToggleLike = async () => {
    if (!likeRef || !firestore || !currentStory || !currentUser) return;
    const storyRef = doc(firestore, 'stories', currentStory.id);
    const batch = writeBatch(firestore);

    if (isLiked) {
      batch.delete(likeRef);
      batch.update(storyRef, { likes: increment(-1) });
    } else {
      batch.set(likeRef, { userId: currentUser!.uid, likedAt: serverTimestamp() });
      batch.update(storyRef, { likes: increment(1) });
    }
    await batch.commit();
  }
  
  const [comment, setComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const isAuthor = currentGroup?.authorId === currentUser?.uid;

  const handleComment = async () => {
    if(!comment.trim() || !currentUser || !firestore || !currentStory) return;
    setIsSendingComment(true);

    const storyRef = doc(firestore, 'stories', currentStory.id);
    const commentsCol = collection(firestore, 'stories', currentStory.id, 'comments');
    const batch = writeBatch(firestore);

    batch.set(doc(commentsCol), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Pujangga Elitera',
        userAvatarUrl: currentUser.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${currentUser.uid}`,
        text: comment,
        createdAt: serverTimestamp()
    });
    batch.update(storyRef, { commentCount: increment(1) });

    try {
        await batch.commit();
        setComment("");
        toast({ title: "Balasan Terkirim!", description: "Apresiasi Anda telah diteruskan." });
        
        if(currentUser.uid !== currentStory.authorId){
            const authorDoc = await getDoc(doc(firestore, 'users', currentStory.authorId));
            if (authorDoc.exists()) {
                const authorProfile = authorDoc.data() as AppUser;
                if (authorProfile.notificationPreferences?.onStoryComment !== false) {
                    const notifCol = collection(firestore, 'users', currentStory.authorId, 'notifications');
                    addDoc(notifCol, {
                        type: 'story_comment',
                        text: `${currentUser.displayName} membalas momen Anda.`,
                        link: `/profile/${currentGroup.authorId}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName!,
                            photoURL: currentUser.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${currentUser.uid}`
                        },
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }
            }
        }
    } catch (e) {
        toast({variant: 'destructive', title: "Gagal mengirim balasan."});
    } finally {
        setIsSendingComment(false);
    }
  }

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-zinc-950 text-white border-0 p-0 m-0 w-screen h-screen max-w-none rounded-none overflow-hidden flex flex-col items-center justify-center z-[150]"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <DialogTitle className="sr-only">Menampilkan Cerita</DialogTitle>
        <DialogDescription className="sr-only">Melihat momen singkat dari {currentGroup.authorName}.</DialogDescription>
        
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Desktop Navigation */}
            <div className="absolute inset-0 hidden md:flex items-center justify-between px-10 pointer-events-none z-[170]">
                <Button variant="ghost" size="icon" onClick={prevStory} disabled={authorIndex === 0 && storyIndex === 0} className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto shadow-2xl backdrop-blur-md transition-all active:scale-90">
                    <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextStory} className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto shadow-2xl backdrop-blur-md transition-all active:scale-90">
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </div>

            {/* Tombol Tutup */}
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 z-[180] text-white/60 hover:text-white hover:bg-white/10 rounded-full h-12 w-12">
                <X className="h-7 w-7" />
            </Button>
            
            {/* Container Story Utama */}
            <div 
                className="relative w-full md:w-[450px] h-full md:h-[90vh] md:max-h-[850px] md:rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] md:ring-1 md:ring-white/10"
                onClick={handleContainerClick}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Bar Progres */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-1.5 z-[160]">
                    {currentGroup.stories.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            {i < storyIndex && <div className="h-full w-full bg-white shadow-[0_0_8px_white]"/>}
                            {i === storyIndex && (
                                <motion.div 
                                    className="h-full bg-white shadow-[0_0_10px_white]"
                                    initial={{ width: '0%' }}
                                    animate={isPaused || showViews || showComments ? { width: 'auto' } : { width: '100%' }}
                                    transition={{ duration: 7, ease: 'linear' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Header Penulis */}
                <div className="absolute top-8 left-0 right-0 px-4 z-[160] flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl p-1.5 pr-5 rounded-full border border-white/10 pointer-events-auto transition-all hover:bg-black/50">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                            <AvatarImage src={currentGroup.authorAvatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-primary text-white font-black">{currentGroup.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                            <p className="font-black text-sm text-white drop-shadow-md truncate">{currentGroup.authorName}</p>
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white/60 drop-shadow-sm">
                                {formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id, addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/80 pointer-events-auto rounded-full hover:bg-white/10">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </div>

                {/* Konten Teks & Background */}
                <div className={cn(
                    "flex-1 relative flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out bg-gradient-to-br",
                    currentStory.background || "from-indigo-600 to-rose-500"
                )}>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentStory.id}`}
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                        className="w-full h-full relative flex items-center justify-center p-12 text-center"
                    >
                        <div className="relative">
                            <Sparkles className="absolute -top-8 -left-8 h-6 w-6 text-white/20 animate-pulse" />
                            <p className="text-3xl md:text-4xl font-headline font-black text-white whitespace-pre-wrap leading-[1.3] drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative z-10">
                                "{currentStory.content}"
                            </p>
                            <Sparkles className="absolute -bottom-8 -right-8 h-6 w-6 text-white/20 animate-pulse delay-700" />
                        </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Interaksi */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-[160] bg-gradient-to-t from-black/95 via-black/60 to-transparent" onClick={(e) => e.stopPropagation()}>
                   <div className='flex items-center gap-8 mb-6 px-2'>
                     <button onClick={handleToggleLike} disabled={isLikeLoading} className={cn("flex flex-col items-center gap-1.5 transition-all active:scale-125 group", isLiked ? "text-rose-500" : "text-white/80 hover:text-white")}>
                        <Heart className={cn("h-8 w-8 transition-all group-hover:scale-110", isLiked && "fill-current drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]")}/> 
                        <span className="text-[10px] font-black uppercase tracking-widest">{currentStory.likes}</span>
                     </button>
                     <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition-all group">
                        <MessageSquare className="h-8 w-8 group-hover:scale-110 transition-transform"/> 
                        <span className="text-[10px] font-black uppercase tracking-widest">{currentStory.commentCount}</span>
                     </button>
                     {isAuthor && (
                        <button onClick={() => setShowViews(true)} className="flex flex-col items-center gap-1.5 text-white/80 hover:text-white ml-auto transition-all group">
                            <div className="flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-full border border-white/10 hover:bg-primary hover:border-primary transition-all active:scale-95 shadow-xl">
                                <Eye className="h-4 w-4"/>
                                <span className="text-xs font-black tracking-widest">{currentStory.viewCount}</span>
                            </div>
                        </button>
                      )}
                   </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleComment(); }} className='flex items-center gap-3'>
                        <Input 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            placeholder='Berikan apresiasi...' 
                            className='bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50 focus-visible:bg-white/20 backdrop-blur-2xl h-14 rounded-2xl px-6 transition-all shadow-2xl' 
                        />
                        <Button 
                            size="icon" 
                            className="h-14 w-14 shrink-0 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl transition-all active:scale-90" 
                            disabled={isSendingComment || !comment.trim()}
                        >
                           {isSendingComment ? <Loader2 className="animate-spin h-6 w-6" /> : <SendIcon className="h-6 w-6 ml-0.5" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Sheets */}
            {isAuthor && <StoryViewersSheet storyId={currentStory.id} isOpen={showViews} onOpenChange={setShowViews} />}
            <StoryCommentsSheet storyId={currentStory.id} isOpen={showComments} onOpenChange={setShowComments} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

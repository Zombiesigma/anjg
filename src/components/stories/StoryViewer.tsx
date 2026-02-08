'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, collection, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import type { Story, StoryLike } from '@/lib/types';
import { X, Heart, MessageSquare, Send as SendIcon, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';
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
  
  // Logic View Count Sempurna
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
        userName: currentUser.displayName || 'Pujangga Elitera',
        userAvatarUrl: currentUser.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${currentUser.uid}`,
        viewedAt: serverTimestamp()
      });

      batch.commit().then(() => {
        viewedStoriesInSession.current.add(currentStory.id);
      }).catch(err => console.warn("Failed to increment views", err));
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
      batch.set(likeRef, { userId: currentUser.uid, likedAt: serverTimestamp() });
      batch.update(storyRef, { likes: increment(1) });
    }
    
    try {
        await batch.commit();
    } catch (e) {
        console.error("Error toggling like", e);
    }
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
        toast({ title: "Terkirim" });
    } catch (e) {
        toast({variant: 'destructive', title: "Gagal"});
    } finally {
        setIsSendingComment(false);
    }
  }

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-black text-white border-0 p-0 m-0 w-screen h-screen max-w-none rounded-none overflow-hidden flex flex-col items-center justify-center z-[250]"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <DialogTitle className="sr-only">Cerita {currentGroup.authorName}</DialogTitle>
        <DialogDescription className="sr-only">Melihat momen cerita teks.</DialogDescription>
        
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 hidden md:flex items-center justify-between px-10 pointer-events-none z-[270]">
                <Button variant="ghost" size="icon" onClick={prevStory} className="h-14 w-14 rounded-full bg-white/10 text-white pointer-events-auto backdrop-blur-md">
                    <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextStory} className="h-14 w-14 rounded-full bg-white/10 text-white pointer-events-auto backdrop-blur-md">
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 z-[280] text-white/60 hover:text-white rounded-full h-12 w-12">
                <X className="h-7 w-7" />
            </Button>
            
            <div 
                className="relative w-full md:w-[450px] h-full md:h-[90vh] md:max-h-[800px] md:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                onClick={handleContainerClick}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
            >
                <div className="absolute top-4 left-4 right-4 flex items-center gap-1.5 z-[260]">
                    {currentGroup.stories.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            {i < storyIndex && <div className="h-full w-full bg-white"/>}
                            {i === storyIndex && (
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: '0%' }}
                                    animate={isPaused || showViews || showComments ? { width: 'auto' } : { width: '100%' }}
                                    transition={{ duration: 7, ease: 'linear' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="absolute top-8 left-0 right-0 px-4 z-[260] flex items-center pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xl p-1.5 pr-5 rounded-full border border-white/10 pointer-events-auto">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                            <AvatarImage src={currentGroup.authorAvatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-primary text-white font-black">{currentGroup.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-black text-sm text-white truncate">{currentGroup.authorName}</p>
                            <p className="text-[9px] uppercase font-black text-white/60">
                                {formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id, addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "flex-1 relative flex items-center justify-center bg-gradient-to-br",
                    currentStory.background || "from-indigo-600 to-rose-500"
                )}>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentStory.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="w-full h-full flex items-center justify-center p-12 text-center"
                    >
                        <p className="text-2xl md:text-3xl font-headline font-black text-white whitespace-pre-wrap leading-tight drop-shadow-lg">
                            "{currentStory.content}"
                        </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-[260] bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
                   <div className='flex items-center gap-6 mb-4'>
                     <button onClick={handleToggleLike} disabled={isLikeLoading} className={cn("flex flex-col items-center gap-1 transition-transform active:scale-90", isLiked ? "text-rose-500" : "text-white/80")}>
                        <Heart className={cn("h-8 w-8", isLiked && "fill-current")}/> 
                        <span className="text-[10px] font-black">{currentStory.likes}</span>
                     </button>
                     <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 text-white/80 transition-transform active:scale-90">
                        <MessageSquare className="h-8 w-8"/> 
                        <span className="text-[10px] font-black">{currentStory.commentCount}</span>
                     </button>
                     {isAuthor && (
                        <button onClick={() => setShowViews(true)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 ml-auto text-white/80 transition-all hover:bg-white/20 active:scale-95">
                            <Eye className="h-4 w-4"/>
                            <span className="text-xs font-black">{currentStory.viewCount}</span>
                        </button>
                      )}
                   </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleComment(); }} className='flex items-center gap-2'>
                        <Input 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            placeholder='Berikan apresiasi...' 
                            className='bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary/50 h-12 rounded-2xl' 
                        />
                        <Button 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                            disabled={isSendingComment || !comment.trim()}
                        >
                           {isSendingComment ? <Loader2 className="animate-spin h-5 w-5" /> : <SendIcon className="h-5 w-5" />}
                        </Button>
                    </form>
                </div>
            </div>

            {isAuthor && <StoryViewersSheet storyId={currentStory.id} isOpen={showViews} onOpenChange={setShowViews} />}
            <StoryCommentsSheet storyId={currentStory.id} isOpen={showComments} onOpenChange={setShowComments} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
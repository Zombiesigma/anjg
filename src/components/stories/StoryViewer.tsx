'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, writeBatch, increment, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Story, StoryComment, StoryLike, User as AppUser, StoryView } from '@/lib/types';
import { X, Heart, MessageCircle, Send, ChevronLeft, ChevronRight, Loader2, Eye, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { StoryViewersSheet } from './StoryViewersSheet';
import Image from 'next/image';
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
  const viewedStoriesInSession = useRef(new Set<string>());

  // Safety net: Pastikan pointer-events kembali normal saat viewer ditutup
  useEffect(() => {
    if (!isOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const storyGroups = useMemo(() => {
    const groups: { [key: string]: { authorId: string; authorName: string; authorAvatarUrl: string; stories: Story[] } } = {};
    stories.forEach(story => {
      if (!groups[story.authorId]) {
        groups[story.authorId] = {
          authorId: story.authorId,
          authorName: story.authorName,
          authorAvatarUrl: story.authorAvatarUrl,
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

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(s => s - 1);
    } else if (authorIndex > 0) {
      const prevGroup = storyGroups[authorIndex - 1];
      setAuthorIndex(a => a - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };
  
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setTimeout(() => {
      nextStory();
    }, 7000); // 7 seconds per story

    return () => clearTimeout(timer);
  }, [storyIndex, authorIndex, isOpen, isPaused, nextStory]);
  
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
        userName: currentUser.displayName,
        userAvatarUrl: currentUser.photoURL,
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
        userName: currentUser.displayName,
        userAvatarUrl: currentUser.photoURL,
        text: comment,
        createdAt: serverTimestamp()
    });
    batch.update(storyRef, { commentCount: increment(1) });

    try {
        await batch.commit();
        setComment("");
        toast({title: "Komentar terkirim!"});
        
        if(currentUser.uid !== currentStory.authorId){
            const authorDoc = await getDoc(doc(firestore, 'users', currentStory.authorId));
            if (authorDoc.exists()) {
                const authorProfile = authorDoc.data() as AppUser;
                if (authorProfile.notificationPreferences?.onStoryComment !== false) {
                    const notifCol = collection(firestore, 'users', currentStory.authorId, 'notifications');
                    addDoc(notifCol, {
                        type: 'story_comment',
                        text: `${currentUser.displayName} mengomentari cerita Anda.`,
                        link: `/profile/${currentGroup.authorId}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName!,
                            photoURL: currentUser.photoURL!
                        },
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }
            }
        }
    } catch (e) {
        toast({variant: 'destructive', title: "Gagal mengirim komentar."});
    } finally {
        setIsSendingComment(false);
    }
  }


  if (!isOpen || !currentGroup || !currentStory) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-zinc-950 text-white border-0 p-0 m-0 w-screen h-screen max-w-none rounded-none overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <DialogTitle className="sr-only">Penampil Cerita</DialogTitle>
        <DialogDescription className="sr-only">
          Menampilkan cerita dari {currentGroup.authorName}.
        </DialogDescription>
        
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Desktop Navigation Buttons */}
            <div className="absolute inset-0 hidden md:flex items-center justify-between px-10 pointer-events-none">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={prevStory} 
                    disabled={authorIndex === 0 && storyIndex === 0} 
                    className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto shadow-2xl backdrop-blur-md transition-all active:scale-90"
                >
                    <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={nextStory} 
                    className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white pointer-events-auto shadow-2xl backdrop-blur-md transition-all active:scale-90"
                >
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </div>

            {/* Mobile Close Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="absolute top-6 right-6 z-[60] text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
                <X className="h-6 w-6" />
            </Button>
            
            {/* Main Story Container */}
            <div 
                className="relative w-full md:w-[450px] h-full md:h-[90vh] md:max-h-[850px] md:rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] md:ring-1 md:ring-white/10"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Progress Indicators */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-1.5 z-50">
                    {currentGroup.stories.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            {i < storyIndex && <div className="h-full w-full bg-white"/>}
                            {i === storyIndex && (
                                <motion.div 
                                    className="h-full bg-white shadow-[0_0_10px_white]"
                                    initial={{ width: '0%' }}
                                    animate={isPaused ? { width: 'auto' } : { width: '100%' }}
                                    transition={{ duration: 7, ease: 'linear' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Story Header (Author Info) */}
                <div className="absolute top-8 left-0 right-0 px-4 z-50 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/5 pointer-events-auto cursor-pointer hover:bg-black/40 transition-all">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                            <AvatarImage src={currentGroup.authorAvatarUrl}/>
                            <AvatarFallback>{currentGroup.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                            <p className="font-black text-sm text-white drop-shadow-md truncate">{currentGroup.authorName}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 drop-shadow-sm">
                                {formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id, addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/80 pointer-events-auto rounded-full hover:bg-white/10">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </div>

                {/* Main Content (Image or Text) */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">
                  <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentStory.id}-${storyIndex}`}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full relative flex items-center justify-center"
                    >
                        {currentStory.type === 'image' && currentStory.imageUrl ? (
                            <>
                                <Image 
                                    src={currentStory.imageUrl} 
                                    alt="Konten Cerita" 
                                    fill 
                                    className="object-cover" 
                                    priority
                                    unoptimized
                                />
                                {currentStory.content && (
                                    <div className="absolute bottom-32 left-0 right-0 px-6 py-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                        <p className="text-white text-center text-lg font-bold leading-snug drop-shadow-2xl">
                                            {currentStory.content}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-10 text-center bg-gradient-to-br from-indigo-600 via-primary to-rose-500">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                <p className="text-3xl md:text-4xl font-black text-white whitespace-pre-wrap leading-[1.3] drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative z-10 font-headline">
                                    "{currentStory.content}"
                                </p>
                            </div>
                        )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Interaction Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                   <div className='flex items-center gap-6 mb-6 px-2'>
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleLike(); }} 
                        disabled={isLikeLoading} 
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all active:scale-125",
                            isLiked ? "text-rose-500" : "text-white/80 hover:text-white"
                        )}
                     >
                        <Heart className={cn("h-7 w-7 transition-all", isLiked && "fill-current drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]")}/> 
                        <span className="text-[10px] font-black uppercase tracking-tighter">{currentStory.likes}</span>
                     </button>
                     
                     <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-all">
                        <MessageCircle className="h-7 w-7"/> 
                        <span className="text-[10px] font-black uppercase tracking-tighter">{currentStory.commentCount}</span>
                     </button>

                     {isAuthor && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowViews(true); }} 
                            className="flex flex-col items-center gap-1 text-white/80 hover:text-white ml-auto transition-all"
                        >
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20">
                                <Eye className="h-4 w-4"/>
                                <span className="text-xs font-bold">{currentStory.viewCount}</span>
                            </div>
                        </button>
                      )}
                   </div>

                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleComment(); }}
                        className='flex items-center gap-3'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative flex-1 group">
                            <Input 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder='Berikan komentar...' 
                                className='bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary focus-visible:bg-white/20 backdrop-blur-xl h-12 rounded-2xl px-5 transition-all'
                            />
                        </div>
                        <Button 
                            size="icon" 
                            className="h-12 w-12 shrink-0 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform active:scale-90" 
                            disabled={isSendingComment || !comment.trim()}
                        >
                           {isSendingComment ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5 ml-0.5" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Author's Views List */}
            {isAuthor && (
                <StoryViewersSheet storyId={currentStory.id} isOpen={showViews} onOpenChange={setShowViews} />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

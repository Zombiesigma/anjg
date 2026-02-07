
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
import { X, Heart, MessageCircle, Send, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { StoryViewersSheet } from './StoryViewersSheet';
import Image from 'next/image';


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
        // fail silently, not critical
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
        className="bg-black/90 text-white border-0 p-0 m-0 w-screen h-screen max-w-none rounded-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <DialogTitle className="sr-only">Penampil Cerita</DialogTitle>
        <DialogDescription className="sr-only">
          Menampilkan cerita dari {currentGroup.authorName}. Cerita saat ini: {currentStory.content}.
        </DialogDescription>
        <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/80 hover:text-white"><X/></button>
            
            <button onClick={prevStory} disabled={authorIndex === 0 && storyIndex === 0} className="absolute left-4 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-50"><ChevronLeft/></button>
            <button onClick={nextStory} className="absolute right-4 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50"><ChevronRight/></button>
            
            <div className="relative max-w-sm w-full aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden flex flex-col"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Progress Bars */}
                <div className="absolute top-2 left-2 right-2 flex items-center gap-1 z-20">
                    {currentGroup.stories.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            {i < storyIndex && <div className="h-full w-full bg-white"/>}
                            {i === storyIndex && (
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: '0%' }}
                                    animate={isPaused ? { width: 'auto' } : { width: '100%' }}
                                    transition={{ duration: 7, ease: 'linear' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Header */}
                <div className="absolute top-4 left-2 right-2 p-2 z-30 flex items-center gap-2 bg-gradient-to-b from-black/40 to-transparent rounded-t-lg">
                    <Avatar>
                        <AvatarImage src={currentGroup.authorAvatarUrl}/>
                        <AvatarFallback>{currentGroup.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                        <p className="font-semibold text-sm shadow-sm">{currentGroup.authorName}</p>
                        <p className="text-xs text-white/70 shadow-sm">
                            {formatDistanceToNow(currentStory.createdAt.toDate(), { locale: id, addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                  {currentStory.type === 'image' && currentStory.imageUrl ? (
                    <div className="absolute inset-0 w-full h-full">
                      <Image 
                        src={currentStory.imageUrl} 
                        alt="Story Content" 
                        fill 
                        className="object-cover" 
                        priority
                      />
                      {currentStory.content && (
                        <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-center text-lg font-medium drop-shadow-md">
                            {currentStory.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 text-center bg-gradient-to-br from-primary to-accent">
                      <p className="text-xl md:text-2xl font-black whitespace-pre-wrap leading-tight">
                        {currentStory.content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 z-30 space-y-2 bg-gradient-to-t from-black/60 to-transparent">
                   <div className='flex items-center gap-4 text-sm text-white/80'>
                     <button onClick={handleToggleLike} disabled={isLikeLoading} className="flex items-center gap-2 hover:text-white drop-shadow-sm">
                        <Heart className={isLiked ? "fill-red-500 text-red-500" : ""}/> 
                        <span className="font-bold">{currentStory.likes}</span>
                     </button>
                      <button className="flex items-center gap-2 hover:text-white drop-shadow-sm">
                          <MessageCircle/> 
                          <span className="font-bold">{currentStory.commentCount}</span>
                      </button>
                      {isAuthor && (
                        <button onClick={() => setShowViews(true)} className="flex items-center gap-2 hover:text-white ml-auto drop-shadow-sm">
                            <Eye/>
                            <span className="font-bold">{currentStory.viewCount}</span>
                        </button>
                      )}
                   </div>
                    <div className='flex items-center gap-2'>
                        <Input 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder='Balas cerita ini...' 
                            className='bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-primary backdrop-blur-md h-10'
                        />
                        <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleComment} disabled={isSendingComment || !comment.trim()}>
                           {isSendingComment ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            {isAuthor && (
                <StoryViewersSheet storyId={currentStory.id} isOpen={showViews} onOpenChange={setShowViews} />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

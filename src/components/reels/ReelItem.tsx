
'use client';

import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, increment, updateDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Reel, ReelLike, User as AppUser } from '@/lib/types';
import { Heart, MessageSquare, Share2, Volume2, VolumeX, Sparkles, Loader2, Music2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ReelCommentsSheet } from './ReelCommentsSheet';
import { ShareReelDialog } from './ShareReelDialog';
import { useToast } from '@/hooks/use-toast';

interface ReelItemProps {
  reel: Reel;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function ReelItem({ reel, isMuted, onToggleMute }: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const viewTracked = useRef(false);

  // Check if current user has liked the reel
  const likeRef = useMemo(() => (
    (firestore && currentUser) ? doc(firestore, 'reels', reel.id, 'likes', currentUser.uid) : null
  ), [firestore, currentUser, reel.id]);
  const { data: likeDoc } = useDoc<ReelLike>(likeRef);
  const isLiked = !!likeDoc;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
            // Track view when seen
            if (!viewTracked.current && firestore && currentUser && currentUser.uid !== reel.authorId) {
                const reelRef = doc(firestore, 'reels', reel.id);
                const viewRef = doc(firestore, 'reels', reel.id, 'views', currentUser.uid);
                const batch = writeBatch(firestore);
                batch.update(reelRef, { viewCount: increment(1) });
                batch.set(viewRef, { viewedAt: serverTimestamp() });
                batch.commit().then(() => { viewTracked.current = true; });
            }
          } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }
      },
      { threshold: 0.8 }
    );

    const currentRef = videoRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [firestore, currentUser, reel.id, reel.authorId]);

  const handleToggleLike = async () => {
    if (!firestore || !currentUser || !likeRef || isLiking) return;
    setIsLiking(true);
    
    const reelRef = doc(firestore, 'reels', reel.id);
    const batch = writeBatch(firestore);

    try {
      if (isLiked) {
        batch.delete(likeRef);
        batch.update(reelRef, { likes: increment(-1) });
      } else {
        batch.set(likeRef, { userId: currentUser.uid, likedAt: serverTimestamp() });
        batch.update(reelRef, { likes: increment(1) });
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleExternalShare = async () => {
    const shareData = {
      title: `Reel oleh ${reel.authorName} di Elitera`,
      text: reel.caption || 'Lihat video keren ini di Elitera!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log(err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Tautan Disalin', description: 'Tautan video berhasil disalin ke papan klip.' });
    }
  };

  return (
    <div className="h-full w-full snap-start snap-always relative bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={onToggleMute}
      />

      {/* Interactive Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

      {/* Right Interaction Sidebar */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-30">
        <div className="flex flex-col items-center gap-1.5">
            <button 
                onClick={handleToggleLike}
                disabled={isLiking}
                className={cn(
                    "h-12 w-12 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all active:scale-75 shadow-xl",
                    isLiked ? "bg-rose-500 border-rose-500 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                )}
            >
                {isLiking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />}
            </button>
            <span className="text-[10px] font-black text-white drop-shadow-md">{reel.likes || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
            <button 
                onClick={() => setShowComments(true)}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all hover:bg-primary/80"
            >
                <MessageSquare className="h-6 w-6" />
            </button>
            <span className="text-[10px] font-black text-white drop-shadow-md">{reel.commentCount || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-4">
            <button 
                onClick={() => setShowShare(true)}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all"
            >
                <SendIcon className="h-5 w-5" />
            </button>
            <button 
                onClick={handleExternalShare}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all"
            >
                <Share2 className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-14 space-y-4 z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
            <Link href={`/profile/${reel.authorName.toLowerCase()}`} className="flex items-center gap-3 group">
                <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/30 shadow-xl group-hover:scale-105 transition-transform">
                        <AvatarImage src={reel.authorAvatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white font-black">{reel.authorName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full ring-2 ring-black">
                        <Sparkles className="h-3 w-3" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-white font-black text-sm tracking-tight group-hover:text-primary transition-colors">{reel.authorName}</p>
                    <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest">
                        {reel.createdAt ? formatDistanceToNow(reel.createdAt.toDate(), { locale: id, addSuffix: true }) : 'Baru saja'}
                    </p>
                </div>
            </Link>
        </div>

        <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md line-clamp-2 max-w-[85%] italic">
            {reel.caption || "Karya video Elitera."}
        </p>

        <div className="flex items-center gap-3 text-white/60">
            <Music2 className="h-3.5 w-3.5 animate-spin-slow" />
            <div className="overflow-hidden flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest animate-marquee whitespace-nowrap">
                    Suara Asli - {reel.authorName} • {reel.caption?.substring(0, 20) || 'Digital Literacy'}
                </p>
            </div>
        </div>
      </div>

      {/* Sheets & Dialogs */}
      <ReelCommentsSheet reelId={reel.id} isOpen={showComments} onOpenChange={setShowComments} />
      <ShareReelDialog reel={reel} open={showShare} onOpenChange={setShowShare} />

      <style jsx>{`
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-marquee { animation: marquee 10s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}

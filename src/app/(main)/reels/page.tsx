
'use client';

import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, increment, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { Reel, User as AppUser } from '@/lib/types';
import { Loader2, Heart, MessageSquare, Share2, Volume2, VolumeX, Sparkles, PlusCircle, Plus, Music2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CreateReelModal } from '@/components/reels/CreateReelModal';

export default function ReelsPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isMuted, setIsMuted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: userProfile } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const reelsQuery = useMemo(() => (
    firestore ? query(
      collection(firestore, 'reels'),
      orderBy('createdAt', 'desc')
    ) : null
  ), [firestore]);

  const { data: reels, isLoading } = useCollection<Reel>(reelsQuery);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-144px)] flex flex-col items-center justify-center gap-4 bg-black/5 rounded-[2.5rem]">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Menyiapkan Panggung...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-180px)] md:h-[calc(100dvh-144px)] -mt-6 -mx-4 md:-mx-6 bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-none md:rounded-[2.5rem] shadow-2xl relative">
      
      {/* Create Reel Button */}
      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed top-24 left-8 z-[110] bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] p-3 rounded-full text-white hover:scale-110 transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mute Toggle Global */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="fixed top-24 right-8 z-[110] bg-black/20 backdrop-blur-md border border-white/10 p-3 rounded-full text-white/80 hover:text-white transition-all shadow-xl"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {reels && reels.length > 0 ? (
        reels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} isMuted={isMuted} />
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-6 bg-zinc-950">
            <div className="p-6 bg-white/5 rounded-[2rem] shadow-xl">
                <Music2 className="h-16 w-16 text-primary/20" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-headline font-black text-white">Panggung Kosong.</h2>
                <p className="text-white/40 max-w-xs mx-auto text-sm leading-relaxed">Belum ada karya video yang diterbitkan di sini. Jadilah yang pertama!</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">
                Buat Reel Sekarang
            </Button>
        </div>
      )}

      <CreateReelModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        currentUserProfile={userProfile}
      />
    </div>
  );
}

function ReelItem({ reel, isMuted }: { reel: Reel; isMuted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
            // Track view
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
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [firestore, currentUser, reel.id, reel.authorId]);

  return (
    <div className="h-full w-full snap-start snap-always relative bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={isMuted}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Right Interaction Bar */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1.5 group">
            <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all hover:bg-rose-500 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <Heart className="h-6 w-6" />
            </button>
            <span className="text-[10px] font-black text-white drop-shadow-md">{reel.likes || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
            <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all hover:bg-primary hover:border-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <MessageSquare className="h-6 w-6" />
            </button>
            <span className="text-[10px] font-black text-white drop-shadow-md">{reel.commentCount || 0}</span>
        </div>

        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all">
            <Share2 className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 space-y-4 z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
            <Link href={`/profile/${reel.authorName.toLowerCase()}`} className="flex items-center gap-3 group">
                <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/30 shadow-xl group-hover:scale-105 transition-transform">
                        <AvatarImage src={reel.authorAvatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white font-black">{reel.authorName.charAt(0)}</AvatarFallback>
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
                    Suara Asli - {reel.authorName} • {reel.caption ? reel.caption.substring(0, 20) : 'Digital Literacy'}
                </p>
            </div>
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
            animation: spin 4s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-marquee {
            animation: marquee 10s linear infinite;
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

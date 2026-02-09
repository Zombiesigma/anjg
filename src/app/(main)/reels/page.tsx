
'use client';

import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import type { Reel, User as AppUser } from '@/lib/types';
import { Loader2, Plus, Music2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateReelModal } from '@/components/reels/CreateReelModal';
import { ReelItem } from '@/components/reels/ReelItem';

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
      
      {/* Floating Global Controls */}
      <div className="fixed top-24 left-8 right-8 z-[110] flex items-center justify-between pointer-events-none">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="pointer-events-auto bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] p-3 rounded-full text-white hover:scale-110 transition-all active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="pointer-events-auto bg-black/20 backdrop-blur-md border border-white/10 p-3 rounded-full text-white/80 hover:text-white transition-all shadow-xl"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
      </div>

      {reels && reels.length > 0 ? (
        reels.map((reel) => (
          <ReelItem 
            key={reel.id} 
            reel={reel} 
            isMuted={isMuted} 
            onToggleMute={() => setIsMuted(!isMuted)} 
          />
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

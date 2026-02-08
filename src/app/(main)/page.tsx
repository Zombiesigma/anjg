'use client';

import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, type Query, type DocumentData } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import type { Book, Story, User as AppUser, Follow } from '@/lib/types';
import { BookCarousel } from '@/components/BookCarousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, PenTool, TrendingUp, Search, Star, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoriesReel } from '@/components/stories/StoriesReel';
import { cn } from '@/lib/utils';

const WELCOME_HERO_KEY = 'hasSeenWelcomeHero';

const CATEGORIES = [
  { name: 'Novel', slug: 'novel', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/5' },
  { name: 'Fiksi Ilmiah', slug: 'sci-fi', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/5' },
  { name: 'Fantasi', slug: 'fantasy', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  { name: 'Horor', slug: 'horror', icon: Search, color: 'text-rose-500', bg: 'bg-rose-500/5' },
];

export default function HomePage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [showHero, setShowHero] = useState(false);
  const [storiesQuery, setStoriesQuery] = useState<Query<DocumentData> | null>(null);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  useEffect(() => {
    const hasSeenHero = localStorage.getItem(WELCOME_HERO_KEY);
    if (!hasSeenHero) {
      setShowHero(true);
    }
  }, []);

  const handleDismissHero = () => {
    setShowHero(false);
    localStorage.setItem(WELCOME_HERO_KEY, 'true');
  };
  
  useEffect(() => {
    if (firestore) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      setStoriesQuery(
        query(
          collection(firestore, 'stories'),
          where('createdAt', '>', twentyFourHoursAgo),
          orderBy('createdAt', 'desc')
        )
      );
    }
  }, [firestore]);

  const booksQuery = useMemo(() => (
    firestore
    ? query(
        collection(firestore, 'books'), 
        where('status', '==', 'published'),
        where('visibility', '==', 'public')
      )
    : null
  ), [firestore]);
  
  const { data: rawBooks, isLoading } = useCollection<Book>(booksQuery);

  const popularBooks = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks].sort((a, b) => (b.favoriteCount + b.viewCount) - (a.favoriteCount + a.viewCount)).slice(0, 12);
  }, [rawBooks]);
  
  const newBooks = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 12);
  }, [rawBooks]);

  const { data: allStories, isLoading: areStoriesLoading } = useCollection<Story>(storiesQuery);

  const followingQuery = useMemo(() => (
    (firestore && currentUser) ? collection(firestore, 'users', currentUser.uid, 'following') : null
  ), [firestore, currentUser]);
  const { data: followingList } = useCollection<Follow>(followingQuery);
  const followingIds = useMemo(() => new Set(followingList?.map(f => f.id) || []), [followingList]);

  const filteredStories = useMemo(() => {
    if (!allStories) return [];
    if (!currentUser) return allStories.filter(s => s.authorRole === 'penulis' || s.authorRole === 'admin');
    
    return allStories.filter(story => {
      if (story.authorRole === 'penulis' || story.authorRole === 'admin') return true;
      if (story.authorId === currentUser.uid) return true;
      if (followingIds.has(story.authorId)) return true;
      return false;
    });
  }, [allStories, followingIds, currentUser]);

  return (
    <div className="relative pb-20">
      {/* Background Blobs for Depth */}
      <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute top-[40%] right-[-150px] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="space-y-16">
        {/* Stories Section */}
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-20"
        >
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Momen Hangat Pujangga</h2>
          </div>
          <StoriesReel 
              stories={filteredStories} 
              isLoading={areStoriesLoading || isProfileLoading}
              currentUserProfile={userProfile}
          />
        </motion.section>

        {/* Hero Welcome Section */}
        <AnimatePresence mode="wait">
          {showHero && (
            <motion.section
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, height: 0, marginBottom: 0, overflow: 'hidden' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-15px_rgba(0,0,0,0.2)] bg-zinc-950 group"
            >
              {/* Complex Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-indigo-900 opacity-80" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 px-8 py-20 md:p-24 text-center flex flex-col items-center max-w-4xl mx-auto space-y-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur-xl border border-white/20 shadow-2xl"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" /> Episentrum Literasi Modern
                </motion.div>

                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl md:text-8xl font-headline font-black text-white leading-[1] tracking-tight"
                >
                  Ukir <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-white to-rose-200">Jejakmu</span> <br/> Lewat Kata.
                </motion.h1>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg md:text-2xl text-white/80 font-medium leading-relaxed max-w-2xl font-serif italic"
                >
                  "Di sini, setiap imajinasi menemukan panggungnya. Temukan ribuan mahakarya atau mulailah menulis sejarahmu sendiri hari ini."
                </motion.p>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-5 pt-6 w-full sm:w-auto"
                >
                  <Button size="lg" className="rounded-full px-12 h-16 bg-white text-primary hover:bg-white/90 font-black text-base shadow-[0_20px_50px_-12px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 group" asChild>
                    <Link href="/search?q=">
                      Eksplorasi Karya <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-12 h-16 text-white border-white/30 hover:bg-white/10 font-black text-base backdrop-blur-md transition-all hover:border-white/60" asChild>
                    <Link href="/upload">
                      <PenTool className="mr-3 h-5 w-5" /> Mulai Menulis
                    </Link>
                  </Button>
                </motion.div>

                <button 
                  onClick={handleDismissHero}
                  className="absolute top-8 right-10 text-white/30 hover:text-white transition-all hover:rotate-90 duration-500"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Categories Quick Access */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-headline font-black tracking-tight flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" /> Genre <span className="text-primary italic">Terpopuler</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/search?q=${cat.slug}`} className="block group">
                  <div className="bg-card/40 backdrop-blur-sm border border-border/50 group-hover:border-primary/30 group-hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] p-8 flex flex-col items-center gap-5 text-center relative overflow-hidden">
                    <div className={cn("p-5 rounded-[1.5rem] transition-all duration-500 group-hover:scale-110 shadow-inner", cat.bg, cat.color)}>
                      <cat.icon className="h-8 w-8" />
                    </div>
                    <span className="font-black text-sm tracking-widest uppercase opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors">{cat.name}</span>
                    
                    {/* Subtle pattern background on hover */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Main Content: Carousels */}
        <div className="space-y-24">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <h2 className="text-4xl font-headline font-black tracking-tight flex items-center gap-3">
                        <Flame className="h-8 w-8 text-orange-500 animate-pulse" /> Trending <span className="text-primary italic">Minggu Ini</span>
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Karya yang paling banyak dibicarakan di semesta Elitera</p>
                </div>
                <Button variant="ghost" asChild className="rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 text-primary">
                    <Link href="/search?q=">Lihat Semua <ChevronRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </div>
            <BookCarousel title="" books={popularBooks} isLoading={isLoading} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <h2 className="text-4xl font-headline font-black tracking-tight flex items-center gap-3">
                        <Star className="h-8 w-8 text-yellow-500" /> Rilisan <span className="text-primary italic">Terbaru</span>
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Sambut imajinasi segar dari para pujangga berbakat</p>
                </div>
                <Button variant="ghost" asChild className="rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 text-primary">
                    <Link href="/search?q=">Lihat Semua <ChevronRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </div>
            <BookCarousel title="" books={newBooks} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Footer CTA */}
        {!isProfileLoading && userProfile?.role === 'pembaca' && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-zinc-900 border border-white/10 rounded-[3.5rem] p-12 md:p-24 text-center space-y-8 overflow-hidden shadow-2xl"
          >
            {/* Background Decoration for Footer CTA */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-0" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -z-0" />
            
            <div className="relative z-10 space-y-8">
                <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] w-fit mx-auto shadow-2xl">
                    <PenTool className="h-14 w-14 text-primary" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-white leading-tight">
                        Transformasikan <span className="text-primary italic">Imajinasi</span> <br/> Menjadi Mahakarya.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
                        Punya cerita yang tersimpan rapat? Bergabunglah dengan barisan penulis Elitera dan biarkan dunia terpaku pada setiap kata yang Anda tulis.
                    </p>
                </div>
                <Button size="lg" className="rounded-full px-12 h-16 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary text-white" asChild>
                  <Link href="/join-author">Daftar Sebagai Penulis <Sparkles className="ml-3 h-5 w-5" /></Link>
                </Button>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    )
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}

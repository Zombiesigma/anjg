'use client';

import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, type Query, type DocumentData } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import type { Book, Story, User as AppUser, Follow } from '@/lib/types';
import { BookCarousel } from '@/components/BookCarousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, PenTool, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoriesReel } from '@/components/stories/StoriesReel';
import { cn } from '@/lib/utils';

const WELCOME_HERO_KEY = 'hasSeenWelcomeHero';

const CATEGORIES = [
  { name: 'Novel', slug: 'novel', icon: BookOpen },
  { name: 'Fiksi Ilmiah', slug: 'sci-fi', icon: Sparkles },
  { name: 'Fantasi', slug: 'fantasy', icon: TrendingUp },
  { name: 'Horor', slug: 'horror', icon: Search },
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
    <div className="relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-[-100px] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="space-y-12">
        {/* Stories Section */}
        <motion.section 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StoriesReel 
              stories={filteredStories} 
              isLoading={areStoriesLoading || isProfileLoading}
              currentUserProfile={userProfile}
          />
        </motion.section>

        {/* Hero Welcome Section */}
        <AnimatePresence>
          {showHero && (
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, height: 0, marginBottom: 0 }}
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-zinc-900 group"
            >
              {/* Background Video or Image Placeholder with Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-indigo-900 opacity-90" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              
              <div className="relative z-10 px-8 py-16 md:p-20 text-center flex flex-col items-center max-w-4xl mx-auto space-y-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/10"
                >
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Selamat Datang di Elitera
                </motion.div>

                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-7xl font-headline font-black text-white leading-[1.1] tracking-tight"
                >
                  Tulis Ceritamu, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-rose-300">Ukir Sejarahmu.</span>
                </motion.h1>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl"
                >
                  Bergabunglah dengan komunitas pujangga modern. Temukan ribuan karya inspiratif atau mulailah menulis mahakaryamu hari ini.
                </motion.p>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto"
                >
                  <Button size="lg" className="rounded-full px-10 h-14 bg-white text-primary hover:bg-white/90 font-black shadow-xl" asChild>
                    <Link href="/search?q=">
                      Mulai Jelajahi <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-white border-white/20 hover:bg-white/10 font-black backdrop-blur-sm" asChild>
                    <Link href="/upload">
                      <PenTool className="mr-2 h-5 w-5" /> Mulai Menulis
                    </Link>
                  </Button>
                </motion.div>

                <button 
                  onClick={handleDismissHero}
                  className="absolute top-6 right-8 text-white/40 hover:text-white transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Tutup</span>
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Categories Quick Access */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-headline font-black tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Genre Populer
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/search?q=${cat.slug}`} className="block group">
                  <div className="bg-card/50 backdrop-blur-sm border-2 border-transparent group-hover:border-primary/20 group-hover:shadow-xl transition-all duration-300 rounded-[2rem] p-6 flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{cat.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Main Content: Carousels */}
        <div className="space-y-16">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-headline font-black tracking-tight">Populer <span className="text-primary">Saat Ini</span></h2>
                <Link href="/search?q=" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Lihat Semua</Link>
            </div>
            <BookCarousel title="" books={popularBooks} isLoading={isLoading} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-headline font-black tracking-tight">Karya <span className="text-primary">Terbaru</span></h2>
                <Link href="/search?q=" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Lihat Semua</Link>
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
            className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 md:p-16 text-center space-y-6"
          >
            <PenTool className="h-12 w-12 text-primary mx-auto mb-2" />
            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight">Jadilah Bagian dari Sejarah Literasi</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Punya cerita yang ingin dibagikan? Bergabunglah sebagai penulis dan mulailah membangun komunitas pembacamu sendiri.</p>
            <Button size="lg" className="rounded-full px-10 h-14 font-black shadow-lg shadow-primary/20" asChild>
              <Link href="/join-author">Daftar Penulis Sekarang</Link>
            </Button>
          </motion.section>
        )}
      </div>
    </div>
  );
}

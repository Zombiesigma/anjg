
'use client';

import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, type Query, type DocumentData } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import type { Book, Story, User as AppUser, Follow } from '@/lib/types';
import { BookCarousel } from '@/components/BookCarousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoriesReel } from '@/components/stories/StoriesReel';

const WELCOME_HERO_KEY = 'hasSeenWelcomeHero';

export default function HomePage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [showHero, setShowHero] = useState(false);
  const [storiesQuery, setStoriesQuery] = useState<Query<DocumentData> | null>(null);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  useEffect(() => {
    // This effect runs only on the client.
    const hasSeenHero = localStorage.getItem(WELCOME_HERO_KEY);
    if (!hasSeenHero) {
      setShowHero(true);
      const timer = setTimeout(() => {
        setShowHero(false);
        localStorage.setItem(WELCOME_HERO_KEY, 'true');
      }, 8000); // Hide after 8 seconds

      return () => clearTimeout(timer);
    }
  }, []);
  
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


  // Only query for public books on the home page to keep it simple and avoid permission errors.
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

  // We sort the books on the client-side for different sections.
  const popularBooks = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks].sort((a, b) => (b.favoriteCount + b.viewCount) - (a.favoriteCount + a.viewCount)).slice(0, 12);
  }, [rawBooks]);
  
  const newBooks = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 12);
  }, [rawBooks]);

  const { data: allStories, isLoading: areStoriesLoading } = useCollection<Story>(storiesQuery);

  // Fetch following list to filter stories
  const followingQuery = useMemo(() => (
    (firestore && currentUser) ? collection(firestore, 'users', currentUser.uid, 'following') : null
  ), [firestore, currentUser]);
  const { data: followingList } = useCollection<Follow>(followingQuery);
  const followingIds = useMemo(() => new Set(followingList?.map(f => f.id) || []), [followingList]);

  // Logic: Penulis/Admin show to everyone. Readers show only to followers.
  const filteredStories = useMemo(() => {
    if (!allStories) return [];
    if (!currentUser) return allStories.filter(s => s.authorRole === 'penulis' || s.authorRole === 'admin');
    
    return allStories.filter(story => {
      // 1. Author is Penulis or Admin -> Show to all
      if (story.authorRole === 'penulis' || story.authorRole === 'admin') return true;
      // 2. Author is the user themselves -> Show
      if (story.authorId === currentUser.uid) return true;
      // 3. User follows the author -> Show
      if (followingIds.has(story.authorId)) return true;
      
      return false;
    });
  }, [allStories, followingIds, currentUser]);


  return (
    <div className="space-y-12">
       <StoriesReel 
            stories={filteredStories} 
            isLoading={areStoriesLoading || isProfileLoading}
            currentUserProfile={userProfile}
        />
      {/* Hero Section */}
      <AnimatePresence>
        {showHero && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: -50 }}
            animate={{ opacity: 1, height: 'auto', y: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
            exit={{ opacity: 0, height: 0, y: -50, transition: { duration: 0.7, ease: 'easeInOut' } }}
            className="rounded-lg bg-gradient-to-r from-primary/10 via-background to-accent/10 p-8 md:p-12 text-center flex flex-col items-center overflow-hidden"
          >
            <Sparkles className="h-10 w-10 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Jelajahi Dunia Literasi Tanpa Batas</h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
              Temukan buku favorit Anda berikutnya, tulis cerita Anda sendiri, dan terhubung dengan komunitas pembaca dan penulis yang bersemangat.
            </p>
            <div className="mt-8 flex gap-4">
                <Button size="lg" asChild>
                    <Link href="/search?q=">
                        Mulai Menjelajah <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/upload">
                        Mulai Menulis
                    </Link>
                </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Carousels */}
      <BookCarousel title="Populer Saat Ini" books={popularBooks} isLoading={isLoading} />
      <BookCarousel title="Baru Ditambahkan" books={newBooks} isLoading={isLoading} />
    </div>
  );
}

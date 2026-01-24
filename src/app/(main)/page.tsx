'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import type { Book } from '@/lib/types';
import { BookCarousel } from '@/components/BookCarousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_HERO_KEY = 'hasSeenWelcomeHero';

export default function HomePage() {
  const firestore = useFirestore();
  const [showHero, setShowHero] = useState(false);

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

  // A single query to get all published books to avoid composite indexes.
  const booksQuery = useMemo(() => (
    firestore
    ? query(collection(firestore, 'books'), where('status', '==', 'published'))
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

  return (
    <div className="space-y-12">
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

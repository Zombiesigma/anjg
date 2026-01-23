'use client';

import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { BookCard } from '@/components/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/lib/types';
import { useMemo } from 'react';

export default function HomePage() {
  const firestore = useFirestore();

  const booksQuery = useMemo(() => (
    firestore
    ? query(collection(firestore, 'books'), where('status', '==', 'published'), orderBy('viewCount', 'desc'), limit(12))
    : null
  ), [firestore]);
  
  const { data: books, isLoading } = useCollection<Book>(booksQuery);

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-headline font-bold text-primary">Jelajahi Dunia</h1>
        <p className="text-lg text-muted-foreground mt-2">Temukan buku favorit Anda berikutnya dari koleksi kami yang luas.</p>
      </div>
      <section>
        <h2 className="text-2xl font-headline font-bold mb-4">Populer Saat Ini</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-5 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          {books?.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
        {!isLoading && books?.length === 0 && (
          <div className="text-center text-muted-foreground py-8 col-span-full">
            <p>Belum ada buku yang diterbitkan.</p>
            <p className="text-sm">Kembali lagi nanti!</p>
          </div>
        )}
      </section>
    </div>
  );
}

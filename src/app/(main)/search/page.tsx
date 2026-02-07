
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Book, User } from '@/lib/types';
import { BookCard } from '@/components/BookCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const q = searchParams.get('q') || '';
  
  const capitalizedQuery = useMemo(() => {
      if (!q.trim()) return '';
      return q.charAt(0).toUpperCase() + q.slice(1);
  }, [q]);

  const booksQuery = useMemo(() => {
    if (!firestore || !capitalizedQuery) return null;
    return query(
      collection(firestore, 'books'),
      where('status', '==', 'published'),
      where('visibility', '==', 'public'), // Only show public books in search
      where('title', '>=', capitalizedQuery),
      where('title', '<=', capitalizedQuery + '\uf8ff'),
      limit(20)
    );
  }, [firestore, capitalizedQuery]);

  const usersQuery = useMemo(() => {
    if (!firestore || !capitalizedQuery) return null;
    return query(
      collection(firestore, 'users'),
      where('displayName', '>=', capitalizedQuery),
      where('displayName', '<=', capitalizedQuery + '\uf8ff'),
      limit(20)
    );
  }, [firestore, capitalizedQuery]);
  
  const { data: books, isLoading: areBooksLoading } = useCollection<Book>(booksQuery);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);
  
  const isLoading = areBooksLoading || areUsersLoading;
  
  if (!q) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Lakukan Pencarian</h1>
        <p className="text-muted-foreground">Gunakan bilah pencarian di atas untuk menemukan buku atau pengguna.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Hasil Pencarian untuk "{q}"</h1>
        <p className="text-muted-foreground">
            Menampilkan hasil untuk buku dan pengguna.
        </p>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && users?.length === 0 && books?.length === 0 && (
         <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Tidak ada hasil ditemukan</h2>
            <p className="text-muted-foreground">Coba kata kunci pencarian yang berbeda.</p>
        </div>
      )}

      {users && users.length > 0 && (
        <section>
          <h2 className="text-2xl font-headline font-bold mb-4">Pengguna</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.map(user => (
              <Link href={`/profile/${user.username}`} key={user.id}>
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

       {users && users.length > 0 && books && books.length > 0 && <Separator className="my-8" />}

      {books && books.length > 0 && (
        <section>
          <h2 className="text-2xl font-headline font-bold mb-4">Buku</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <SearchPageContent />
        </Suspense>
    )
}

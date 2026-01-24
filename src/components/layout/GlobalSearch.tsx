'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Book, User } from '@/lib/types';

import { Input } from '@/components/ui/input';
import { Loader2, Search, Book as BookIcon, User as UserIcon, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export function GlobalSearch() {
  const [queryValue, setQueryValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [queryValue]);

  const capitalizedQuery = useMemo(() => {
      if (!debouncedQuery.trim()) return '';
      // Capitalize first letter for better matching on names/titles
      return debouncedQuery.charAt(0).toUpperCase() + debouncedQuery.slice(1);
  }, [debouncedQuery]);

  const booksQuery = useMemo(() => {
    if (!firestore || !capitalizedQuery) return null;
    return query(
      collection(firestore, 'books'),
      where('status', '==', 'published'),
      where('title', '>=', capitalizedQuery),
      where('title', '<=', capitalizedQuery + '\uf8ff'),
      limit(5)
    );
  }, [firestore, capitalizedQuery]);

  const usersQuery = useMemo(() => {
    if (!firestore || !capitalizedQuery) return null;
    return query(
      collection(firestore, 'users'),
      where('displayName', '>=', capitalizedQuery),
      where('displayName', '<=', capitalizedQuery + '\uf8ff'),
      limit(5)
    );
  }, [firestore, capitalizedQuery]);

  const { data: books, isLoading: areBooksLoading } = useCollection<Book>(booksQuery);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const isLoading = areBooksLoading || areUsersLoading;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!queryValue.trim()) return;
    router.push(`/search?q=${encodeURIComponent(queryValue.trim())}`);
    setQueryValue('');
    setIsFocused(false);
  };
  
  const clearSearch = () => {
    setQueryValue('');
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showResults = isFocused && queryValue.trim().length > 0;

  return (
    <div className="relative w-full" ref={containerRef}>
      <form onSubmit={handleSearchSubmit}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          type="search"
          placeholder="Cari buku atau nama pengguna..."
          className="w-full bg-muted pl-8 h-9"
          value={queryValue}
          onChange={(e) => setQueryValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {queryValue && (
            <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
        )}
      </form>

      {showResults && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-background shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-2">
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!isLoading && !books?.length && !users?.length && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Tidak ada hasil ditemukan untuk "{debouncedQuery}".
              </p>
            )}

            {users && users.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-xs font-semibold text-muted-foreground">Pengguna</p>
                {users.map(user => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={() => { setIsFocused(false); setQueryValue(''); }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {users && users.length > 0 && books && books.length > 0 && (
              <Separator className="my-2" />
            )}

            {books && books.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-xs font-semibold text-muted-foreground">Buku</p>
                 {books.map(book => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    onClick={() => { setIsFocused(false); setQueryValue(''); }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                  >
                     <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-muted rounded">
                        <BookIcon className="h-5 w-5 text-muted-foreground" />
                     </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">oleh {book.authorName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="p-1 mt-1">
                <button
                    onClick={() => {
                        if (!queryValue.trim()) return;
                        router.push(`/search?q=${encodeURIComponent(queryValue.trim())}`);
                        setQueryValue('');
                        setIsFocused(false);
                    }}
                    className="text-sm font-medium text-primary hover:bg-accent rounded-md w-full text-center p-2"
                >
                    Lihat semua hasil
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

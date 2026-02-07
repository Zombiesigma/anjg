'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Book, User } from '@/lib/types';

import { Input } from '@/components/ui/input';
import { Loader2, Search, Book as BookIcon, User as UserIcon, X, Command } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    return () => clearTimeout(handler);
  }, [queryValue]);

  const capitalizedQuery = useMemo(() => {
      if (!debouncedQuery.trim()) return '';
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
  
  const clearSearch = () => setQueryValue('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showResults = isFocused && queryValue.trim().length > 0;

  return (
    <div className="relative w-full" ref={containerRef}>
      <form onSubmit={handleSearchSubmit} className="relative group">
        <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10",
            isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <Input
          type="search"
          placeholder="Cari karya atau penulis..."
          className={cn(
            "w-full bg-muted/40 pl-10 pr-12 h-10 rounded-2xl border-none transition-all duration-300",
            "focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-inner"
          )}
          value={queryValue}
          onChange={(e) => setQueryValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {queryValue ? (
                <button type="button" onClick={clearSearch} className="p-1 hover:bg-muted rounded-full transition-colors">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            ) : (
                <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-background/50 text-[10px] font-black text-muted-foreground/50">
                    <Command className="h-2.5 w-2.5" /> K
                </div>
            )}
        </div>
      </form>

      <AnimatePresence>
        {showResults && (
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                className="absolute top-full mt-3 w-full rounded-[1.5rem] border bg-background shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-[110] overflow-hidden"
            >
                <div className="p-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Mencari di semesta Elitera...</p>
                        </div>
                    )}
                    
                    {!isLoading && !books?.length && !users?.length && (
                        <div className="p-8 text-center space-y-2">
                            <Search className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Tidak ada hasil untuk "<span className="text-foreground">{debouncedQuery}</span>"
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 p-2">
                        {users && users.length > 0 && (
                            <div className="space-y-2">
                                <p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Pujangga</p>
                                {users.map(user => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.username}`}
                                        onClick={() => { setIsFocused(false); setQueryValue(''); }}
                                        className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-muted group"
                                    >
                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{user.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{user.displayName}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">@{user.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {users && users.length > 0 && books && books.length > 0 && <Separator className="opacity-50" />}

                        {books && books.length > 0 && (
                            <div className="space-y-2">
                                <p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Karya</p>
                                {books.map(book => (
                                    <Link
                                        key={book.id}
                                        href={`/books/${book.id}`}
                                        onClick={() => { setIsFocused(false); setQueryValue(''); }}
                                        className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-muted group"
                                    >
                                        <div className="w-10 h-14 relative shrink-0 overflow-hidden rounded shadow-sm">
                                            <AvatarImage src={book.coverUrl} className="object-cover" />
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center -z-10">
                                                <BookIcon className="h-4 w-4 text-muted-foreground/40" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors leading-tight">{book.title}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">oleh {book.authorName}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isLoading && (queryValue.trim().length > 0) && (
                        <div className="p-2 pt-0 mt-2">
                            <button
                                onClick={() => {
                                    if (!queryValue.trim()) return;
                                    router.push(`/search?q=${encodeURIComponent(queryValue.trim())}`);
                                    setQueryValue('');
                                    setIsFocused(false);
                                }}
                                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-primary/5 text-primary text-xs font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-white"
                            >
                                Lihat Semua Hasil <Search className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

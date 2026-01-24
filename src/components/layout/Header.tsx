'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Logo } from '@/components/Logo';
import { HeaderActions } from './HeaderActions';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function Header() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold font-headline text-xl hidden sm:inline-block">
              Litera
            </span>
          </Link>
        </div>
        <div className="flex-1 mx-2 sm:mx-6">
           <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  type="search"
                  placeholder="Cari buku atau pengguna..."
                  className="w-full bg-muted pl-8 h-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
              />
          </form>
        </div>
        <div className="flex items-center justify-end">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { HeaderActions } from './HeaderActions';
import { GlobalSearch } from './GlobalSearch';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300 overflow-x-hidden">
      <div className="container flex h-16 items-center px-4 md:px-6 mx-auto w-full max-w-full">
        <div className="mr-2 flex items-center shrink-0">
          <Link href="/" className="flex items-center space-x-2 group transition-transform active:scale-95">
            <Logo className="h-8 w-8 shadow-lg shadow-primary/10 transition-transform group-hover:rotate-3" />
            <span className="font-black font-headline text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden xs:inline-block">
              Elitera
            </span>
          </Link>
        </div>
        
        <div className="flex-1 mx-2 min-w-0">
           <GlobalSearch />
        </div>
        
        <div className="flex items-center justify-end shrink-0">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

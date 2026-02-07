'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { HeaderActions } from './HeaderActions';
import { GlobalSearch } from './GlobalSearch';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-3 group transition-transform active:scale-95">
            <Logo className="h-9 w-9 shadow-lg shadow-primary/10 transition-transform group-hover:rotate-3" />
            <span className="font-black font-headline text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden sm:inline-block">
              Elitera
            </span>
          </Link>
        </div>
        
        <div className="flex-1 mx-2 sm:mx-8 max-w-2xl">
           <GlobalSearch />
        </div>
        
        <div className="flex items-center justify-end">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

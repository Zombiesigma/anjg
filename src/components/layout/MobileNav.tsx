'use client';
import Link from 'next/link';
import { Home, BookUser, PlusSquare, Bot, User, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';


export function MobileNav() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = (firestore && user) ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        <Link href="/" className="inline-flex flex-col items-center justify-center px-5 hover:bg-accent group">
          <Home className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />
          <span className="text-xs text-muted-foreground group-hover:text-primary">Beranda</span>
        </Link>
        <Link href="/join-author" className="inline-flex flex-col items-center justify-center px-5 hover:bg-accent group">
          <BookUser className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />
          <span className="text-xs text-muted-foreground group-hover:text-primary">Penulis</span>
        </Link>
        <Link href="/upload" className="inline-flex flex-col items-center justify-center px-5 hover:bg-accent group">
          <PlusSquare className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />
          <span className="text-xs text-muted-foreground group-hover:text-primary">Unggah</span>
        </Link>
        <Link href="/ai" className="inline-flex flex-col items-center justify-center px-5 hover:bg-accent group">
          <Bot className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />
          <span className="text-xs text-muted-foreground group-hover:text-primary">Litera AI</span>
        </Link>
        <Link href={userProfile ? `/profile/${userProfile.username}` : '#'} aria-disabled={isProfileLoading} className="inline-flex flex-col items-center justify-center px-5 hover:bg-accent group">
          {isProfileLoading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <User className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />}
          <span className="text-xs text-muted-foreground group-hover:text-primary">Profil</span>
        </Link>
      </div>
    </div>
  );
}

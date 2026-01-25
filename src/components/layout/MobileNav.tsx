'use client';
import Link from 'next/link';
import { Home, BookUser, PlusSquare, Bot, User, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const userProfileRef = (firestore && user) ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const canUpload = userProfile?.role === 'penulis' || userProfile?.role === 'admin';

  const navItems = [
    { href: '/', icon: Home, label: 'Beranda' },
    { href: '/join-author', icon: BookUser, label: 'Penulis' },
    ...(canUpload ? [{ href: '/upload', icon: PlusSquare, label: 'Unggah' }] : []),
    { href: '/ai', icon: Bot, label: 'Elitera AI' },
    { href: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className={cn('grid h-full max-w-lg mx-auto font-medium', canUpload ? 'grid-cols-5' : 'grid-cols-4')}>
        {navItems.map((item) => {
          // Handle active state for nested routes, e.g., /profile/*
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          
          const finalHref = item.href === '/profile'
            ? (userProfile ? `/profile/${userProfile.username}` : '#')
            : item.href;

          return (
            <Link 
              key={item.href} 
              href={finalHref} 
              aria-disabled={isProfileLoading && item.href === '/profile'}
              className="flex flex-col items-center justify-center text-center px-1 group focus:outline-none focus:bg-accent/50"
            >
              <div className="relative w-full flex flex-col items-center justify-center">
                <item.icon 
                  className={cn(
                    'w-5 h-5 mb-1 transition-colors', 
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )} 
                />
                 <span 
                  className={cn(
                    'text-xs transition-colors',
                     isActive ? 'font-bold text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )}
                >
                  {item.label === 'Profil' && isProfileLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-2.5 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

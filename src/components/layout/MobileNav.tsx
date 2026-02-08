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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-lg md:hidden">
      <div className="bg-background/80 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-full h-16 flex items-center justify-around px-2 relative overflow-hidden">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          
          const finalHref = item.href === '/profile'
            ? (userProfile ? `/profile/${userProfile.username.toLowerCase()}` : '#')
            : item.href;

          return (
            <Link 
              key={item.href} 
              href={finalHref} 
              className="flex-1 flex flex-col items-center justify-center h-full relative z-10"
            >
              <div className="flex flex-col items-center justify-center transition-all duration-300">
                <item.icon 
                  className={cn(
                    'w-5 h-5 transition-all duration-300', 
                    isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary'
                  )} 
                />
                <span 
                  className={cn(
                    'text-[10px] font-bold mt-1 tracking-tighter transition-all duration-300',
                     isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label === 'Profil' && isProfileLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : item.label}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-full z-[-1]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
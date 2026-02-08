'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Settings,
  LogOut,
  BookUser,
  Info,
  ChevronRight,
  Moon,
  Sun,
  Shield,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { signOut } from '@/firebase/auth/service';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function UserNav() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  useEffect(() => {
    if (!isLogoutAlertOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isLogoutAlertOpen]);

  const userProfileRef = (firestore && user) ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);
  
  const isAdmin = userProfile?.role?.toLowerCase() === 'admin';

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    setIsLogoutAlertOpen(false);
    setIsSheetOpen(false);
    
    setTimeout(async () => {
        await signOut();
        document.body.style.pointerEvents = '';
        router.push('/login');
    }, 150);
  };
  
  if (isLoading || !user) return null;

  const userInitial = user.displayName ? user.displayName.charAt(0) : (user.email ? user.email.charAt(0) : 'U');

  const NavLink = ({ href, icon: Icon, label, className }: any) => (
    <SheetClose asChild>
        <Link 
            href={href} 
            className={cn(
                "flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group hover:bg-primary/5",
                className
            )}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm group-hover:text-primary transition-colors">{label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary/50" />
        </Link>
    </SheetClose>
  );

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <button className="relative rounded-full p-0.5 transition-all active:scale-95 group focus:outline-none">
            <div className="rounded-full bg-gradient-to-tr from-primary/20 via-accent/20 to-primary/20 p-0.5 group-hover:from-primary group-hover:to-accent transition-all duration-500">
                <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary font-black">{userInitial}</AvatarFallback>
                </Avatar>
            </div>
          </button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-xs flex flex-col p-0 border-l bg-background/95 backdrop-blur-xl">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <UserIcon className="h-5 w-5" />
                </div>
                <SheetTitle className="font-headline text-2xl font-black">Menu</SheetTitle>
            </div>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            <nav className="flex flex-col gap-1 p-4">
              {isAdmin && (
                 <NavLink 
                    href="/admin" 
                    icon={Shield} 
                    label="Dasbor Admin" 
                    className="bg-accent/5 border border-primary/10 mb-2" 
                 />
              )}
              
              <NavLink href="/settings" icon={Settings} label="Pengaturan Akun" />
              <NavLink href="/join-author" icon={BookUser} label="Daftar Penulis" />
              <NavLink href="/guide" icon={HelpCircle} label="Panduan Pengguna" />
              <NavLink href="/about" icon={Info} label="Tentang Elitera" />
              
              <div
                onClick={toggleTheme}
                className="flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group hover:bg-primary/5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted group-hover:bg-primary group-hover:text-white transition-colors">
                    <Sun className="h-4 w-4 dark:hidden" />
                    <Moon className="h-4 w-4 hidden dark:block" />
                  </div>
                  <span className="font-bold text-sm group-hover:text-primary transition-colors">Ganti Tema</span>
                </div>
              </div>
            </nav>

            <Separator className="my-2 opacity-50" />
            
            <div className="p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                onClick={() => setIsLogoutAlertOpen(true)}
              >
                <div className="p-2 rounded-xl bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                </div>
                <span>Keluar dari Sesi</span>
              </Button>
            </div>
          </div>

          <SheetFooter className="p-4 border-t bg-muted/10 mt-auto">
            <SheetClose asChild>
              <Link 
                href={userProfile ? `/profile/${userProfile.username.toLowerCase()}` : '#'} 
                className={cn(
                    "flex items-center gap-4 w-full p-3 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5 group",
                    isProfileLoading && "pointer-events-none"
                )}
              >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                        <AvatarImage src={user.photoURL ?? ''} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary font-black">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                  </div>
                  
                  {isProfileLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-sm truncate group-hover:text-primary transition-colors">{user.displayName || 'Pujangga'}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lihat Profil Utama</span>
                    </div>
                  )}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/20 group-hover:text-primary/50" />
              </Link>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl font-black">Akhiri Sesi?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-base">
              Anda akan keluar dari akun Elitera. Kami akan menantikan kembalinya inspirasi Anda segera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-full border-2 font-bold px-6">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive hover:bg-destructive/90 rounded-full font-bold px-8 shadow-lg shadow-destructive/20 text-white">Keluar Sekarang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

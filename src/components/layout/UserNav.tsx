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
  UserPlus,
  Moon,
  Sun,
  Loader2,
  Shield,
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


export function UserNav() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  // Safety net: Pastikan pointer-events kembali normal saat logout alert ditutup
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
    // Tutup modal dan sheet terlebih dahulu untuk mencegah pembekuan UI
    setIsLogoutAlertOpen(false);
    setIsSheetOpen(false);
    
    // Beri waktu sedikit agar animasi selesai sebelum logout
    setTimeout(async () => {
        await signOut();
        document.body.style.pointerEvents = ''; // Paksa aktifkan interaksi
        router.push('/login');
    }, 150);
  };
  
  if (isLoading || !user) {
    return null;
  }

  const userInitial = user.displayName ? user.displayName.charAt(0) : (user.email ? user.email.charAt(0) : 'U');

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-xs flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="font-headline">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto">
            <nav className="flex flex-col gap-1 p-4">
              {isAdmin && (
                 <SheetClose asChild>
                  <Link href="/admin" className="flex items-center justify-between p-2 rounded-md hover:bg-accent bg-accent/50 border border-primary/20 mb-2">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-primary">Dasbor Admin</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </SheetClose>
              )}
              <SheetClose asChild>
                <Link href="/settings" className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5" />
                    <span>Pengaturan</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/join-author" className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <BookUser className="h-5 w-5" />
                    <span>Bergabung sebagai penulis</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </SheetClose>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5" />
                  <span>Beralih akun</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <SheetClose asChild>
                <Link href="/about" className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5" />
                    <span>Tentang</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </SheetClose>
              <div
                onClick={toggleTheme}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 dark:hidden" />
                  <Moon className="h-5 w-5 hidden dark:block" />
                  <span>Ganti Tema</span>
                </div>
              </div>
            </nav>

            <Separator className="my-2" />
            
            <div className="p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 p-2 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsLogoutAlertOpen(true)}
              >
                <LogOut className="h-5 w-5" />
                <span>Keluar</span>
              </Button>
            </div>
          </div>
          <SheetFooter className="p-4 border-t mt-auto">
            <SheetClose asChild>
              <Link href={userProfile ? `/profile/${userProfile.username}` : '#'} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent"
                aria-disabled={isProfileLoading}
              >
                  <Avatar>
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  {isProfileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                  ) : (
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold truncate">{user.displayName || 'Pengguna'}</span>
                        <span className="text-sm text-muted-foreground">Lihat profil</span>
                    </div>
                  )}
              </Link>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan dikembalikan ke halaman login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive hover:bg-destructive/90">Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

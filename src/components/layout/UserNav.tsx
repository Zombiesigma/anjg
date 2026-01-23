'use client';

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
  User,
  LogOut,
  BookUser,
  Info,
  ChevronRight,
  UserPlus,
  Moon,
  Sun,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { users } from '@/lib/placeholder-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const currentUser = users[0];

export function UserNav() {
  // In a real app, you'd use a theme provider context
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="man portrait"/>
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-xs flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-headline">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto">
          <nav className="flex flex-col gap-1 p-4">
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
            <SheetClose asChild>
               <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5" />
                  <span>Beralih akun</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/about" className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5" />
                  <span>About</span>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 p-2 h-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah anda yakin ingin keluar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan dikembalikan ke halaman login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <SheetClose asChild>
                    <Link href="/login">
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Keluar</AlertDialogAction>
                    </Link>
                  </SheetClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <SheetFooter className="p-4 border-t mt-auto">
          <SheetClose asChild>
            <Link href={`/profile/${currentUser.username}`} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent">
                <Avatar>
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="man portrait"/>
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold">{currentUser.name}</span>
                    <span className="text-sm text-muted-foreground">Lihat profil</span>
                </div>
            </Link>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

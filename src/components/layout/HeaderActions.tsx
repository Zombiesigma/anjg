'use client';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell } from 'lucide-react';
import { UserNav } from './UserNav';
import { Skeleton } from '@/components/ui/skeleton';

export function HeaderActions() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Pesan</span>
          </Button>
        </Link>
        <Link href="/notifications">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifikasi</span>
          </Button>
        </Link>
        <UserNav />
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      <Link href="/login">
        <Button>Masuk</Button>
      </Link>
      <Link href="/register">
        <Button variant="outline">Daftar</Button>
      </Link>
    </nav>
  );
}

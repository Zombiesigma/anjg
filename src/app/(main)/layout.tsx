'use client';

import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';
import { usePathname } from 'next/navigation';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isImmersiveRoute = pathname?.startsWith('/messages') || pathname?.startsWith('/ai') || pathname?.startsWith('/reels');

  return (
    <ProtectedLayout>
      <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden w-full max-w-full">
        <Header />
        <main className="flex-1 flex flex-col relative overflow-x-hidden w-full">
          <div className="flex-1 container px-4 py-6 md:px-6 relative mx-auto overflow-x-hidden w-full max-w-full">
            {children}
          </div>
        </main>
        {/* Spacer bawah hanya muncul jika bukan rute imersif */}
        {!isImmersiveRoute && <div className="h-12 md:hidden shrink-0" />} 
        <MobileNav />
      </div>
    </ProtectedLayout>
  );
}

import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden w-full max-w-full">
        <Header />
        <main className="flex-1 flex flex-col relative overflow-x-hidden w-full">
          <div className="flex-1 container px-4 py-6 md:px-6 relative mx-auto overflow-x-hidden w-full max-w-full">
            {children}
          </div>
        </main>
        <div className="h-24 md:hidden shrink-0" /> 
        <MobileNav />
      </div>
    </ProtectedLayout>
  );
}
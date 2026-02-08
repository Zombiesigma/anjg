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
      <div className="relative flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-6 md:px-6">
          {children}
        </main>
        {/* Padding bawah untuk Mobile Nav agar konten tidak tertutup */}
        <div className="h-24 md:hidden" /> 
        <MobileNav />
      </div>
    </ProtectedLayout>
  );
}
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
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-6">{children}</main>
        <div className="h-16 md:hidden" /> {/* Spacer for mobile nav */}
        <MobileNav />
      </div>
    </ProtectedLayout>
  );
}

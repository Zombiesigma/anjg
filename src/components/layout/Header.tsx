import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { HeaderActions } from './HeaderActions';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold font-headline text-xl inline-block">
              Litera
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

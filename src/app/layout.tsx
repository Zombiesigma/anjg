import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const productionUrl = 'https://www.litera.my.id/';
const brandIcon = 'https://files.catbox.moe/arh8ho.jpg';

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: 'Elitera - Platform Sosial Literasi Digital',
    template: '%s | Elitera',
  },
  description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis yang bersemangat di Elitera, platform sosial literasi digital modern.',
  keywords: ['buku', 'novel', 'cerita', 'membaca', 'menulis', 'literasi', 'komunitas', 'platform sosial'],
  authors: [{ name: 'Guntur P.', url: 'https://www.gunturpadilah.web.id/' }],
  creator: 'Guntur P.',
  icons: {
    icon: brandIcon,
    apple: brandIcon,
  },
  openGraph: {
    title: {
      default: 'Elitera - Platform Sosial Literasi Digital',
      template: '%s | Elitera',
    },
    description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis.',
    siteName: 'Elitera',
    url: productionUrl,
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: brandIcon,
        width: 800,
        height: 800,
        alt: 'Elitera Logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
   twitter: {
    card: 'summary',
    title: {
      default: 'Elitera - Platform Sosial Literasi Digital',
      template: '%s | Elitera',
    },
    description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis.',
    images: [brandIcon],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

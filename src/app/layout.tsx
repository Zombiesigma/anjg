import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// TODO: Ganti dengan domain produksi Anda yang sebenarnya
const productionUrl = 'https://elitera.app';

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: 'Elitera - Platform Sosial Literasi Digital',
    template: '%s | Elitera',
  },
  description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis yang bersemangat di Elitera, platform sosial literasi digital modern.',
  keywords: ['buku', 'novel', 'cerita', 'membaca', 'menulis', 'literasi', 'komunitas', 'platform sosial'],
  authors: [{ name: 'Guntur P.', url: 'https://github.com/Guntur-s' }],
  creator: 'Guntur P.',
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

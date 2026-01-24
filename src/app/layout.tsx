import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// TODO: Ganti dengan domain produksi Anda yang sebenarnya
const productionUrl = 'https://litera.app';

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: 'Litera - Platform Sosial Literasi Digital',
    template: '%s | Litera',
  },
  description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis yang bersemangat di Litera, platform sosial literasi digital modern.',
  keywords: ['buku', 'novel', 'cerita', 'membaca', 'menulis', 'literasi', 'komunitas', 'platform sosial'],
  authors: [{ name: 'Guntur P.', url: 'https://github.com/Guntur-s' }],
  creator: 'Guntur P.',
  openGraph: {
    title: {
      default: 'Litera - Platform Sosial Literasi Digital',
      template: '%s | Litera',
    },
    description: 'Temukan, baca, dan tulis cerita. Terhubung dengan komunitas pembaca dan penulis.',
    siteName: 'Litera',
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
      default: 'Litera - Platform Sosial Literasi Digital',
      template: '%s | Litera',
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

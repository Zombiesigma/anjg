import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // TODO: Ganti dengan domain produksi Anda yang sebenarnya
  const siteUrl = 'https://elitera.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/login/',
        '/register/',
        '/verify-email/',
        '/settings/',
        '/upload/',
        '/messages/',
        '/notifications/',
        '*/edit/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

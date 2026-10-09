import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/edit',
        '/publish',
        '/settings',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: 'https://crpapo.com/sitemap.xml',
  };
}
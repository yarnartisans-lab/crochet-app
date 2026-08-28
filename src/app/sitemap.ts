import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Optimizes server performance by caching the sitemap for 24 hours (86400 seconds)
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // OPTIMIZATION 1: Fetch updated_at instead of created_at
  const { data: patterns } = await supabase
    .from('patterns')
    .select('id, slug, updated_at, image_url')
    .eq('is_published', true);

  const patternUrls: MetadataRoute.Sitemap = patterns?.map((pattern) => ({
    url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
    lastModified: new Date(pattern.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: pattern.image_url ? [pattern.image_url] : [],
  })) || [];

  const categories = ['garments', 'accessories', 'amigurumi', 'home-decor', 'blankets'];
  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `https://crpapo.com/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9, 
  }));

  // OPTIMIZATION 2: Add static "Trust" pages for Google E-E-A-T
  const staticPages = ['/about', '/contact', '/privacy-policy'].map((route) => ({
    url: `https://crpapo.com${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: 'https://crpapo.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://crpapo.com/explore',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...staticPages,
    ...categoryUrls,
    ...patternUrls,
  ];
}
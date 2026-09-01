import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// The absolute command to kill Next.js Route Caching
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: patterns, error } = await supabase
    .from('patterns')
    .select('id, slug, created_at')
    .eq('is_published', true);

  // DEBUG TRAP 1: If Supabase throws an authentication or RLS error, it prints as a URL
  if (error) {
    return [
      {
        url: `https://crpapo.com/ERROR-SUPABASE-${error.message.replace(/\s+/g, '-')}`,
        lastModified: new Date(),
      }
    ];
  }

  // DEBUG TRAP 2: If connection succeeds but 0 patterns match the filter
  if (!patterns || patterns.length === 0) {
    return [
      {
        url: `https://crpapo.com/DEBUG-CONNECTION-SUCCESS-BUT-ZERO-PATTERNS-FOUND`,
        lastModified: new Date(),
      }
    ];
  }

  const patternUrls: MetadataRoute.Sitemap = patterns.map((pattern) => ({
    url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
    lastModified: new Date(pattern.created_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categories = ['garments', 'accessories', 'amigurumi', 'home-decor', 'blankets'];
  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `https://crpapo.com/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9, 
  }));

  const staticPages = ['/about', '/contact', '/privacy-policy'].map((route) => ({
    url: `https://crpapo.com${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: 'https://crpapo.com',
      lastModified: new Date(), // If this time changes when you refresh, the cache is dead.
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
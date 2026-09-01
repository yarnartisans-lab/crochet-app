import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// THE CULPRIT REMOVED: Replaced the 24-hour revalidate lock with force-dynamic
// This guarantees Next.js reads the live production database every time Google requests the sitemap
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Added created_at fallback to prevent the query from silently failing if updated_at is missing
  const { data: patterns, error } = await supabase
    .from('patterns')
    .select('id, slug, updated_at, created_at')
    .eq('is_published', true);

  if (error) {
    console.error("Supabase Error fetching patterns for sitemap:", error.message);
  }

  const patternUrls: MetadataRoute.Sitemap = patterns?.map((pattern) => ({
    url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
    lastModified: new Date(pattern.updated_at || pattern.created_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

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
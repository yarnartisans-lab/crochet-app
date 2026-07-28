import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Using standard Supabase client for Server-Side fetching
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all published patterns (Now selecting the 'slug')
  const { data: patterns } = await supabase
    .from('patterns')
    .select('slug, created_at')
    .eq('is_published', true);

  const patternUrls = patterns?.map((pattern) => ({
    url: `https://crpapo.com/pattern/${pattern.slug}`,
    lastModified: new Date(pattern.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

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
    ...patternUrls,
  ];
}
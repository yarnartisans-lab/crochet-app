import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: patterns } = await supabase
    .from('patterns')
    .select('id, slug, created_at')
    .eq('is_published', true);

  const patternUrls = patterns?.map((pattern) => ({
    url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
    lastModified: new Date(pattern.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

  // ADDED: The dedicated category pages for SEO
  const categories = ['garments', 'accessories', 'amigurumi', 'home-decor', 'blankets'];
  const categoryUrls = categories.map((cat) => ({
    url: `https://crpapo.com/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9, // High priority so Google indexes these pages faster
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
    ...categoryUrls,
    ...patternUrls,
  ];
}
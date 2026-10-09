import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: 'https://crpapo.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://crpapo.com/explore',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://crpapo.com/privacy-policy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://crpapo.com/terms',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://crpapo.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const categories = ['garments', 'accessories', 'amigurumi', 'home-decor', 'blankets'];
  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `https://crpapo.com/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  if (!supabaseUrl || !supabaseKey) {
    return [...baseUrls, ...categoryUrls];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let patternUrls: MetadataRoute.Sitemap = [];
  let creatorUrls: MetadataRoute.Sitemap = [];

  try {
    const [patternsRes, profilesRes] = await Promise.all([
      supabase
        .from('patterns')
        .select('id, slug, created_at')
        .eq('is_published', true),
      supabase
        .from('profiles')
        .select('username')
        .not('username', 'is', null),
    ]);

    if (patternsRes.data) {
      patternUrls = patternsRes.data.map((pattern) => ({
        url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
        lastModified: new Date(pattern.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }

    if (profilesRes.data) {
      creatorUrls = profilesRes.data
        .filter((profile) => profile.username && profile.username.trim() !== '')
        .map((profile) => ({
          url: `https://crpapo.com/creator/${encodeURIComponent(profile.username.trim())}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Failed to generate dynamic sitemap entries:', error);
  }

  return [...baseUrls, ...categoryUrls, ...creatorUrls, ...patternUrls];
}
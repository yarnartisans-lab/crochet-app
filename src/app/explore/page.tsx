import { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import ExploreClient from './ExploreClient';

const PAGE_SIZE = 24;

// Cache default explore queries for 60s (ISR)
export const revalidate = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. DYNAMIC METADATA BASED ON SEARCH OR FILTER PARAMETERS
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';

  const title = q
    ? `"${q}" Crochet Patterns | Search Crpapo`
    : category
    ? `Free ${category} Crochet Patterns | Crpapo`
    : 'Explore Free Interactive Crochet Patterns | Crpapo';

  const description = q
    ? `Browse free interactive crochet patterns matching "${q}" with step-by-step row counters.`
    : 'Search and filter hundreds of free, interactive crochet patterns by category, difficulty, and language.';

  return {
    title,
    description,
    alternates: {
      canonical: 'https://crpapo.com/explore',
    },
    openGraph: {
      title,
      description,
      url: 'https://crpapo.com/explore',
      siteName: 'Crpapo',
      images: [
        {
          url: 'https://crpapo.com/icon.png',
          alt: 'Crpapo Explore Patterns',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://crpapo.com/icon.png'],
    },
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const difficulty =
    typeof resolvedParams.difficulty === 'string' ? resolvedParams.difficulty : '';
  const language =
    typeof resolvedParams.language === 'string' ? resolvedParams.language : '';

  let dbQuery = supabase
    .from('patterns')
    .select('*')
    .eq('is_published', true)
    .order('views', { ascending: false })
    .order('created_at', { ascending: false });

  if (query) dbQuery = dbQuery.ilike('title', `%${query}%`);
  if (category) dbQuery = dbQuery.eq('category', category);
  if (difficulty) dbQuery = dbQuery.eq('difficulty_level', difficulty);
  if (language) dbQuery = dbQuery.eq('language', language);

  let patterns: any[] = [];
  try {
    const { data } = await dbQuery.range(0, PAGE_SIZE - 1);
    patterns = data || [];
  } catch (err) {
    console.error('Error pre-fetching explore patterns:', err);
  }

  const hasMore = patterns.length === PAGE_SIZE;

  // Structured Data (JSON-LD)
  const itemListSchema =
    patterns.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: query ? `Search results for "${query}"` : 'Explore Crochet Patterns',
          itemListElement: patterns.map((pattern, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
            name: pattern.title,
          })),
        }
      : null;

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
            Loading patterns...
          </div>
        }
      >
        <ExploreClient initialPatterns={patterns} initialHasMore={hasMore} />
      </Suspense>
    </>
  );
}
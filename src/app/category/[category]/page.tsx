import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Cache category pages for 60 seconds (ISR) for instant TTFB
export const revalidate = 60;

const categoryMap: Record<string, string> = {
  'garments': 'Garments',
  'accessories': 'Accessories',
  'amigurumi': 'Amigurumi / Plushies',
  'home-decor': 'Home Decor',
  'blankets': 'Blankets',
};

// Pre-render all primary categories at build time for optimal search engine performance
export function generateStaticParams() {
  return Object.keys(categoryMap).map((category) => ({
    category,
  }));
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. DYNAMIC SEO METADATA & SOCIAL CARDS
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const normalizedCategory = category.toLowerCase();
  const dbCategory = categoryMap[normalizedCategory];

  if (!dbCategory) {
    return {
      title: 'Category Not Found | Crpapo',
      robots: { index: false, follow: false },
    };
  }

  const formattedName = normalizedCategory
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch top pattern image to use as dynamic Open Graph preview image
  const { data: topPattern } = await supabase
    .from('patterns')
    .select('title, image_url, image_urls')
    .eq('is_published', true)
    .ilike('category', `${dbCategory}%`)
    .order('views', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ogImage =
    topPattern?.image_urls?.[0] ||
    topPattern?.image_url ||
    'https://crpapo.com/icon.png';

  const title = `Free ${formattedName} Crochet Patterns | Crpapo`;
  const description = `Explore our curated collection of free, interactive ${formattedName.toLowerCase()} crochet patterns with row-by-row tracking and step-by-step instructions.`;
  const canonicalUrl = `https://crpapo.com/category/${category}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Crpapo',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 600,
          alt: `${formattedName} crochet patterns on Crpapo`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const normalizedCategory = category.toLowerCase();
  const dbCategory = categoryMap[normalizedCategory];

  if (!dbCategory) {
    notFound();
  }

  // 2. SERVER-SIDE FETCHING
  const { data: patterns } = await supabase
    .from('patterns')
    .select('*')
    .eq('is_published', true)
    .ilike('category', `${dbCategory}%`)
    .order('created_at', { ascending: false });

  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  // 3. STRUCTURED DATA (JSON-LD)
  const schemas: any[] = [];

  // Breadcrumb Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://crpapo.com/' },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://crpapo.com/explore' },
      {
        '@type': 'ListItem',
        position: 3,
        name: dbCategory,
        item: `https://crpapo.com/category/${category}`,
      },
    ],
  });

  // CollectionPage & ItemList Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${dbCategory} Crochet Patterns`,
    description: `Curated collection of free, interactive ${dbCategory.toLowerCase()} crochet patterns.`,
    url: `https://crpapo.com/category/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (patterns || []).map((pattern, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
        name: pattern.title,
      })),
    },
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      {/* Dynamic JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <Link
            href="/explore"
            className="text-sm font-semibold text-[#D97757] hover:underline mb-2 inline-block"
          >
            ← Back to all patterns
          </Link>
          <h1
            id="category-title"
            className="text-3xl sm:text-5xl font-extrabold tracking-tight capitalize"
          >
            {dbCategory} Patterns
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Browse our dedicated collection of free {dbCategory.toLowerCase()} patterns.
          </p>
        </div>
      </header>

      <main aria-labelledby="category-title" className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        {!patterns || patterns.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            No patterns found in this category yet. Check back soon!
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {patterns.map((pattern) => {
              const imageUrl = pattern.image_urls?.[0] || pattern.image_url || fallbackImage;
              const seoAltText = `Free step-by-step ${dbCategory.toLowerCase()} pattern for ${pattern.title}`;

              return (
                <article key={pattern.id} className="group block break-inside-avoid">
                  <Link href={`/pattern/${pattern.slug || pattern.id}`}>
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                      <Image
                        src={imageUrl}
                        alt={seoAltText}
                        width={600}
                        height={800}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <div className="text-white w-full">
                          <h2 className="font-bold text-lg leading-tight mb-1 truncate">
                            {pattern.title}
                          </h2>
                          <p className="text-sm opacity-90 font-medium">
                            Difficulty: {pattern.difficulty_level || 'Varies'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
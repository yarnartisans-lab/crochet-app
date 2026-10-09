import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import NavbarAuth from './NavbarAuth';

// Revalidate homepage every 60 seconds (ISR)
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Free Interactive Crochet Patterns & Row Tracker | Crpapo',
  description:
    'Discover free, interactive crochet patterns with built-in row tracking. Crafters never lose their place, and designers share their work beautifully.',
  alternates: {
    canonical: 'https://crpapo.com',
  },
  openGraph: {
    title: 'Free Interactive Crochet Patterns & Row Tracker | Crpapo',
    description:
      'Discover free, interactive crochet patterns with built-in row tracking. Never lose your place in a pattern again.',
    url: 'https://crpapo.com',
    siteName: 'Crpapo',
    type: 'website',
    images: [
      {
        url: 'https://crpapo.com/icon.png',
        width: 512,
        height: 512,
        alt: 'Crpapo - Interactive Pattern Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Interactive Crochet Patterns & Row Tracker | Crpapo',
    description:
      'Discover free, interactive crochet patterns with built-in row tracking. Never lose your place in a pattern again.',
    images: ['https://crpapo.com/icon.png'],
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function HomePage() {
  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  let patterns: any[] = [];

  try {
    const { data: publishedPatterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('is_published', true)
      .order('views', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12);

    if (publishedPatterns && publishedPatterns.length > 0) {
      const designerIds = [...new Set(publishedPatterns.map((p) => p.designer_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', designerIds);

      const profileMap: Record<string, string> = {};
      if (profiles) {
        profiles.forEach((profile) => {
          profileMap[profile.id] = profile.username;
        });
      }

      patterns = publishedPatterns.map((pattern) => ({
        ...pattern,
        designer_name: profileMap[pattern.designer_id] || 'Creator',
      }));
    }
  } catch (err) {
    console.error('Error loading homepage patterns:', err);
  }

  // Structured Data (JSON-LD) for Showcase ItemList
  const showcaseSchema =
    patterns.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Popular Interactive Crochet Patterns',
          itemListElement: patterns.map((pattern, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
            name: pattern.title,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] scroll-smooth">
      {showcaseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(showcaseSchema) }}
        />
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-extrabold tracking-tighter text-[#2D2D2D]"
            >
              Crpapo
            </Link>
            <Link
              href="/explore"
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Explore Patterns
            </Link>
          </div>

          {/* Client-side Auth State */}
          <NavbarAuth />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="bg-white border-b border-gray-100 py-8 sm:py-12 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#2D2D2D] leading-[1.15]">
            Never lose your place in a pattern again.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Discover beautiful, interactive patterns from top creators. Click off rows as you
            complete them, directly from your phone or tablet.
          </p>
        </div>
      </header>

      {/* Popular Patterns Showcase - Pre-rendered on Server for Crawlers */}
      <section
        aria-labelledby="explore-heading"
        id="explore"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 sm:pt-10 sm:pb-24 scroll-mt-20"
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 id="explore-heading" className="text-xl sm:text-2xl font-bold tracking-tight">
            Explore Popular Patterns
          </h2>
        </div>

        {patterns.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 font-medium">No patterns published yet.</p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
              {patterns.map((pattern, index) => {
                const imageUrl = pattern.image_urls?.[0] || pattern.image_url || fallbackImage;
                const categoryContext = pattern.category
                  ? pattern.category.toLowerCase()
                  : 'crochet';
                const difficultyContext = pattern.difficulty_level
                  ? `for ${pattern.difficulty_level.toLowerCase()}s`
                  : '';
                const seoAltText = `Free step-by-step ${categoryContext} pattern for ${pattern.title} ${difficultyContext}.`;

                return (
                  <article key={pattern.id} className="group block break-inside-avoid">
                    <Link href={`/pattern/${pattern.slug || pattern.id}`}>
                      <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                        <Image
                          src={imageUrl}
                          alt={seoAltText}
                          width={600}
                          height={800}
                          priority={index < 4}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-5">
                          <div className="text-white w-full">
                            <h3 className="font-bold text-sm sm:text-lg leading-tight mb-1 truncate">
                              {pattern.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-xs sm:text-sm opacity-90 font-medium truncate mr-2">
                                By @{pattern.designer_name}
                              </p>
                              <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 rounded-md backdrop-blur-sm whitespace-nowrap">
                                {pattern.difficulty_level || 'Varies'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/explore"
                className="inline-block bg-white border border-gray-200 text-[#2D2D2D] font-bold py-3 px-8 rounded-full hover:border-[#D97757] hover:text-[#D97757] transition-colors shadow-sm"
              >
                View All Patterns
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// 1. DYNAMIC SEO METADATA INJECTION
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params; 
  
  const formattedName = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Free ${formattedName} Crochet Patterns | Crpapo`,
    description: `Explore our collection of beautiful, interactive ${formattedName.toLowerCase()} crochet patterns. Free, step-by-step, and easy to follow!`,
    alternates: {
      canonical: `https://crpapo.com/category/${category}`,
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  // 2. URL SLUG TO DATABASE CATEGORY MAPPING
  const categoryMap: Record<string, string> = {
    'garments': 'Garments',
    'accessories': 'Accessories',
    'amigurumi': 'Amigurumi / Plushies',
    'home-decor': 'Home Decor',
    'blankets': 'Blankets'
  };

  const dbCategory = categoryMap[category.toLowerCase()] || category;

  // 3. SERVER-SIDE FETCHING
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: patterns } = await supabase
    .from('patterns')
    .select('*')
    .eq('is_published', true)
    .ilike('category', `${dbCategory}%`) 
    .order('created_at', { ascending: false });

  const fallbackImage = 'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  // 4. DYNAMIC SCHEMA GENERATION
  const schemas: any[] = [];
  
  // Breadcrumb schema proves site architecture to Google
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://crpapo.com/" },
      { "@type": "ListItem", "position": 2, "name": "Explore", "item": "https://crpapo.com/explore" },
      { "@type": "ListItem", "position": 3, "name": dbCategory, "item": `https://crpapo.com/category/${category}` }
    ]
  });

  // ItemList schema transforms the page into an authoritative directory
  if (patterns && patterns.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": patterns.map((pattern, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
        "name": pattern.title
      }))
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      {/* Injecting the Schemas */}
      {schemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
      )}

      {/* Upgraded to a <header> tag */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <Link href="/explore" className="text-sm font-semibold text-[#D97757] hover:underline mb-2 inline-block">
            ← Back to all patterns
          </Link>
          <h1 id="category-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight capitalize">
            {dbCategory} Patterns
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Browse our dedicated collection of {dbCategory.toLowerCase()} patterns. 
          </p>
        </div>
      </header>

      {/* Tied the <main> tag to the H1 */}
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
                // Upgraded to <article> and <h2> for proper hierarchy
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
                          <h2 className="font-bold text-lg leading-tight mb-1 truncate">{pattern.title}</h2>
                          <p className="text-sm opacity-90 font-medium">Difficulty: {pattern.difficulty_level || 'Varies'}</p>
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
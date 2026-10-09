'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import PinButton from '@/components/PinButton';

const PAGE_SIZE = 24;

interface ExploreClientProps {
  initialPatterns: any[];
  initialHasMore: boolean;
}

export default function ExploreClient({
  initialPatterns,
  initialHasMore,
}: ExploreClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentLanguage = searchParams.get('language') || '';
  const currentHookSize = searchParams.get('hook') || '';
  const currentYarnWeight = searchParams.get('yarn') || '';

  const supabase = createClient();
  const [patterns, setPatterns] = useState<any[]>(initialPatterns);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const buildQuery = () => {
    let dbQuery = supabase
      .from('patterns')
      .select('*')
      .eq('is_published', true)
      .order('views', { ascending: false })
      .order('created_at', { ascending: false });

    if (query) dbQuery = dbQuery.ilike('title', `%${query}%`);
    if (currentCategory) dbQuery = dbQuery.eq('category', currentCategory);
    if (currentDifficulty) dbQuery = dbQuery.eq('difficulty_level', currentDifficulty);
    if (currentLanguage) dbQuery = dbQuery.eq('language', currentLanguage);
    if (currentHookSize) {
      const cleanHook = currentHookSize.replace(/[^\d.]/g, '');
      dbQuery = dbQuery.ilike('hook_size', `%${cleanHook}%`);
    }
    if (currentYarnWeight) dbQuery = dbQuery.ilike('yarn_weight', `%${currentYarnWeight}%`);

    return dbQuery;
  };

  // Re-fetch when query or any filter changes on client
  useEffect(() => {
    const hasFilters = Boolean(
      query ||
        currentCategory ||
        currentDifficulty ||
        currentLanguage ||
        currentHookSize ||
        currentYarnWeight
    );
    if (!hasFilters && patterns.length === initialPatterns.length && page === 0) {
      return;
    }

    async function fetchSearchData() {
      setLoading(true);
      setPage(0);

      const dbQuery = buildQuery().range(0, PAGE_SIZE - 1);
      const { data } = await dbQuery;

      if (data) {
        setPatterns(data);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setPatterns([]);
        setHasMore(false);
      }
      setLoading(false);
    }

    fetchSearchData();
  }, [
    query,
    currentCategory,
    currentDifficulty,
    currentLanguage,
    currentHookSize,
    currentYarnWeight,
  ]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    const dbQuery = buildQuery().range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);

    const { data } = await dbQuery;

    if (data) {
      setPatterns((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  const updateFilters = (
    newSearch?: string,
    newDifficulty?: string,
    newLanguage?: string,
    newHookSize?: string,
    newYarnWeight?: string
  ) => {
    const params = new URLSearchParams();

    const finalSearch = newSearch !== undefined ? newSearch : searchInput;
    const finalDifficulty = newDifficulty !== undefined ? newDifficulty : currentDifficulty;
    const finalLanguage = newLanguage !== undefined ? newLanguage : currentLanguage;
    const finalHookSize = newHookSize !== undefined ? newHookSize : currentHookSize;
    const finalYarnWeight = newYarnWeight !== undefined ? newYarnWeight : currentYarnWeight;

    if (finalSearch.trim()) params.set('q', finalSearch.trim());
    if (currentCategory) params.set('category', currentCategory);
    if (finalDifficulty) params.set('difficulty', finalDifficulty);
    if (finalLanguage) params.set('language', finalLanguage);
    if (finalHookSize) params.set('hook', finalHookSize);
    if (finalYarnWeight) params.set('yarn', finalYarnWeight);

    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFilters(searchInput);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (!selected) {
      router.push('/explore');
      return;
    }

    const categoryMap: Record<string, string> = {
      'Garments': 'garments',
      'Accessories': 'accessories',
      'Amigurumi / Plushies': 'amigurumi',
      'Home Decor': 'home-decor',
      'Blankets': 'blankets',
    };

    const slug = categoryMap[selected];
    if (slug) {
      router.push(`/category/${slug}`);
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  const hasActiveFilters = Boolean(
    currentCategory ||
      currentDifficulty ||
      currentLanguage ||
      currentHookSize ||
      currentYarnWeight ||
      query
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]"
            >
              ← Back to Home
            </Link>
            <span className="font-extrabold tracking-tighter text-xl">Crpapo</span>
          </div>

          <h1 id="explore-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {query ? `Search results for "${query}"` : 'Explore All Patterns'}
          </h1>

          <div className="relative max-w-lg mt-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search for beanies, cardigans... (Press Enter)"
              className="w-full rounded-full border-0 py-3 pl-5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] bg-gray-50"
            />
            <svg
              className="absolute right-4 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Bar with Hook Size and Yarn Weight */}
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Category Dropdown */}
            <select
              value={currentCategory}
              onChange={handleCategoryChange}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors bg-white focus:ring-2 focus:ring-[#D97757] outline-none cursor-pointer text-gray-700 whitespace-nowrap"
            >
              <option value="">All Categories</option>
              <option value="Garments">Garments</option>
              <option value="Accessories">Accessories</option>
              <option value="Amigurumi / Plushies">Amigurumi / Plushies</option>
              <option value="Home Decor">Home Decor</option>
              <option value="Blankets">Blankets</option>
            </select>

            {/* Difficulty Dropdown */}
            <select
              value={currentDifficulty}
              onChange={(e) => updateFilters(undefined, e.target.value, undefined, undefined, undefined)}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors bg-white focus:ring-2 focus:ring-[#D97757] outline-none cursor-pointer text-gray-700 whitespace-nowrap"
            >
              <option value="">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Easy">Easy</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Hook Size Dropdown */}
            <select
              value={currentHookSize}
              onChange={(e) => updateFilters(undefined, undefined, undefined, e.target.value, undefined)}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors bg-white focus:ring-2 focus:ring-[#D97757] outline-none cursor-pointer text-gray-700 whitespace-nowrap"
            >
              <option value="">All Hook Sizes</option>
              <option value="2.0">2.0mm</option>
              <option value="2.5">2.5mm</option>
              <option value="3.0">3.0mm</option>
              <option value="3.5">3.5mm (E)</option>
              <option value="4.0">4.0mm (G)</option>
              <option value="4.5">4.5mm (7)</option>
              <option value="5.0">5.0mm (H)</option>
              <option value="5.5">5.5mm (I)</option>
              <option value="6.0">6.0mm (J)</option>
              <option value="6.5">6.5mm (K)</option>
              <option value="8.0">8.0mm (L)</option>
              <option value="9.0">9.0mm (M/N)</option>
              <option value="10.0">10.0mm (N/P)</option>
            </select>

            {/* Yarn Weight Dropdown */}
            <select
              value={currentYarnWeight}
              onChange={(e) => updateFilters(undefined, undefined, undefined, undefined, e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors bg-white focus:ring-2 focus:ring-[#D97757] outline-none cursor-pointer text-gray-700 whitespace-nowrap"
            >
              <option value="">All Yarn Weights</option>
              <option value="Lace">0 - Lace</option>
              <option value="Super Fine">1 - Super Fine</option>
              <option value="Fine">2 - Fine / Sport</option>
              <option value="Light">3 - Light / DK</option>
              <option value="Worsted">4 - Medium / Worsted</option>
              <option value="Bulky">5 - Bulky</option>
              <option value="Super Bulky">6 - Super Bulky</option>
              <option value="Jumbo">7 - Jumbo</option>
            </select>

            {/* Language Dropdown */}
            <select
              value={currentLanguage}
              onChange={(e) => updateFilters(undefined, undefined, e.target.value, undefined, undefined)}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors bg-white focus:ring-2 focus:ring-[#D97757] outline-none cursor-pointer text-gray-700 whitespace-nowrap"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Dutch">Dutch</option>
              <option value="Portuguese">Portuguese</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchInput('');
                  router.push('/explore');
                }}
                className="px-4 py-2 whitespace-nowrap rounded-full bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Clear All ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <main
        aria-labelledby="explore-title"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10"
      >
        {loading ? (
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div
                key={skeleton}
                className="break-inside-avoid bg-gray-100 rounded-2xl h-48 sm:h-80 animate-pulse border border-gray-200"
              ></div>
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            We couldn&apos;t find any patterns matching your filters. Try clearing them to see more!
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
              {patterns.map((pattern) => {
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
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                      <Link href={`/pattern/${pattern.slug || pattern.id}`} className="block">
                        <Image
                          src={imageUrl}
                          alt={seoAltText}
                          width={600}
                          height={800}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-5">
                          <div className="text-white w-full">
                            <h2 className="font-bold text-sm sm:text-lg leading-tight mb-1 truncate">
                              {pattern.title}
                            </h2>
                            <div className="flex items-center justify-between text-xs sm:text-sm opacity-90 font-medium">
                              <span>Hook: {pattern.hook_size || 'Varies'}</span>
                              <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 bg-white/20 rounded backdrop-blur-sm">
                                {pattern.difficulty_level || 'Beginner'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Floating Pinterest Pin Button */}
                      <PinButton
                        slug={pattern.slug || pattern.id}
                        title={pattern.title}
                        imageUrl={imageUrl}
                        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 text-[#2D2D2D] font-bold py-3 px-8 rounded-full hover:border-[#D97757] hover:text-[#D97757] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loadingMore ? 'Loading...' : 'Load More Patterns'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
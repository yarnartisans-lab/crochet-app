'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const supabase = createClient();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the local search bar
  const [searchInput, setSearchInput] = useState(query);

  // Keep the input box synced with the URL
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    async function fetchSearchData() {
      setLoading(true);
      
      let dbQuery = supabase
        .from('patterns')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (query) {
        dbQuery = dbQuery.ilike('title', `%${query}%`);
      }

      const { data } = await dbQuery;
      
      if (data) setPatterns(data);
      setLoading(false);
    }

    fetchSearchData();
  }, [query]);

  // NEW: Handle pressing Enter in the search box
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchInput.trim() !== '') {
        router.push(`/explore?q=${encodeURIComponent(searchInput)}`);
      } else {
        router.push(`/explore`); // Clears the search if empty
      }
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]">← Back to Home</Link>
            <span className="font-extrabold tracking-tighter text-xl">Crpapo</span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight">
            {query ? `Search results for "${query}"` : 'Explore All Patterns'}
          </h1>
          
          {/* NEW: The integrated search bar */}
          <div className="relative max-w-lg mt-2">
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search for beanies, cardigans... (Press Enter)" 
              className="w-full rounded-full border-0 py-3 pl-5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] bg-gray-50"
            />
            <svg className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button className="px-4 py-1.5 whitespace-nowrap rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors">Beginner Friendly</button>
            <button className="px-4 py-1.5 whitespace-nowrap rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors">Chunky Yarn</button>
            <button className="px-4 py-1.5 whitespace-nowrap rounded-full border border-gray-200 text-sm font-medium hover:border-[#D97757] transition-colors">Amigurumi</button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Searching the library...</div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            We couldn't find any patterns matching "{query}". Try another term!
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {patterns.map((pattern) => {
              const imageUrl = pattern.image_url || fallbackImage;
              return (
                <Link key={pattern.id} href={`/pattern/${pattern.id}`} className="group block break-inside-avoid">
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                    <img src={imageUrl} alt={pattern.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <div className="text-white">
                        <p className="font-bold text-lg leading-tight mb-1">{pattern.title}</p>
                        <p className="text-sm opacity-90 font-medium">Difficulty: {pattern.difficulty_level || 'Varies'}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// Next.js requires useSearchParams to be wrapped in a Suspense boundary
export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function HomePage() {
  const supabase = createClient();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadHomepageData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // UPDATED: Now sorting by highest views first, falling back to newest if views are tied
      const { data: publishedPatterns } = await supabase
        .from('patterns')
        .select('*')
        .eq('is_published', true)
        .order('views', { ascending: false })
        .order('created_at', { ascending: false });

      if (publishedPatterns) {
        const designerIds = [...new Set(publishedPatterns.map(p => p.designer_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', designerIds);

        const profileMap: Record<string, string> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile.username;
          });
        }

        const patternsWithDesigners = publishedPatterns.map(pattern => ({
          ...pattern,
          designer_name: profileMap[pattern.designer_id] || 'Creator'
        }));

        setPatterns(patternsWithDesigners);
      }
      setLoading(false);
    }

    loadHomepageData();
  }, []);

  const fallbackImage = 'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] scroll-smooth">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tighter text-[#2D2D2D]">
              Crpapo
            </Link>
            <Link href="/explore" className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors whitespace-nowrap">
              Explore Patterns
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-[#D97757] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#C26243] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">Creator </span>Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 whitespace-nowrap">
                  Log in
                </Link>
                <Link href="/login" className="rounded-full bg-[#2D2D2D] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-black transition-colors whitespace-nowrap">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="bg-white border-b border-gray-100 py-16 sm:py-20 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#2D2D2D] leading-[1.15]">
            Never lose your place in a pattern again.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Discover beautiful, interactive patterns from top creators. Click off rows as you complete them, directly from your phone or tablet.
          </p>
        </div>
      </header>

      <main id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Explore Popular Patterns</h2>
        </div>

        {loading ? (
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="break-inside-avoid bg-gray-100 rounded-2xl h-48 sm:h-80 animate-pulse border border-gray-200"></div>
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 font-medium">No patterns published yet.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
            {patterns.map((pattern) => {
              const imageUrl = pattern.image_urls?.[0] || pattern.image_url || fallbackImage;
              
              return (
                <Link key={pattern.id} href={`/pattern/${pattern.id}`} className="group block break-inside-avoid">
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                    <img src={imageUrl} alt={pattern.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-5">
                      <div className="text-white w-full">
                        <p className="font-bold text-sm sm:text-lg leading-tight mb-1 truncate">{pattern.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm opacity-90 font-medium truncate mr-2">By @{pattern.designer_name}</p>
                          <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 rounded-md backdrop-blur-sm whitespace-nowrap">
                            {pattern.difficulty_level || 'Varies'}
                          </span>
                        </div>
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
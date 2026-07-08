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
      // 1. Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Fetch all published patterns
      const { data: publishedPatterns } = await supabase
        .from('patterns')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (publishedPatterns) {
        // 3. Fetch designer usernames
        const designerIds = [...new Set(publishedPatterns.map(p => p.designer_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', designerIds);

        // FIX: Explicitly define the record type to satisfy TypeScript
        const profileMap: Record<string, string> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile.username;
          });
        }

        // 4. Combine pattern data with designer usernames
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
      {/* NAVIGATION */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-extrabold tracking-tighter text-[#2D2D2D]">
              Crpapo
            </Link>
            {/* NEW: Explore Patterns Link */}
            <Link href="#explore" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-[#D97757] transition-colors">
              Explore Patterns
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-[#D97757] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C26243] transition-colors">
                Creator Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link href="/login" className="rounded-full bg-[#2D2D2D] px-5 py-2 text-sm font-semibold text-white hover:bg-black transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="bg-white border-b border-gray-100 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#2D2D2D] leading-tight">
            Never lose your place in a pattern again.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Discover beautiful, interactive patterns from top creators. Click off rows as you complete them, directly from your phone or tablet.
          </p>
        </div>
      </header>

      {/* PATTERN GRID */}
      {/* ADDED: id="explore" to connect with the nav link */}
      <main id="explore" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Explore Patterns</h2>
        </div>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="break-inside-avoid bg-gray-100 rounded-2xl h-80 animate-pulse border border-gray-200"></div>
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 font-medium">No patterns published yet.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {patterns.map((pattern) => {
              const imageUrl = pattern.image_urls?.[0] || pattern.image_url || fallbackImage;
              
              return (
                <Link key={pattern.id} href={`/pattern/${pattern.id}`} className="group block break-inside-avoid">
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                    <img src={imageUrl} alt={pattern.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <div className="text-white w-full">
                        <p className="font-bold text-lg leading-tight mb-1 truncate">{pattern.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm opacity-90 font-medium">By @{pattern.designer_name}</p>
                          <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded-md backdrop-blur-sm">
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
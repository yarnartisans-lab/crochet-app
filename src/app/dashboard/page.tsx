'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function DesignerDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');
  const [patterns, setPatterns] = useState<any[]>([]);
  const [savedPatterns, setSavedPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalViews: 0,
    affiliateClicks: 0,
  });

  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (profileData?.username) {
          setUsername(profileData.username);
        }

        // 2. Fetch User's Published Patterns
        const { data: userPatterns } = await supabase
          .from('patterns')
          .select('*')
          .eq('designer_id', user.id)
          .order('created_at', { ascending: false });

        if (userPatterns) {
          setPatterns(userPatterns);
          let views = 0;
          let clicks = 0;
          userPatterns.forEach((pattern) => {
            views += pattern.views || 0;
            clicks += pattern.outbound_clicks || 0;
          });
          setStats({ totalViews: views, affiliateClicks: clicks });
        }

        // 3. Fetch User's Saved / Bookmarked Patterns
        const { data: savedData } = await supabase
          .from('saved_patterns')
          .select(`
            id,
            pattern_id,
            created_at,
            patterns:pattern_id (
              id,
              title,
              slug,
              image_url,
              image_urls,
              category,
              difficulty_level,
              views
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (savedData) {
          setSavedPatterns(savedData.filter((item) => item.patterns));
        }
      }
      setLoading(false);
    }
    loadUserData();
  }, [supabase]);

  const handleDelete = async (patternId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this pattern? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      const { error: stepsError } = await supabase
        .from('pattern_steps')
        .delete()
        .eq('pattern_id', patternId);

      if (stepsError) throw stepsError;

      const { error: patternError, data: deletedPattern } = await supabase
        .from('patterns')
        .delete()
        .eq('id', patternId)
        .select();

      if (patternError) throw patternError;

      if (!deletedPattern || deletedPattern.length === 0) {
        throw new Error('Database blocked deletion. Please check Supabase RLS policies.');
      }

      setPatterns((prevPatterns) => prevPatterns.filter((p) => p.id !== patternId));
    } catch (error: any) {
      console.error('Error deleting pattern:', error);
      alert(`Failed to delete pattern: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRemoveSaved = async (savedId: string) => {
    try {
      const { error } = await supabase.from('saved_patterns').delete().eq('id', savedId);
      if (error) throw error;
      setSavedPatterns((prev) => prev.filter((p) => p.id !== savedId));
    } catch (error: any) {
      console.error('Error removing saved pattern:', error);
      alert('Failed to remove pattern from saved list.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold tracking-tighter">
              Crpapo <span className="text-[#D97757]">Dashboard</span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-md bg-white border border-gray-200 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Home
            </Link>

            {username && (
              <Link
                href={`/creator/${encodeURIComponent(username)}`}
                className="rounded-md bg-white border border-gray-200 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View My Profile
              </Link>
            )}

            <Link
              href="/publish"
              className="rounded-md bg-[#D97757] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C26243] transition-colors"
            >
              + New Pattern
            </Link>

            <Link
              href="/settings"
              className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-[#D97757] transition-all"
              title="Settings"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your published designs and view your saved crafting queue.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('published')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'published'
                ? 'border-[#D97757] text-[#D97757]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>My Published Patterns</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              {patterns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-[#D97757] text-[#D97757]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Saved Patterns (Queue)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              {savedPatterns.length}
            </span>
          </button>
        </div>

        {/* TAB 1: MY PUBLISHED PATTERNS */}
        {activeTab === 'published' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Pattern Views</p>
                  <p className="text-4xl font-bold">{stats.totalViews}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-full text-blue-500">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Affiliate Link Clicks</p>
                  <p className="text-4xl font-bold">{stats.affiliateClicks}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-full text-green-500">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Published Patterns Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold">Your Published Patterns</h2>
                <Link
                  href="/publish"
                  className="text-xs font-bold text-[#D97757] hover:underline"
                >
                  + Add Pattern
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Pattern Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Clicks</th>
                      <th className="px-6 py-4">Date Added</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          Loading your patterns...
                        </td>
                      </tr>
                    ) : patterns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <p className="font-semibold text-gray-700 mb-1">
                            You haven&apos;t published any patterns yet.
                          </p>
                          <p className="text-xs text-gray-400 mb-4">
                            Share your designs and earn through yarn affiliate recommendations.
                          </p>
                          <Link
                            href="/publish"
                            className="inline-block rounded-full bg-[#D97757] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#C26243] transition-colors"
                          >
                            Publish Your First Pattern
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      patterns.map((pattern) => (
                        <tr key={pattern.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {pattern.title}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {pattern.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{pattern.views || 0}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {pattern.outbound_clicks || 0}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(pattern.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-4">
                            <Link
                              href={`/edit/${pattern.id}`}
                              className="text-gray-500 font-medium hover:text-gray-900"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/pattern/${pattern.slug || pattern.id}`}
                              className="text-[#D97757] font-medium hover:underline"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(pattern.id)}
                              className="text-red-500 font-medium hover:text-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAVED PATTERNS / QUEUE */}
        {activeTab === 'saved' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {savedPatterns.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-400 mx-auto flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">Your Saved Patterns Queue is Empty</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Browse the pattern library and tap the heart icon on any pattern to save it to your
                  personal to-make list.
                </p>
                <Link
                  href="/explore"
                  className="inline-block rounded-full bg-[#D97757] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C26243] transition-colors"
                >
                  Explore Patterns
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPatterns.map((item) => {
                  const p = item.patterns;
                  const img = p.image_urls?.[0] || p.image_url || fallbackImage;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        <Image
                          src={img}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <button
                          onClick={() => handleRemoveSaved(item.id)}
                          title="Remove from saved"
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-sm transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{p.category || 'Crochet'}</span>
                            <span className="font-semibold text-gray-700">
                              {p.difficulty_level || 'Beginner'}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-1">
                            {p.title}
                          </h3>
                        </div>

                        <Link
                          href={`/pattern/${p.slug || p.id}`}
                          className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-[#D97757] text-white hover:bg-[#C26243] transition-colors shadow-sm"
                        >
                          Continue Crocheting →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
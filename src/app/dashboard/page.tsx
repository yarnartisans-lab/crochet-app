'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function DesignerDashboard() {
  const supabase = createClient();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalViews: 0,
    affiliateClicks: 0
  });

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (profileData?.username) {
          setUsername(profileData.username);
        }

        const { data } = await supabase
          .from('patterns')
          .select('*')
          .eq('designer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (data) {
          setPatterns(data);
          let views = 0;
          let clicks = 0;
          data.forEach(pattern => {
            views += pattern.views || 0;
            clicks += pattern.outbound_clicks || 0;
          });
          setStats({ totalViews: views, affiliateClicks: clicks });
        }
      }
      setLoading(false);
    }
    loadUserData();
  }, []);

  const handleDelete = async (patternId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this pattern? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      // 1. Delete associated steps first
      const { error: stepsError } = await supabase
        .from('pattern_steps')
        .delete()
        .eq('pattern_id', patternId);

      if (stepsError) throw stepsError;

      // 2. Now delete the main pattern AND ask Supabase to return the deleted row
      const { error: patternError, data: deletedPattern } = await supabase
        .from('patterns')
        .delete()
        .eq('id', patternId)
        .select();

      if (patternError) throw patternError;
      
      // 3. The Smart Check: If data is empty, RLS silently blocked the deletion
      if (!deletedPattern || deletedPattern.length === 0) {
        throw new Error("Database blocked the deletion. Please check your Supabase RLS policies.");
      }

      // If we made it here, it truly deleted. Remove it from the UI instantly.
      setPatterns((prevPatterns) => prevPatterns.filter((p) => p.id !== patternId));
    } catch (error: any) {
      console.error('Error deleting pattern:', error);
      alert(`Failed to delete pattern: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold tracking-tighter">
              Crpapo <span className="text-[#D97757]">Creators</span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            
            <Link href="/" className="rounded-md bg-white border border-gray-200 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Home
            </Link>

            {username && (
              <Link href={`/creator/${username}`} className="rounded-md bg-white border border-gray-200 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                View My Profile
              </Link>
            )}

            <Link href="/publish" className="rounded-md bg-[#D97757] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C26243] transition-colors">
              + New Pattern
            </Link>
            
            <Link href="/settings" className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-[#D97757] transition-all">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Overview</h1>
            <p className="text-gray-500 mt-1">Track your pattern performance and affiliate conversions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Pattern Views</p>
              <p className="text-4xl font-bold">{stats.totalViews}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-full text-blue-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Affiliate Link Clicks</p>
              <p className="text-4xl font-bold">{stats.affiliateClicks}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-full text-green-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold">Your Patterns</h2>
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
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading your patterns...</td></tr>
                ) : patterns.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">You haven't published any patterns yet.</td></tr>
                ) : (
                  patterns.map((pattern) => (
                    <tr key={pattern.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{pattern.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {pattern.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{pattern.views || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{pattern.outbound_clicks || 0}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(pattern.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <Link href={`/edit/${pattern.id}`} className="text-gray-500 font-medium hover:text-gray-900">Edit</Link>
                        {/* NEW: Pointing the view link to the slug with an ID fallback */}
                        <Link href={`/pattern/${pattern.slug || pattern.id}`} className="text-[#D97757] font-medium hover:underline">View</Link>
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
      </main>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // 🚨 IMPORTANT: Change this to the exact email you use to log into Crpapo!
  const ADMIN_EMAIL = 'yarnartisans@gmail.com'

  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      // 1. Security Check: Verify it is YOU
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== ADMIN_EMAIL) {
        // If anyone else tries to load this page, kick them back to the homepage
        router.push('/');
        return;
      }

      // 2. Fetch all reported patterns
      const { data } = await supabase
        .from('patterns')
        .select('*')
        .gt('report_count', 0)
        .order('report_count', { ascending: false });

      if (data) setPatterns(data);
      setLoading(false);
    }

    loadAdminData();
  }, [router]);

  const handleDismiss = async (id: string) => {
    // Reset report count to 0 to remove it from the queue
    await supabase.from('patterns').update({ report_count: 0 }).eq('id', id);
    setPatterns(patterns.filter(p => p.id !== id));
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this pattern?");
    if (confirmDelete) {
      await supabase.from('patterns').delete().eq('id', id);
      setPatterns(patterns.filter(p => p.id !== id));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] font-medium text-gray-500">Verifying Admin Access...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-red-600">Admin Moderation Queue</h1>
          <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900">← Back to Platform</Link>
        </div>

        {patterns.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-lg font-bold text-gray-400">Queue is clean.</p>
            <p className="text-sm text-gray-400 mt-1">No patterns have been reported by the community.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-xs">
                <tr>
                  <th className="p-4">Pattern Title</th>
                  <th className="p-4">Reports</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold">
                      <Link href={`/pattern/${pattern.id}`} target="_blank" className="hover:text-[#D97757] hover:underline">
                        {pattern.title} ↗
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                        {pattern.report_count}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleDismiss(pattern.id)}
                        className="text-gray-500 hover:text-gray-900 font-semibold transition-colors"
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => handleDelete(pattern.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        Delete Spam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
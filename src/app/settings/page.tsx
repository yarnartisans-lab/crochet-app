'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // Basic Profile State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | Blob | null>(null);
  
  // Social Link State
  const [instagram, setInstagram] = useState('');
  const [pinterest, setPinterest] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setUsername(data.username || user.email?.split('@')[0] || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null);
          setInstagram(data.instagram_url || '');
          setPinterest(data.pinterest_url || '');
          setYoutube(data.youtube_url || '');
          setWebsite(data.website_url || '');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            setAvatarFile(blob);
            setAvatarUrl(URL.createObjectURL(blob));
          }
          setIsCompressing(false);
        }, 'image/webp', 0.8);
      };
    };
  };

  // Smart URL Formatter
  const formatSocialLink = (input: string, domain: string) => {
    if (!input) return '';
    const clean = input.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (clean.includes(domain)) return `https://${clean}`;
    return `https://${domain}/${clean.replace(/^@/, '')}`;
  };

  const formatWebsiteLink = (input: string) => {
    if (!input) return '';
    const clean = input.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    return `https://${clean}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const fileName = `${user.id}-${Date.now()}.webp`;
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, avatarFile, { contentType: 'image/webp' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = publicUrlData.publicUrl;
        }
      }

      // Apply the smart formatting before saving to the database
      const finalInstagram = formatSocialLink(instagram, 'instagram.com');
      const finalPinterest = formatSocialLink(pinterest, 'pinterest.com');
      const finalYoutube = formatSocialLink(youtube, 'youtube.com');
      const finalWebsite = formatWebsiteLink(website);

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          username: username,
          bio: bio,
          avatar_url: finalAvatarUrl,
          instagram_url: finalInstagram,
          pinterest_url: finalPinterest,
          youtube_url: finalYoutube,
          website_url: finalWebsite,
          updated_at: new Date().toISOString()
        });
        
      if (!error) {
        // Update local state to show the newly formatted links
        setInstagram(finalInstagram);
        setPinterest(finalPinterest);
        setYoutube(finalYoutube);
        setWebsite(finalWebsite);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: error.message, type: 'error' });
      }
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This will permanently erase your profile and all your published patterns. This action cannot be undone."
    );
    
    if (!confirmDelete) return;

    setSaving(true);
    
    const { error } = await supabase.rpc('delete_user');

    if (error) {
      setMessage({ text: "Failed to delete account: " + error.message, type: 'error' });
      setSaving(false);
    } else {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]">
            ← Back to Dashboard
          </Link>
          <h1 className="font-bold tracking-tight">Crpapo Settings</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-12 space-y-8">
        
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* SECTION 1: CREATOR PROFILE */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-1">Creator Profile</h2>
              <p className="text-sm text-gray-500">Customize how crafters see you on Crpapo.</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  {isCompressing ? 'Processing...' : 'Change Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isCompressing} />
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, or GIF. Auto-compressed.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Display Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CrochetMaster99" 
                required
                className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Short Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell crafters a little bit about yourself and your patterns..." 
                rows={4}
                className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] resize-none" 
              />
            </div>
          </div>

          {/* SECTION 2: SOCIAL LINKS */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight border-b border-gray-100 pb-4">Social Links</h2>
              <p className="text-sm text-gray-500 mt-4 mb-2">Add links to your other platforms to drive traffic to your brand.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Pinterest URL</label>
              <input type="text" value={pinterest} onChange={(e) => setPinterest(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" placeholder="e.g. yourname or https://pinterest.com/yourname"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram URL</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" placeholder="e.g. yourname or https://instagram.com/yourname"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">YouTube Channel URL</label>
              <input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" placeholder="e.g. @yourname or https://youtube.com/@yourname"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Personal Website or Shop</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" placeholder="e.g. yoursite.com"/>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
            <button type="button" onClick={handleSignOut} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
              Sign Out
            </button>
            <button 
              type="submit" 
              disabled={saving || isCompressing}
              className="w-full sm:w-auto rounded-md bg-[#D97757] px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#C26243] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* SECTION 3: DANGER ZONE */}
        <div className="mt-12 bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-red-800 mb-1">Danger Zone</h2>
            <p className="text-sm text-red-600">Once you delete your account, there is no going back. Please be certain.</p>
          </div>
          <button 
            type="button" 
            onClick={handleDeleteAccount}
            disabled={saving}
            className="rounded-md bg-white border border-red-200 px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Delete My Account
          </button>
        </div>

      </main>
    </div>
  );
}
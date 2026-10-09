'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface CreatorClientProps {
  initialProfile: any;
  initialPatterns: any[];
  username: string;
}

export default function CreatorClient({
  initialProfile,
  initialPatterns,
  username,
}: CreatorClientProps) {
  const supabase = createClient();

  const [profile] = useState<any>(initialProfile);
  const [patterns] = useState<any[]>(initialPatterns);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkOwnership() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id === profile?.id) {
        setIsOwner(true);
      }
    }
    checkOwnership();
  }, [profile?.id, supabase]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tighter">
            Crpapo
          </Link>
          <Link
            href="/explore"
            className="text-sm font-semibold text-gray-500 hover:text-[#D97757]"
          >
            Explore Patterns
          </Link>
        </div>
      </nav>

      <header className="bg-white border-b border-gray-200 py-16 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          <div className="w-32 h-32 relative rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`@${profile.username}'s profile picture`}
                fill
                priority
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">@{profile.username}</h1>
              <p className="text-gray-500 font-medium mt-1">
                {patterns.length} Published Pattern{patterns.length === 1 ? '' : 's'}
              </p>
            </div>

            {profile.bio && (
              <p className="text-[#2D2D2D] leading-relaxed max-w-xl">{profile.bio}</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              {/* Creator Tip Jar Button */}
              {profile.tip_link && (
                <a
                  href={profile.tip_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-gray-900 bg-[#FFDD00] hover:bg-[#FACC15] px-4 py-1.5 rounded-full transition-colors shadow-sm flex items-center gap-1.5"
                >
                  ☕ Tip Designer
                </a>
              )}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#D97757] hover:text-[#C26243] bg-[#D97757]/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  Website
                </a>
              )}
              {profile.pinterest_url && (
                <a
                  href={profile.pinterest_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#E60023] hover:text-[#ad081b] bg-[#E60023]/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  Pinterest
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#E1306C] hover:text-[#b02251] bg-[#E1306C]/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  Instagram
                </a>
              )}
              {profile.youtube_url && (
                <a
                  href={profile.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#FF0000] hover:text-[#cc0000] bg-[#FF0000]/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  YouTube
                </a>
              )}
            </div>

            <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                {copied ? 'Link Copied!' : 'Copy Profile Link'}
              </button>

              {isOwner && (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main aria-labelledby="creator-patterns-title" className="max-w-7xl mx-auto px-6 py-16">
        <h2 id="creator-patterns-title" className="text-xl font-bold tracking-tight mb-8">
          Patterns by @{profile.username}
        </h2>

        {patterns.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            This creator hasn't published any patterns yet.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {patterns.map((pattern) => {
              const imageUrl = pattern.image_urls?.[0] || pattern.image_url || fallbackImage;
              return (
                <article key={pattern.id} className="group block break-inside-avoid">
                  <Link href={`/pattern/${pattern.slug || pattern.id}`}>
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200">
                      <Image
                        src={imageUrl}
                        alt={`Free crochet pattern: ${pattern.title}`}
                        width={600}
                        height={800}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <div className="text-white w-full">
                          <h3 className="font-bold text-lg leading-tight mb-1 truncate">
                            {pattern.title}
                          </h3>
                          <p className="text-sm opacity-90 font-medium">
                            Difficulty: {pattern.difficulty_level || 'Varies'}
                          </p>
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
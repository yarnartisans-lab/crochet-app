import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CreatorClient from './CreatorClient';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCreatorData(username: string) {
  const decodedUsername = decodeURIComponent(username);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (!profile) return { profile: null, patterns: [] };

  const { data: patterns } = await supabase
    .from('patterns')
    .select('*')
    .eq('designer_id', profile.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return { profile, patterns: patterns || [] };
}

// 1. DYNAMIC PROGRAMMATIC SEO FOR CREATORS
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const { profile, patterns } = await getCreatorData(username);

  if (!profile) {
    return {
      title: 'Creator Not Found | Crpapo',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `https://crpapo.com/creator/${encodeURIComponent(profile.username)}`;
  const title = `@${profile.username} | Crochet Designer Profile & Free Patterns | Crpapo`;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `Explore ${patterns.length} free, interactive crochet pattern${patterns.length === 1 ? '' : 's'} designed by @${profile.username} on Crpapo.`;
  const avatar = profile.avatar_url || 'https://crpapo.com/icon.png';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Crpapo',
      images: [
        {
          url: avatar,
          alt: `@${profile.username}'s profile picture`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [avatar],
    },
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { profile, patterns } = await getCreatorData(username);

  if (!profile) {
    notFound();
  }

  const fallbackImage =
    'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  // 1. E-E-A-T ProfilePage / Person Schema
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.username,
      description:
        profile.bio ||
        `Crochet designer and creator of ${patterns.length} pattern${patterns.length === 1 ? '' : 's'} on Crpapo.`,
      image: profile.avatar_url || fallbackImage,
      sameAs: [
        profile.website_url,
        profile.pinterest_url,
        profile.instagram_url,
        profile.youtube_url,
      ].filter(Boolean),
    },
  };

  // 2. ItemList Schema for creator's published patterns
  const itemListSchema =
    patterns.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: patterns.map((pattern: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://crpapo.com/pattern/${pattern.slug || pattern.id}`,
            name: pattern.title,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <CreatorClient
        initialProfile={profile}
        initialPatterns={patterns}
        username={profile.username}
      />
    </>
  );
}
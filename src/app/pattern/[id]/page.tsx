import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PatternClient from './PatternClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// UPDATED: Await the params Promise to satisfy Next.js 15 requirements
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // 1. Unwrap the promise first
  const resolvedParams = await params;

  // 2. Now use the resolved ID
  const { data: pattern } = await supabase
    .from('patterns')
    .select('title, image_url, image_urls, designer_id')
    .eq('id', resolvedParams.id)
    .single();

  if (!pattern) {
    return { title: 'Pattern Not Found | Crpapo' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', pattern.designer_id)
    .single();

  const designerName = profile?.username || 'a creator';
  const imageUrl = pattern.image_urls?.[0] || pattern.image_url || 'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';

  return {
    title: `${pattern.title} | Crpapo`,
    description: `Get the row-by-row pattern for ${pattern.title} by @${designerName} on Crpapo. Track your rows without losing your place.`,
    openGraph: {
      title: `${pattern.title} | Crpapo`,
      description: `Interactive pattern by @${designerName}. Track your rows without losing your place.`,
      images: [imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pattern.title} | Crpapo`,
      description: `Interactive pattern by @${designerName}. Track your rows without losing your place.`,
      images: [imageUrl],
    }
  };
}

export default function PatternPage() {
  return <PatternClient />;
}
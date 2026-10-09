import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PatternClient from './PatternClient';

// Revalidate every 60 seconds (ISR) for fast TTFB while keeping data fresh for crawlers
export const revalidate = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper check to verify if a string is a standard Supabase UUID
const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function getPatternData(slug: string) {
  const query = isUuid(slug)
    ? supabase.from('patterns').select('*').eq('id', slug).single()
    : supabase.from('patterns').select('*').eq('slug', slug).single();

  const { data: pattern } = await query;
  return pattern;
}

// 1. DYNAMIC METADATA & OPEN GRAPH WITH RICH IMAGE ATTRIBUTION
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternData(slug);

  if (!pattern) {
    return {
      title: 'Pattern Not Found | Crpapo',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', pattern.designer_id)
    .single();

  const designerName = profile?.username || 'Creator';
  const category = pattern.category || 'Craft';
  const allImages: string[] = pattern.image_urls && pattern.image_urls.length > 0
    ? pattern.image_urls
    : pattern.image_url
    ? [pattern.image_url]
    : [];
  const mainImage = allImages[0] || 'https://crpapo.com/icon.png';
  const canonicalUrl = `https://crpapo.com/pattern/${pattern.slug || slug}`;

  const categoryContext = pattern.category ? pattern.category.toLowerCase() : 'crochet';
  const difficultyContext = pattern.difficulty_level ? `for ${pattern.difficulty_level.toLowerCase()}s` : '';
  const hookContext = pattern.hook_size ? `using ${pattern.hook_size} hook` : '';
  const imageAltDescription = `Free ${pattern.title} ${categoryContext} pattern ${difficultyContext} ${hookContext} designed by @${designerName} on Crpapo.`.replace(/\s+/g, ' ').trim();

  return {
    title: `${pattern.title} | Free ${category} Pattern by @${designerName} | Crpapo`,
    description: `Learn how to make this ${pattern.difficulty_level || 'beautiful'} ${pattern.title}. Free interactive pattern with step-by-step instructions, materials needed, and video tutorials.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free pattern by @${designerName}.`,
      url: canonicalUrl,
      siteName: 'Crpapo',
      images: allImages.length > 0
        ? allImages.map((imgUrl, idx) => ({
            url: imgUrl,
            width: 1200,
            height: 1200,
            alt: idx === 0 ? imageAltDescription : `${pattern.title} detailed crochet view ${idx + 1}`,
          }))
        : [{ url: mainImage, width: 512, height: 512, alt: pattern.title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free step-by-step pattern.`,
      images: [mainImage],
    },
  };
}

export default async function PatternPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = await getPatternData(slug);

  if (!pattern) {
    notFound();
  }

  // Fetch designer (including tip_link), steps, and related patterns in parallel on the server
  const [profileRes, stepsRes, relatedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, tip_link')
      .eq('id', pattern.designer_id)
      .single(),
    supabase
      .from('pattern_steps')
      .select('*')
      .eq('pattern_id', pattern.id)
      .order('step_number', { ascending: true }),
    supabase
      .from('patterns')
      .select('id, title, slug, image_url, image_urls, category, difficulty_level')
      .eq('is_published', true)
      .neq('id', pattern.id)
      .limit(3),
  ]);

  const designerName = profileRes.data?.username || 'Creator';
  const designerTipLink = profileRes.data?.tip_link || null;
  const steps = stepsRes.data || [];
  const relatedPatterns = relatedRes.data || [];

  const pageUrl = `https://crpapo.com/pattern/${pattern.slug || slug}`;
  const allImages: string[] = pattern.image_urls && pattern.image_urls.length > 0
    ? pattern.image_urls
    : pattern.image_url
    ? [pattern.image_url]
    : [];

  const categoryContext = pattern.category ? pattern.category.toLowerCase() : 'crochet';
  const difficultyContext = pattern.difficulty_level ? `for ${pattern.difficulty_level.toLowerCase()}s` : '';
  const hookContext = pattern.hook_size ? `using ${pattern.hook_size} hook` : '';
  const semanticAlt = `Free ${pattern.title} ${categoryContext} pattern ${difficultyContext} ${hookContext} designed by @${designerName} on Crpapo.`.replace(/\s+/g, ' ').trim();

  // STRUCTURED DATA (JSON-LD)
  const schemas: any[] = [];

  // 1. Breadcrumb Schema
  const breadcrumbItems: any[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://crpapo.com/' },
    { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://crpapo.com/explore' },
  ];

  let currentPosition = 3;

  if (pattern.category) {
    const isAmigurumi =
      pattern.category.toLowerCase() === 'amigurumi / plushies' ||
      pattern.category.toLowerCase() === 'amigurumi' ||
      pattern.category.toLowerCase() === 'amigurumi/plushies';
    const catSlug = isAmigurumi
      ? 'amigurumi'
      : pattern.category.toLowerCase().replace(/\s*\/\s*|\s+/g, '-');

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: currentPosition,
      name: pattern.category,
      item: `https://crpapo.com/category/${catSlug}`,
    });
    currentPosition++;
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: currentPosition,
    name: pattern.title,
    item: pageUrl,
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  });

  // 2. HowTo Schema with Explicit Primary & Multi-Image Gallery for Google Image Search
  if (steps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: pattern.title,
      description: `Step-by-step instructions for ${pattern.title}. Free interactive pattern with row tracking.`,
      image: allImages.length > 0 ? allImages : ['https://crpapo.com/icon.png'],
      tool: [
        {
          '@type': 'HowToTool',
          name: pattern.hook_size ? `Crochet Hook size ${pattern.hook_size}` : 'Crochet Hook',
        },
      ],
      supply: [
        {
          '@type': 'HowToSupply',
          name: pattern.yarn_weight ? `${pattern.yarn_weight} Yarn` : 'Yarn',
        },
      ],
      step: steps.map((s: any, i: number) => ({
        '@type': 'HowToStep',
        name: `Row or Step ${i + 1}`,
        position: i + 1,
        text: s.instruction,
        url: `${pageUrl}#step-${i + 1}`,
        ...(allImages[i] ? { image: allImages[i] } : {}),
      })),
    });
  }

  // 3. ImageObject Schema specifically indexing the primary finished work in Google Images
  if (allImages.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      contentUrl: allImages[0],
      url: allImages[0],
      name: `${pattern.title} finished crochet pattern`,
      description: semanticAlt,
      caption: `${pattern.title} - free interactive pattern on Crpapo`,
      author: {
        '@type': 'Person',
        name: designerName,
      },
      copyrightHolder: {
        '@type': 'Person',
        name: designerName,
      },
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <PatternClient
        initialPattern={pattern}
        initialDesignerName={designerName}
        initialDesignerTipLink={designerTipLink}
        initialSteps={steps}
        initialRelatedPatterns={relatedPatterns}
        slug={slug}
      />
    </>
  );
}
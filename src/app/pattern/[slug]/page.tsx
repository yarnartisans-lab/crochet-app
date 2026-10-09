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

// 1. DYNAMIC METADATA & OPEN GRAPH
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
  const mainImage = pattern.image_urls?.[0] || pattern.image_url || '';
  const canonicalUrl = `https://crpapo.com/pattern/${pattern.slug || slug}`;

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
      images: mainImage ? [{ url: mainImage, alt: pattern.title }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free step-by-step pattern.`,
      images: mainImage ? [mainImage] : [],
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

  // Fetch designer, steps, and related patterns in parallel on the server
  const [profileRes, stepsRes, relatedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('username')
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
  const steps = stepsRes.data || [];
  const relatedPatterns = relatedRes.data || [];

  // Structured Data (JSON-LD)
  const schemas: any[] = [];
  const pageUrl = `https://crpapo.com/pattern/${pattern.slug || slug}`;

  // Breadcrumb Schema
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://crpapo.com/' },
    { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://crpapo.com/explore' },
  ];

  let currentPosition = 3;
  if (pattern.category) {
    const isAmigurumi =
      pattern.category.toLowerCase() === 'amigurumi / plushies' ||
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

  // HowTo Schema for Step-by-Step Instructions
  if (steps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: pattern.title,
      description: `Step-by-step instructions for ${pattern.title}`,
      image: pattern.image_urls?.[0] || pattern.image_url || '',
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
      })),
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
        initialSteps={steps}
        initialRelatedPatterns={relatedPatterns}
        slug={slug}
      />
    </>
  );
}
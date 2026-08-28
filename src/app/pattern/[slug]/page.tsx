import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PatternClient from './PatternClient';

// BYPASS NEXT.JS CACHE: Forces the server to fetch fresh SEO data for Google
export const dynamic = 'force-dynamic';

// Using standard Supabase client for Server-Side fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper check to verify if a string is a standard Supabase UUID
const isUuid = (str: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// 1. PROGRAMMATIC SEO: Generate dynamic titles, descriptions, AND Social Cards
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const query = isUuid(slug) 
    ? supabase.from('patterns').select('*').eq('id', slug).single()
    : supabase.from('patterns').select('*').eq('slug', slug).single();

  const { data: pattern } = await query;

  if (!pattern) {
    return { title: 'Pattern Not Found | Crpapo' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', pattern.designer_id)
    .single();

  const designerName = profile?.username || 'Creator';
  const category = pattern.category || 'Craft';
  const mainImage = pattern.image_urls?.[0] || pattern.image_url || '';

  return {
    title: `${pattern.title} | Free ${category} Pattern by @${designerName} | Crpapo`,
    description: `Learn how to make this ${pattern.difficulty_level || 'beautiful'} ${pattern.title}. Free interactive pattern with step-by-step instructions, materials needed, and video tutorials.`,
    
    // THE SEO SHIELD: Tells Google the exact, clean URL to index
    alternates: {
      canonical: `https://crpapo.com/pattern/${pattern.slug || slug}`,
    },
    
    openGraph: {
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free pattern by @${designerName}.`,
      images: mainImage ? [mainImage] : [],
      type: 'article',
    },

    // ADDED: Crucial for rich preview cards on Pinterest, Twitter, and Discord
    twitter: {
      card: 'summary_large_image',
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free step-by-step pattern.`,
      images: mainImage ? [mainImage] : [],
    }
  };
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch data specifically for the AI Schema using the SLUG or ID
  const query = isUuid(slug) 
    ? supabase.from('patterns').select('*').eq('id', slug).single()
    : supabase.from('patterns').select('*').eq('slug', slug).single();

  const { data: pattern } = await query;

  let schemasCode = null;

  if (pattern) {
    const schemas: any[] = []; 

    // 2. BREADCRUMB SCHEMA
    const breadcrumbItems = [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://crpapo.com/" },
      { "@type": "ListItem", "position": 2, "name": "Explore", "item": "https://crpapo.com/explore" }
    ];

    let currentPosition = 3;
    if (pattern.category) {
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": currentPosition,
        "name": pattern.category,
        "item": `https://crpapo.com/explore?category=${encodeURIComponent(pattern.category)}`
      });
      currentPosition++;
    }

    breadcrumbItems.push({
      "@type": "ListItem",
      "position": currentPosition,
      "name": pattern.title,
      "item": `https://crpapo.com/pattern/${pattern.slug || slug}`
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    });

    // Fetch steps using the pattern's internal ID
    const { data: steps } = await supabase
      .from('pattern_steps')
      .select('*')
      .eq('pattern_id', pattern.id)
      .order('step_number', { ascending: true });

    // 3. AEO/AIO OPTIMIZATION: Build the Strict HowTo JSON-LD Schema
    if (steps) {
      const pageUrl = `https://crpapo.com/pattern/${pattern.slug || slug}`;
      
      schemas.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": pattern.title,
        "description": `Step-by-step instructions for ${pattern.title}`,
        "image": pattern.image_urls?.[0] || pattern.image_url || "",
        
        // Google requires specific distinction between Tools (hook) and Supplies (yarn)
        "tool": [
          { "@type": "HowToTool", "name": pattern.hook_size ? `Crochet Hook size ${pattern.hook_size}` : "Crochet Hook" }
        ],
        "supply": [
          { "@type": "HowToSupply", "name": pattern.yarn_weight ? `${pattern.yarn_weight} Yarn` : "Yarn" }
        ],
        
        // Structured steps allow Voice Assistants to read the pattern row-by-row
        "step": steps.map((s: any, i: number) => ({
          "@type": "HowToStep",
          "name": `Row or Step ${i + 1}`,
          "position": i + 1,
          "text": s.instruction,
          "url": `${pageUrl}#step-${i + 1}` // Allows Google to deep-link straight to a specific row
        }))
      });
    }
    
    // Stringify the array of schemas
    schemasCode = JSON.stringify(schemas);
  }

  return (
    <>
      {/* Inject the hidden schemas for Google AI, Perplexity, and ChatGPT */}
      {schemasCode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemasCode }}
        />
      )}
      
      {/* Load the interactive client application */}
      <PatternClient />
    </>
  );
}
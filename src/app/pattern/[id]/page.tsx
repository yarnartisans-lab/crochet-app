import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PatternClient from './PatternClient';

// Using standard standard Supabase client for Server-Side fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. PROGRAMMATIC SEO: Generate dynamic titles and descriptions
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: pattern } = await supabase
    .from('patterns')
    .select('*')
    .eq('id', params.id)
    .single();

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

  return {
    title: `${pattern.title} | Free ${category} Pattern by @${designerName} | Crpapo`,
    description: `Learn how to make this ${pattern.difficulty_level || 'beautiful'} ${pattern.title}. Free interactive pattern with step-by-step instructions, materials needed, and video tutorials.`,
    openGraph: {
      title: `${pattern.title} | Interactive Pattern | Crpapo`,
      description: `Track your rows interactively! Free pattern by @${designerName}.`,
      images: pattern.image_urls?.[0] || pattern.image_url ? [pattern.image_urls?.[0] || pattern.image_url] : [],
    }
  };
}

export default async function PatternPage({ params }: { params: { id: string } }) {
  // Fetch data specifically for the AI Schema
  const { data: pattern } = await supabase.from('patterns').select('*').eq('id', params.id).single();
  const { data: steps } = await supabase.from('pattern_steps').select('*').eq('pattern_id', params.id).order('step_number', { ascending: true });

  let schemaCode = null;

  // 2. AEO/AIO OPTIMIZATION: Build the HowTo JSON-LD Schema
  if (pattern && steps) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": pattern.title,
      "description": `Step-by-step instructions for ${pattern.title}`,
      "image": pattern.image_urls?.[0] || pattern.image_url || "",
      "tool": [
        { "@type": "HowToTool", "name": pattern.hook_size || "Crochet Hook / Knitting Needles" },
        { "@type": "HowToTool", "name": pattern.yarn_weight || "Yarn" }
      ],
      "step": steps.map((s: any, i: number) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "text": s.instruction
      }))
    };
    schemaCode = JSON.stringify(schema);
  }

  return (
    <>
      {/* Inject the hidden schema for Google AI, Perplexity, and ChatGPT */}
      {schemaCode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaCode }}
        />
      )}
      
      {/* Load the interactive client application */}
      <PatternClient />
    </>
  );
}
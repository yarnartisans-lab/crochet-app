'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function PatternClient() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  
  const [pattern, setPattern] = useState<any>(null);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedRows, setCompletedRows] = useState<number[]>([]);
  const [designerName, setDesignerName] = useState<string>('Anonymous');
  
  // State to hold our internal links
  const [relatedPatterns, setRelatedPatterns] = useState<any[]>([]);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReported, setIsReported] = useState(false);

  useEffect(() => {
    async function fetchPatternData() {
      if (!slug) return;

      // NEW: Helper check to verify if the slug is actually a UUID ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      // NEW: Dynamic query based on whether it's an ID or a Slug
      const query = isUuid
        ? supabase.from('patterns').select('*').eq('id', slug).single()
        : supabase.from('patterns').select('*').eq('slug', slug).single();

      const { data: patternData } = await query;

      if (patternData) {
        setPattern(patternData);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', patternData.designer_id)
          .single();
          
        if (profileData?.username) {
          setDesignerName(profileData.username);
        }

        await supabase.rpc('increment_views', { pattern_id: patternData.id });
        
        const { data: stepsData } = await supabase
          .from('pattern_steps')
          .select('*')
          .eq('pattern_id', patternData.id)
          .order('step_number', { ascending: true });

        if (stepsData) {
          setInstructions(stepsData);
        }

        // --- DYNAMIC INTERNAL LINKING ENGINE ---
        // Fetch 3 other published patterns to pass SEO authority
        const { data: relatedData } = await supabase
          .from('patterns')
          .select('id, title, slug, image_url, image_urls, category, difficulty_level')
          .eq('is_published', true)
          .neq('id', patternData.id) // Exclude the pattern we are currently looking at
          .limit(3);

        if (relatedData) {
          setRelatedPatterns(relatedData);
        }
      }
      setLoading(false);
    }

    fetchPatternData();
  }, [slug]);

  useEffect(() => {
    if (slug) {
      const savedProgress = localStorage.getItem(`pattern_progress_${slug}`);
      if (savedProgress) setCompletedRows(JSON.parse(savedProgress));
    }
  }, [slug]);

  const toggleRow = (index: number) => {
    let newCompletedRows;
    if (completedRows.includes(index)) {
      newCompletedRows = completedRows.filter((i) => i !== index);
    } else {
      newCompletedRows = [...completedRows, index];
    }
    setCompletedRows(newCompletedRows);
    if (slug) {
      localStorage.setItem(`pattern_progress_${slug}`, JSON.stringify(newCompletedRows));
    }
  };

  const handleOutboundClick = async () => {
    if (pattern?.id) {
      await supabase.rpc('increment_clicks', { pattern_id: pattern.id });
    }
  };

  const handleReport = async () => {
    if (!pattern?.id || isReported) return;
    setIsReported(true);
    await supabase.rpc('increment_reports', { pattern_id: pattern.id });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium bg-[#FAFAF9]">Loading pattern...</div>;
  if (!pattern) return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium bg-[#FAFAF9]">Pattern not found.</div>;

  const progressPercentage = instructions.length === 0 ? 0 : Math.round((completedRows.length / instructions.length) * 100);
  const fallbackImage = 'https://images.unsplash.com/photo-1605335123403-5188147dccdf?q=80&w=800&auto=format&fit=crop';
  
  const images = pattern.image_urls && pattern.image_urls.length > 0 
    ? pattern.image_urls 
    : [pattern.image_url || fallbackImage];

  const categoryContext = pattern.category ? pattern.category.toLowerCase() : 'crochet';
  const difficultyContext = pattern.difficulty_level ? `for ${pattern.difficulty_level.toLowerCase()}s` : '';
  const seoAltText = `Free step-by-step ${categoryContext} pattern for ${pattern.title} ${difficultyContext}.`;

  return (
    <div 
      className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]">← Back to Patterns</Link>
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-[#D97757] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="text-xs font-bold text-gray-500">{progressPercentage}%</span>
        </div>
        <button className="text-sm font-semibold text-gray-400 cursor-default">Auto-Saved</button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <aside className="md:col-span-1 space-y-6">
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                <Image 
                  src={images[currentImageIndex]} 
                  alt={seoAltText} 
                  fill 
                  className="object-cover transition-opacity duration-300 pointer-events-none" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-[#D97757] ring-2 ring-[#D97757]/20 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <Image 
                        src={img} 
                        alt={`Detailed view ${idx + 1} of ${pattern.title} pattern`} 
                        fill 
                        className="object-cover pointer-events-none" 
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">{pattern.title}</h1>
              <Link href={`/creator/${designerName}`} className="inline-block text-[#D97757] font-semibold text-sm hover:underline hover:text-[#C26243] transition-colors">
                By @{designerName}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <p className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-1">Difficulty</p>
                <p className="font-semibold">{pattern.difficulty_level || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-1">Hook</p>
                <p className="font-semibold">{pattern.hook_size || 'Not specified'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-1">Yarn</p>
                <p className="font-semibold">{pattern.yarn_weight || 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a 
                href={pattern.affiliate_link || '#'} 
                target="_blank"
                rel="nofollow ugc noopener noreferrer"
                onClick={handleOutboundClick}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all shadow-sm
                  ${pattern.affiliate_link ? 'bg-[#146b53] text-white hover:bg-[#0f5441] hover:shadow-md' : 'hidden'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Buy Recommended Yarn
              </a>

              <a 
                href={pattern.video_link || '#'} 
                target="_blank"
                rel="nofollow ugc noopener noreferrer"
                onClick={handleOutboundClick}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all border-2
                  ${pattern.video_link ? 'border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000] hover:text-white' : 'hidden'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385-8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
                Watch Video Tutorial
              </a>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button 
                onClick={handleReport}
                disabled={isReported}
                className={`text-xs font-semibold flex items-center justify-center gap-1.5 w-full transition-colors ${isReported ? 'text-gray-300 cursor-default' : 'text-gray-400 hover:text-red-500'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                {isReported ? 'Report Sent to Admin' : 'Report this Pattern'}
              </button>
            </div>
          </aside>

          <section className="md:col-span-2 select-none">
            {(pattern.materials || pattern.abbreviations) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {pattern.materials && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-[#D97757] uppercase tracking-wider mb-3">Materials Needed</h3>
                    <div className="text-sm text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">
                      {pattern.materials}
                    </div>
                  </div>
                )}
                {pattern.abbreviations && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-[#D97757] uppercase tracking-wider mb-3">Abbreviations</h3>
                    <div className="text-sm text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">
                      {pattern.abbreviations}
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6">Instructions</h2>
            <div className="space-y-3">
              {instructions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">No instructions found.</div>
              ) : (
                instructions.map((step, index) => {
                  const isComplete = completedRows.includes(index);
                  return (
                    <div key={step.id || index} onClick={() => toggleRow(index)} className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ease-in-out ${isComplete ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-gray-100 shadow-sm hover:border-[#D97757] hover:shadow-md'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${isComplete ? 'bg-[#D97757] border-[#D97757]' : 'border-gray-300'}`}>
                          {isComplete && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isComplete ? 'text-gray-400' : 'text-[#D97757]'}`}>Row {step.step_number}</span>
                          <p className={`text-lg leading-relaxed ${isComplete ? 'line-through text-gray-400' : 'text-[#2D2D2D]'}`}>{step.instruction}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* DYNAMIC INTERNAL LINKING UI */}
        {relatedPatterns.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPatterns.map((related) => {
                const relImgUrl = related.image_urls?.[0] || related.image_url || fallbackImage;
                const relCategory = related.category ? related.category.toLowerCase() : 'crochet';
                const relAltText = `Free ${relCategory} pattern for ${related.title}`;
                
                return (
                  <Link key={related.id} href={`/pattern/${related.slug}`} className="group block break-inside-avoid">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-200 aspect-[4/5]">
                      <Image 
                        src={relImgUrl} 
                        alt={relAltText} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="text-white w-full">
                          <p className="font-bold text-sm sm:text-base leading-tight mb-1 truncate">{related.title}</p>
                          <span className="text-[10px] sm:text-xs font-bold px-2 py-1 bg-white/20 rounded-md backdrop-blur-sm whitespace-nowrap inline-block mt-1">
                            {related.difficulty_level || 'Varies'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
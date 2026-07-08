'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function EditPattern() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form data states
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [hookSize, setHookSize] = useState('');
  const [yarn, setYarn] = useState('');
  const [rawText, setRawText] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  
  // Multi-Image states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{file: Blob, preview: string}[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const parsedRows = rawText.split('\n').filter(line => line.trim() !== '');

  // 1. Fetch Existing Data on Load
  useEffect(() => {
    async function fetchExistingPattern() {
      if (!params.id) return;
      
      const { data: pattern } = await supabase
        .from('patterns')
        .select('*')
        .eq('id', params.id)
        .single();

      if (pattern) {
        setTitle(pattern.title || '');
        setDifficulty(pattern.difficulty_level || 'Beginner');
        setHookSize(pattern.hook_size || '');
        setYarn(pattern.yarn_weight || '');
        setAffiliateLink(pattern.affiliate_link || '');
        setYoutubeLink(pattern.video_link || '');
        
        // Load existing images
        if (pattern.image_urls && pattern.image_urls.length > 0) {
          setExistingImages(pattern.image_urls);
        } else if (pattern.image_url) {
          setExistingImages([pattern.image_url]);
        }

        // Fetch instructions and rebuild the raw text box
        const { data: steps } = await supabase
          .from('pattern_steps')
          .select('*')
          .eq('pattern_id', pattern.id)
          .order('step_number', { ascending: true });

        if (steps && steps.length > 0) {
          const rebuiltText = steps.map(s => s.instruction).join('\n');
          setRawText(rebuiltText);
        }
      }
      setIsLoading(false);
    }
    
    fetchExistingPattern();
  }, [params.id]);

  // Image handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrentImages = existingImages.length + newImages.length;
    
    if (totalCurrentImages + files.length > 4) {
      alert("You can only have up to 4 images total.");
      return;
    }

    setIsCompressing(true);
    const compressedFiles: {file: Blob, preview: string}[] = [];

    for (const file of files) {
      const compressedImage = await new Promise<{file: Blob, preview: string}>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
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
                resolve({ file: blob, preview: URL.createObjectURL(blob) });
              }
            }, 'image/webp', 0.8);
          };
        };
      });
      compressedFiles.push(compressedImage);
    }

    setNewImages(prev => [...prev, ...compressedFiles]);
    setIsCompressing(false);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  // 2. Handle the Update
  const handleUpdate = async () => {
    setIsPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      let finalUrls = [...existingImages];

      // Upload any newly added images
      for (let i = 0; i < newImages.length; i++) {
        const fileName = `${user.id}-${Date.now()}-${i}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('pattern_images')
          .upload(fileName, newImages[i].file, { contentType: 'image/webp' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('pattern_images').getPublicUrl(fileName);
          finalUrls.push(publicUrlData.publicUrl);
        }
      }

      const mainImageUrl = finalUrls.length > 0 ? finalUrls[0] : null;

      // Update main pattern record
      const { error: patternError } = await supabase
        .from('patterns')
        .update({
          title: title || 'Untitled Pattern',
          difficulty_level: difficulty,
          hook_size: hookSize,
          yarn_weight: yarn,
          affiliate_link: affiliateLink,
          video_link: youtubeLink,
          image_url: mainImageUrl, 
          image_urls: finalUrls,   
        })
        .eq('id', params.id);

      if (patternError) throw patternError;

      // Update Instructions 
      if (parsedRows.length > 0) {
        await supabase.from('pattern_steps').delete().eq('pattern_id', params.id);

        const stepsToInsert = parsedRows.map((instruction, index) => ({
          pattern_id: params.id,
          step_number: index + 1,
          instruction: instruction.trim(),
          section_name: 'Main'
        }));

        await supabase.from('pattern_steps').insert(stepsToInsert);
      }

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Update error:", error.message);
      alert("Error updating pattern. Check console.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">Loading pattern data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]">← Cancel</Link>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
        </div>
        <button className="text-sm font-semibold text-[#D97757]">Editing Pattern</button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        
        {/* STEP 1: Basics */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 animation-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Update the basics.</h1>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Photos ({existingImages.length + newImages.length}/4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Existing Images */}
                  {existingImages.map((url, index) => (
                    <div key={`exist-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group">
                      <img src={url} alt="Saved" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingImage(index)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Newly Uploaded Images */}
                  {newImages.map((img, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-400 group">
                      <img src={img.preview} alt="New Preview" className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  {(existingImages.length + newImages.length) < 4 && (
                    <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#D97757] hover:bg-[#D97757]/5 transition-colors bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 text-center px-2">
                        {isCompressing ? 'Processing...' : '+ Add Photo'}
                      </span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={isCompressing} />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Pattern Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]">
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Hook Size</label>
                  <input type="text" value={hookSize} onChange={(e) => setHookSize(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Yarn Weight & Brand</label>
                <input type="text" value={yarn} onChange={(e) => setYarn(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="rounded-md bg-[#D97757] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C26243]">Next: Edit Instructions</button>
            </div>
          </div>
        )}

        {/* STEP 2: Instructions */}
        {step === 2 && (
          <div className="space-y-8 animation-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Raw Text</label>
                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="flex-1 w-full rounded-2xl border-0 p-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] resize-none font-mono text-sm leading-relaxed" />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-[#D97757]">Preview</label>
                <div className="flex-1 w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-6 overflow-y-auto space-y-3">
                  {parsedRows.map((row, idx) => (
                    <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 bg-white shadow-sm flex items-start gap-4">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5"></div>
                      <p className="text-[#2D2D2D] leading-relaxed">{row}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between max-w-2xl mx-auto pt-4">
              <button onClick={() => setStep(1)} className="text-sm font-semibold text-gray-500">← Back</button>
              <button onClick={() => setStep(3)} className="rounded-md bg-[#D97757] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C26243]">Next: Monetization</button>
            </div>
          </div>
        )}

        {/* STEP 3: Monetization (Danger Zone Removed) */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-8 animation-fade-in">
            <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Yarn Affiliate Link</label>
                <input type="url" value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">YouTube Tutorial Link</label>
                <input type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>
            </div>
            
            <div className="flex justify-between pt-4 pb-8">
              <button onClick={() => setStep(2)} className="text-sm font-semibold text-gray-500">← Back</button>
              <button onClick={handleUpdate} disabled={isPublishing} className="rounded-md bg-[#D97757] px-10 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C26243] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isPublishing ? 'Saving...' : 'Save Changes 💾'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}